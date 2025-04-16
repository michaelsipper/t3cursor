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

    // Fetch current user
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if request exists
    const friendRequestIndex = currentUser.friendRequests?.findIndex(
      (req: { userId: mongoose.Types.ObjectId, status: string }) => 
        req.userId.toString() === targetUserId && req.status === 'pending'
    );

    if (friendRequestIndex === -1 || friendRequestIndex === undefined) {
      return NextResponse.json({ error: "No pending friend request found" }, { status: 400 });
    }

    // Remove friend request
    currentUser.friendRequests = currentUser.friendRequests.filter(
      (req: { userId: mongoose.Types.ObjectId }) => req.userId.toString() !== targetUserId
    );

    // Save user
    await currentUser.save();

    // Return success
    return NextResponse.json({ 
      success: true,
      message: "Friend request declined"
    });
  } catch (error) {
    console.error("Decline friend request error:", error);
    return NextResponse.json(
      { error: "Failed to decline friend request" },
      { status: 500 }
    );
  }
} 