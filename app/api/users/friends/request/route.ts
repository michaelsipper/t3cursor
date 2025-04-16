import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

interface DecodedToken {
  userId: string;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    // Get and verify token
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let decodedToken: DecodedToken;
    try {
      decodedToken = verifyToken(token) as DecodedToken;
    } catch (error) {
      console.error("Token verification error:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get userId and friendId
    const userId = decodedToken.userId;
    const { friendId } = await req.json();

    if (!friendId) {
      return NextResponse.json({ error: "Friend ID is required" }, { status: 400 });
    }

    // Convert string IDs to ObjectIds
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const friendObjectId = new mongoose.Types.ObjectId(friendId);

    // Check that users exist
    const [user, friend] = await Promise.all([
      User.findById(userObjectId),
      User.findById(friendObjectId)
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!friend) {
      return NextResponse.json({ error: "Friend not found" }, { status: 404 });
    }

    // Check if users are already friends
    if (user.friends.includes(friendObjectId)) {
      return NextResponse.json({ error: "Already friends with this user" }, { status: 400 });
    }

    // Check if a request is already pending
    const existingRequest = friend.friendRequests.find(
      (request: { userId: mongoose.Types.ObjectId }) => request.userId.toString() === userId
    );

    if (existingRequest) {
      return NextResponse.json({ error: "Friend request already sent" }, { status: 400 });
    }

    // Add friend request to the recipient's requests array
    await User.findByIdAndUpdate(
      friendObjectId,
      {
        $push: {
          friendRequests: {
            userId: userObjectId,
            name: user.name,
            avatar: user.avatarUrl || null,
            status: 'pending',
            createdAt: new Date()
          }
        }
      }
    );

    return NextResponse.json({ 
      message: "Friend request sent successfully",
      friend: {
        id: friend._id,
        name: friend.name
      }
    });
  } catch (error) {
    console.error("Send friend request error:", error);
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }
} 