import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";

interface DecodedToken {
  userId: string;
}

export async function GET(req: NextRequest) {
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

    // Get userId
    const userId = decodedToken.userId;

    // Find the user
    const user = await User.findById(userId).select('friendRequests');
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Filter to only pending requests
    const pendingRequests = user.friendRequests.filter(
      (request: { status: string }) => request.status === 'pending'
    );

    return NextResponse.json({ 
      requests: pendingRequests,
      count: pendingRequests.length
    });
  } catch (error) {
    console.error("Get friend requests error:", error);
    return NextResponse.json({ error: "Failed to get friend requests" }, { status: 500 });
  }
} 