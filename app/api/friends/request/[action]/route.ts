import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: { action: 'accept' | 'reject' } }
) {
  try {
    await dbConnect();
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const { targetUserId } = await req.json();
    const { action } = params;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId)
    ]);

    if (!currentUser || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the friend request
    const requestIndex = currentUser.friendRequests?.findIndex(
      req => req.userId.toString() === targetUserId
    );

    if (requestIndex === -1 || requestIndex === undefined) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
    }

    if (action === 'accept') {
      // Add each user to the other's friends list
      currentUser.friends = currentUser.friends || [];
      targetUser.friends = targetUser.friends || [];

      currentUser.friends.push(new mongoose.Types.ObjectId(targetUserId));
      targetUser.friends.push(new mongoose.Types.ObjectId(userId));

      // Update request status
      currentUser.friendRequests[requestIndex].status = 'accepted';
    } else {
      // Update request status
      currentUser.friendRequests[requestIndex].status = 'rejected';
    }

    // Save both users
    await Promise.all([
      currentUser.save(),
      action === 'accept' ? targetUser.save() : Promise.resolve()
    ]);

    return NextResponse.json({ 
      success: true,
      status: action === 'accept' ? 'friends' : 'none'
    });
  } catch (error) {
    console.error(`${params.action} friend request error:`, error);
    return NextResponse.json(
      { error: `Failed to ${params.action} friend request` },
      { status: 500 }
    );
  }
} 