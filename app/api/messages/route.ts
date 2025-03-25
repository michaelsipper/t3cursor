// app/api/messages/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import dbConnect from "@/lib/mongodb";
import mongoose from 'mongoose';
import Models from '@/lib/models';

const { Message, Conversation } = Models;

interface MessageDocument {
  _id: mongoose.Types.ObjectId;
  content: string;
  contentType: string;
  mediaUrl?: string;
  mediaType?: string;
  sender: {
    _id: mongoose.Types.ObjectId;
    name: string;
    avatarUrl?: string;
  };
  readBy: Array<{
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }>;
  createdAt: Date;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    console.log('🔍 Models registered:', Object.keys(mongoose.models));
    console.log('🔍 User model exists:', Boolean(mongoose.models.User));
    console.log('🔍 Message model exists:', Boolean(mongoose.models.Message));
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    let query: any = { conversationId };
    if (before) {
      query._id = { $lt: before };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })  // Change -1 to 1 for ascending order
      .limit(limit)
      .populate('sender', 'name avatarUrl');

    return NextResponse.json({ 
      messages: messages.map((msg: MessageDocument) => ({
        id: msg._id,
        content: msg.content,
        contentType: msg.contentType,
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
        sender: {
          id: msg.sender._id,
          name: msg.sender.name,
          avatarUrl: msg.sender.avatarUrl
        },
        readBy: msg.readBy || [],
        createdAt: msg.createdAt
      }))
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Failed to get messages" }, { status: 500 });
  }
}