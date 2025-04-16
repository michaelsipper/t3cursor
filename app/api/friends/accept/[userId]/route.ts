import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

export async function POST(
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

    if (!mongoose.Types.ObjectId.isValid(targetUserId) || !mongoose.Types.ObjectId.isValid(currentUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Fetch both users
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId)
    ]);

    if (!currentUser || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if request exists
    const friendRequest = currentUser.friendRequests?.find(
      (req: { userId: mongoose.Types.ObjectId, status: string }) => 
        req.userId.toString() === targetUserId && req.status === 'pending'
    );

    if (!friendRequest) {
      return NextResponse.json({ error: "No pending friend request found" }, { status: 400 });
    }

    // Update friend status for current user
    currentUser.friendRequests = currentUser.friendRequests.filter(
      (req: { userId: mongoose.Types.ObjectId }) => req.userId.toString() !== targetUserId
    );
    
    if (!currentUser.friends.includes(targetUserId)) {
      currentUser.friends.push(targetUserId);
    }

    // Update friend status for target user
    if (!targetUser.friends.includes(currentUserId)) {
      targetUser.friends.push(currentUserId);
    }

    // Save both users
    await Promise.all([
      currentUser.save(),
      targetUser.save()
    ]);

    // Return success
    return NextResponse.json({ 
      success: true,
      message: "Friend request accepted",
      friendCount: currentUser.friends.length
    });
  } catch (error) {
    console.error("Accept friend request error:", error);
    return NextResponse.json(
      { error: "Failed to accept friend request" },
      { status: 500 }
    );
  }
} 