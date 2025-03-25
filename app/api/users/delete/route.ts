// app/api/users/delete/route.ts

import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import { verifyToken } from "@/app/api/middleware/auth";
import cloudinary from "@/lib/cloudinary";

export async function DELETE(req: NextRequest) {
  try {
    console.log("🔍 DELETE route hit");
    await dbConnect();
    console.log("✅ Database connected");

    // Get token from cookie
    const token = req.cookies.get('token')?.value;
    
    if (!token) {
      console.log("❌ No token provided");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify token and extract userId
    const { userId } = verifyToken(token);
    console.log("🔑 User ID decoded:", userId);

    // Find user to get their photos for Cloudinary cleanup
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user's photos from Cloudinary if they exist
    try {
      // Delete avatar if exists
      if (user.avatarUrl) {
        const publicId = user.avatarUrl.split('/').slice(-1)[0].split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }

      // Delete banner if exists
      if (user.bannerUrl) {
        const publicId = user.bannerUrl.split('/').slice(-1)[0].split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }

      // Delete profile photos if they exist
      for (const photo of user.photos) {
        if (photo.publicId) {
          await cloudinary.uploader.destroy(photo.publicId);
        }
      }
    } catch (cloudinaryError) {
      console.error("⚠️ Cloudinary cleanup error:", cloudinaryError);
      // Continue with user deletion even if Cloudinary cleanup fails
    }

    // Delete the user
    await User.findByIdAndDelete(userId);
    console.log("✅ User deleted successfully");

    // Create response with cookie clearing
    const response = NextResponse.json(
      { message: "Account deleted successfully" }, 
      { status: 200 }
    );

    // Clear the authentication cookie
    response.cookies.delete('token');

    return response;
  } catch (error) {
    console.error("❌ Delete Error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}