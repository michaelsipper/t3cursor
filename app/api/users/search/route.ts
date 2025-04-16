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
    
    // Get query parameter
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ users: [] });
    }
    
    // Create a case-insensitive regex for the search
    const searchRegex = new RegExp(query.trim(), 'i');
    
    // Find users that match the query in name or email
    // Exclude sensitive data and limit to 15 results
    const users = await User.find(
      {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { location: searchRegex }
        ],
        _id: { $ne: userId } // Don't include the current user
      },
      {
        _id: 1,
        name: 1, 
        age: 1,
        avatarUrl: 1,
        location: 1
      }
    ).limit(15);
    
    // Format the user data
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      age: user.age,
      avatarUrl: user.avatarUrl || null,
      location: user.location || ""
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 