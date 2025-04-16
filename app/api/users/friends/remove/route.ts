// app/api/users/friends/remove/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

interface DecodedToken {
  userId: string;
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token) as DecodedToken;
    const { friendId } = await req.json();

    // Validate friendId
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return NextResponse.json({ error: "Invalid friend ID" }, { status: 400 });
    }

    // Remove friend from both users' friend lists
    await Promise.all([
      User.findByIdAndUpdate(
        userId,
        { $pull: { friends: friendId } },
        { new: true }
      ),
      User.findByIdAndUpdate(
        friendId,
        { $pull: { friends: userId } },
        { new: true }
      )
    ]);

    return NextResponse.json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error("Remove friend error:", error);
    return NextResponse.json({ error: "Failed to remove friend" }, { status: 500 });
  }
}