// app/api/messages/send/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import { Message, Conversation } from "@/models/Message";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const { conversationId, content, contentType = 'text', mediaUrl, mediaType } = await req.json();

    // Validate conversation exists and user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Create message
    const message = new Message({
      conversationId,
      sender: userId,
      content,
      contentType,
      mediaUrl,
      mediaType,
      readBy: [{ userId, readAt: new Date() }]
    });

    await message.save();

    // Update conversation's lastMessage
    conversation.lastMessage = message._id;
    await conversation.save();

    return NextResponse.json({
      message: "Message sent successfully",
      messageId: message._id
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}