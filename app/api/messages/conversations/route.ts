// app/api/messages/conversations/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import dbConnect from "@/lib/mongodb";
import mongoose from 'mongoose';
import Models from '@/lib/models'; // Add this import

// Import User first
import User from "@/models/User";
// Then import Message models
import { Message, Conversation } from "@/models/Message";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const { participants, name, type = 'individual' } = await req.json();

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json({ error: "Participants are required" }, { status: 400 });
    }

    if (type === 'individual' && participants.length !== 1) {
      return NextResponse.json({ error: "Individual chats must have exactly one other participant" }, { status: 400 });
    }

    const allParticipants = Array.from(new Set([...participants, userId]));

    if (type === 'individual') {
      const existingConversation = await Conversation.findOne({
        type: 'individual',
        participants: { $all: allParticipants, $size: 2 }
      });

      if (existingConversation) {
        return NextResponse.json({ 
          message: "Conversation already exists",
          conversation: existingConversation
        });
      }
    }

    const conversation = new Conversation({
      participants: allParticipants,
      type,
      name: type === 'group' ? name : undefined
    });

    await conversation.save();

    return NextResponse.json({
      message: "Conversation created successfully",
      conversation
    }, { status: 201 });
  } catch (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    try {
      await dbConnect();
      console.log('🔍 Models registered:', Object.keys(mongoose.models));
      console.log('🔍 User model exists:', Boolean(mongoose.models.User));
      console.log('🔍 Conversation model exists:', Boolean(mongoose.models.Conversation));
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token);

    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'name avatarUrl')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    const transformedConversations = conversations.map(conv => ({
      id: conv._id,
      type: conv.type,
      name: conv.type === 'group' ? conv.name : undefined,
      participants: conv.participants.map((p: any) => ({
        id: p._id,
        name: p.name,
        avatarUrl: p.avatarUrl
      })),
      lastMessage: conv.lastMessage ? {
        content: conv.lastMessage.content,
        sender: conv.lastMessage.sender,
        createdAt: conv.lastMessage.createdAt
      } : null,
      updatedAt: conv.updatedAt
    }));

    return NextResponse.json({ conversations: transformedConversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json({ error: "Failed to get conversations" }, { status: 500 });
  }
}