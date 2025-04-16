import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await dbConnect();
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId: currentUserId } = verifyToken(token);
    const { userId: targetUserId } = params;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId)
    ]);

    if (!currentUser || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already friends
    if (currentUser.friends.includes(targetUserId)) {
      return NextResponse.json({ status: 'friends' });
    }

    // Check if current user sent a request to target user
    if (targetUser.friendRequests?.some(req => req.userId.toString() === currentUserId)) {
      return NextResponse.json({ status: 'sent' });
    }

    // Check if target user sent a request to current user
    if (currentUser.friendRequests?.some(req => req.userId.toString() === targetUserId)) {
      return NextResponse.json({ status: 'pending' });
    }

    // No friend relationship
    return NextResponse.json({ status: 'none' });
  } catch (error) {
    console.error("Get friend status error:", error);
    return NextResponse.json(
      { error: "Failed to get friend status" },
      { status: 500 }
    );
  }
} 