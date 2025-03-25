//app/api/users/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    console.log("🔍 Connecting to database...");
    await dbConnect();

    const { email, password } = await req.json();
    console.log("📩 Login request received:", { email });

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // Find user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("❌ User not found for email:", email);
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    // Check password
    console.log("🔑 Comparing passwords...");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Password mismatch for user:", email);
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    // Generate JWT token
    console.log("🔐 Generating JWT...");
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, {
      expiresIn: "7d",
    });

    // Create the response with token cookie
    const response = NextResponse.json(
      { message: "Login successful." },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    console.log("✅ Login successful for user:", email);
    return response;
  } catch (error) {
    console.error("❌ Login Error:", error);
    return NextResponse.json({ error: "Failed to login." }, { status: 500 });
  }
}