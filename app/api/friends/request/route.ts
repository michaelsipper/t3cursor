import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import User from "@/models/User";
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
    const { targetUserId } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const [user, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId)
    ]);

    if (!user || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already friends
    if (user.friends.includes(targetUserId)) {
      return NextResponse.json({ error: "Already friends" }, { status: 400 });
    }

    // Check if request already sent
    if (targetUser.friendRequests?.some(req => req.userId.toString() === userId)) {
      return NextResponse.json({ error: "Friend request already sent" }, { status: 400 });
    }

    // Add friend request
    targetUser.friendRequests = targetUser.friendRequests || [];
    targetUser.friendRequests.push({
      userId: new mongoose.Types.ObjectId(userId),
      name: user.name,
      avatar: user.avatarUrl || null,
      status: 'pending',
      createdAt: new Date()
    });

    await targetUser.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send friend request error:", error);
    return NextResponse.json(
      { error: "Failed to send friend request" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const { targetUserId } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove friend request
    targetUser.friendRequests = targetUser.friendRequests?.filter(
      req => req.userId.toString() !== userId
    ) || [];

    await targetUser.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel friend request error:", error);
    return NextResponse.json(
      { error: "Failed to cancel friend request" },
      { status: 500 }
    );
  }
} 