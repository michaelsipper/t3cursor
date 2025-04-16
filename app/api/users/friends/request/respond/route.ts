import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

interface DecodedToken {
  userId: string;
}

interface RequestBody {
  requestId: string;
  action: 'accept' | 'reject';
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

    // Get userId and request details
    const userId = decodedToken.userId;
    const { requestId, action }: RequestBody = await req.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: "Request ID and action are required" }, { status: 400 });
    }

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json({ error: "Invalid action. Must be 'accept' or 'reject'" }, { status: 400 });
    }

    // Find the user and the request
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the friend request in the user's requests
    const requestIndex = user.friendRequests.findIndex(
      (request: { _id: mongoose.Types.ObjectId }) => request._id.toString() === requestId
    );

    if (requestIndex === -1) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
    }

    const friendRequest = user.friendRequests[requestIndex];
    const friendId = friendRequest.userId;

    if (action === 'accept') {
      // Update both users' friend lists
      await Promise.all([
        // Add friend to user's friends list and update request status
        User.findByIdAndUpdate(
          userId,
          { 
            $addToSet: { friends: friendId },
            $set: { [`friendRequests.${requestIndex}.status`]: 'accepted' }
          }
        ),
        // Add user to friend's friends list
        User.findByIdAndUpdate(
          friendId,
          { $addToSet: { friends: userId } }
        )
      ]);

      return NextResponse.json({ 
        message: "Friend request accepted",
        requestId: requestId
      });
    } else {
      // Just update the request status to rejected
      await User.findByIdAndUpdate(
        userId,
        { $set: { [`friendRequests.${requestIndex}.status`]: 'rejected' } }
      );

      return NextResponse.json({ 
        message: "Friend request rejected",
        requestId: requestId
      });
    }
  } catch (error) {
    console.error("Friend request response error:", error);
    return NextResponse.json({ error: "Failed to process friend request" }, { status: 500 });
  }
} 