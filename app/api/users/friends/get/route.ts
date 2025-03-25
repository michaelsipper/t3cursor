// app/api/users/friends/get/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import User from "@/models/User";
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

    // Get the user with populated friends
    const user = await User.findById(userId)
      .populate('friends', 'name age avatarUrl location');
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Transform friend data for response
    const friends = user.friends.map((friend: any) => ({
      id: friend._id,
      name: friend.name,
      age: friend.age,
      avatarUrl: friend.avatarUrl,
      location: friend.location
    }));

    return NextResponse.json({ friends });
  } catch (error) {
    console.error("Get friends error:", error);
    return NextResponse.json({ error: "Failed to get friends" }, { status: 500 });
  }
}