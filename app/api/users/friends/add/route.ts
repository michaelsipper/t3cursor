// app/api/users/friends/add/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import User from "@/models/User";
import { Connection } from "@/models/Connection";
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
    const { friendId } = await req.json();

    // Validate friendId
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return NextResponse.json({ error: "Invalid friend ID" }, { status: 400 });
    }

    // Check if users exist
    const [requester, recipient] = await Promise.all([
      User.findById(userId),
      User.findById(friendId)
    ]);

    if (!recipient || !requester) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if a connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId }
      ]
    });

    if (existingConnection) {
      if (existingConnection.status === 'pending') {
        return NextResponse.json({ error: "Friend request already sent" }, { status: 400 });
      }
      if (existingConnection.status === 'accepted') {
        return NextResponse.json({ error: "Already friends" }, { status: 400 });
      }
      if (existingConnection.status === 'blocked') {
        return NextResponse.json({ error: "Unable to send request" }, { status: 400 });
      }
    }

    // Create new pending connection request
    const connection = new Connection({
      requester: userId,
      recipient: friendId,
      status: 'pending'
    });

    await connection.save();

    return NextResponse.json({ 
      message: "Friend request sent successfully",
      requestId: connection._id
    });
  } catch (error) {
    console.error("Send friend request error:", error);
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }
}