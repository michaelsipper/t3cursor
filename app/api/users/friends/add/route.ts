// app/api/users/friends/add/route.ts

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
    const { friendId } = await req.json();

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
    }

    // Convert to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const friendObjectId = new mongoose.Types.ObjectId(friendId);

    // Check if users exist
    const [user, friend] = await Promise.all([
      User.findById(userObjectId),
      User.findById(friendObjectId)
    ]);

    if (!user || !friend) {
      return NextResponse.json({ error: 'User or friend not found' }, { status: 404 });
    }

    // Check if already friends
    const isAlreadyFriend = user.friends.some(
      (id: mongoose.Types.ObjectId) => id.toString() === friendId
    );

    if (isAlreadyFriend) {
      return NextResponse.json({ message: 'Already friends' });
    }

    // Add friend to user's friend list
    user.friends.push(friendObjectId);
    await user.save();

    // Add user to friend's friend list (mutual)
    friend.friends.push(userObjectId);
    await friend.save();

    return NextResponse.json({ 
      success: true,
      message: 'Friend added successfully',
      friend: {
        id: friend._id.toString(),
        name: friend.name,
        avatarUrl: friend.avatarUrl || null
      }
    });
  } catch (error) {
    console.error('Error adding friend:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}