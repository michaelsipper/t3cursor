// app/api/users/friends/requests/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import User from "@/models/User";
import { Connection } from "@/models/Connection";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token);

    // Get pending friend requests
    const requests = await Connection.find({
      recipient: userId,
      status: 'pending'
    }).populate('requester', 'name age avatarUrl');

    // Transform requests for response
    const formattedRequests = requests.map(request => ({
      id: request._id,
      user: {
        id: request.requester._id,
        name: request.requester.name,
        age: request.requester.age,
        avatarUrl: request.requester.avatarUrl
      },
      createdAt: request.createdAt
    }));

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error("Get friend requests error:", error);
    return NextResponse.json({ error: "Failed to get friend requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const { requestId, action } = await req.json();

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const request = await Connection.findById(requestId);
    if (!request || request.recipient.toString() !== userId) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
    }

    if (action === 'accept') {
      // Add both users to each other's friend lists
      await Promise.all([
        User.findByIdAndUpdate(
          userId,
          { $addToSet: { friends: request.requester } },
          { new: true }
        ),
        User.findByIdAndUpdate(
          request.requester,
          { $addToSet: { friends: userId } },
          { new: true }
        )
      ]);

      request.status = 'accepted';
    } else {
      request.status = 'declined';
    }

    await request.save();

    return NextResponse.json({
      message: `Friend request ${action}ed successfully`
    });
  } catch (error) {
    console.error("Process friend request error:", error);
    return NextResponse.json({ error: "Failed to process friend request" }, { status: 500 });
  }
}