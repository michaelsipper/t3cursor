// api/discovery/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import vision from '@google-cloud/vision';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { verifyToken } from "@/app/api/middleware/auth";

if (!process.env.GOOGLE_CLOUD_PROJECT_ID || 
    !process.env.GOOGLE_CLOUD_PRIVATE_KEY || 
    !process.env.GOOGLE_CLOUD_CLIENT_EMAIL || 
    !process.env.OPENAI_API_KEY) {
  throw new Error('Some required environment variables are missing');
}

const visionClient = new vision.ImageAnnotatorClient({
  credentials: {
    project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
    private_key: (process.env.GOOGLE_CLOUD_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
  },
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function parseDateTimeString(dateTimeString: string | undefined): string | null {
  if (!dateTimeString) return null;
  try {
    const date = new Date(dateTimeString);
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch (error) {
    console.error('Date parsing error:', error);
    return null;
  }
}

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script and style tags
    $('script').remove();
    $('style').remove();

    // Extract meaningful content
    const title = $('title').text();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const h1 = $('h1').text();
    const mainContent = $('main').text() || $('article').text() || $('body').text();

    // Combine the extracted content
    return `
      Title: ${title}
      Description: ${metaDescription}
      Heading: ${h1}
      Content: ${mainContent.substring(0, 1000)}
    `.trim();
  } catch (error) {
    console.error('Error fetching URL:', error);
    throw new Error('Failed to fetch URL content');
  }
}

export async function POST(req: NextRequest) { // Change Request to NextRequest
  console.log('API endpoint hit for event processing');

  try {
    // Now cookies will be recognized
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    verifyToken(token);

    const formData = await req.formData();
    const url = formData.get('url') as string | null;
    const file = formData.get('image') as File | null;

    let extractedText = '';

    if (url) {
      console.log('Processing URL:', url);
      extractedText = await fetchUrlContent(url);
    }

    if (file) {
      console.log('Processing file:', file.name);
      const buffer = Buffer.from(await file.arrayBuffer());
      const [result] = await visionClient.textDetection(buffer);
      const detections = result.textAnnotations;
      extractedText = detections && detections[0]?.description ? detections[0].description : '';
    }

    if (!extractedText) {
      return NextResponse.json({ error: 'No text extracted' }, { status: 400 });
    }

    console.log('Extracted text:', extractedText);

    const systemPrompt = `Extract the event details from the text in JSON format with these fields:
    {
      "title": "string (required)",
      "datetime": "string in ISO format if possible, otherwise a readable date",
      "location": {
        "name": "string (required)",
        "address": "string (optional)"
      },
      "description": "string",
      "type": "either 'social', 'business', or 'entertainment'"
    }
    
    Important: Always return valid JSON without markdown formatting. Ensure title and location.name are always present.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: extractedText },
      ],
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for more consistent formatting
    });

    const gptContent = response.choices[0]?.message?.content || '{}';

    let eventData;
    try {
      // Remove any markdown formatting and clean the response
      const cleanedContent = gptContent.replace(/```json\n|\n```|```/g, '').trim();
      eventData = JSON.parse(cleanedContent);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      console.log('OpenAI response content:', gptContent);
      return NextResponse.json({ error: 'Error parsing response from OpenAI' }, { status: 500 });
    }

    // Validate required fields
    if (!eventData.title || !eventData.location?.name) {
      return NextResponse.json({ 
        error: 'Missing required fields in processed data',
        details: 'Title and location name are required'
      }, { status: 400 });
    }

    const formattedData = {
      title: eventData.title,
      datetime: parseDateTimeString(eventData.datetime),
      location: {
        name: eventData.location.name,
        address: eventData.location.address || null,
        coordinates: null // This can be populated later if you add geocoding
      },
      description: eventData.description || "",
      type: eventData.type && ["social", "business", "entertainment"].includes(eventData.type) 
        ? eventData.type 
        : "social",
    };

    return NextResponse.json(formattedData);

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}