// app/api/users/logout/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("🔓 Processing logout request");
    
    // Create response with success message
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear the token cookie
    response.cookies.delete('token');
    
    console.log("✅ Logout successful");
    return response;
  } catch (error) {
    console.error("❌ Logout Error:", error);
    return NextResponse.json({ message: "Failed to logout" }, { status: 500 });
  }
}