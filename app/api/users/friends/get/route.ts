// app/api/users/friends/get/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

interface DecodedToken {
  userId: string;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get token from cookies
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const decoded = await verifyToken(token) as DecodedToken;
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { userId } = decoded;

    // Check if a specific userId is provided in query params
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get('userId') || userId;

    // Convert to ObjectId
    const targetUserObjectId = new mongoose.Types.ObjectId(targetUserId);

    // Find user by ID
    const user = await User.findById(targetUserObjectId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the IDs of the user's friends
    const friendIds = user.friends || [];
    
    if (friendIds.length === 0) {
      return NextResponse.json({ friends: [] });
    }

    // Fetch basic information about each friend
    const friends = await User.find(
      { _id: { $in: friendIds } },
      { name: 1, avatarUrl: 1 }
    );

    // Format the friend data
    const formattedFriends = friends.map(friend => ({
      id: friend._id.toString(),
      name: friend.name,
      avatarUrl: friend.avatarUrl || null
    }));

    return NextResponse.json({ friends: formattedFriends });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}