// app/api/users/update/route.ts

import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import { verifyToken } from "@/app/api/middleware/auth";
import { MAX_PROMPTS } from "@/lib/constants";

export async function PUT(req: NextRequest) {
  try {
    console.log("🔄 Updating user profile...");
    await dbConnect();

    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { updates } = await req.json();
    const { userId } = verifyToken(token);

    console.log("📝 Update payload:", updates);

    // Validate prompts if they're being updated
    if (updates.prompts) {
      if (updates.prompts.length > MAX_PROMPTS) {
        return NextResponse.json(
          { error: `Number of prompts cannot exceed ${MAX_PROMPTS}` },
          { status: 400 }
        );
      }

      // Validate prompt structure
      const validPrompts = updates.prompts.every((prompt: any) => 
        prompt._id && 
        typeof prompt.prompt === 'string' &&
        typeof prompt.response === 'string'
      );

      if (!validPrompts) {
        return NextResponse.json(
          { error: "Invalid prompt structure" },
          { status: 400 }
        );
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Apply updates to user document
    Object.keys(updates).forEach((key) => {
      user[key] = updates[key];
    });

    await user.save();
    console.log("✅ Profile updated successfully");

    // Return updated user without sensitive fields
    const updatedUser = user.toJSON();
    delete updatedUser.password;
    delete updatedUser.__v;

    return NextResponse.json({ 
      message: "Profile updated successfully", 
      user: updatedUser 
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Update Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}