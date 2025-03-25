// app/api/users/get/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import User, { IUser } from "@/models/User";  // Import IUser interface
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { DEFAULT_STATUS_OPTIONS } from '@/lib/constants';

// Define interfaces for the photo and prompt objects
interface UserPhoto {
  _id: mongoose.Types.ObjectId;
  url: string | null;
  order: number;
  region: string;
  publicId?: string | null;
}

interface UserPrompt {
  _id: mongoose.Types.ObjectId;
  prompt: string;
  response: string;
}

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Initializing user data fetch...");
    await dbConnect();
    
    const token = req.cookies.get('token')?.value;
    console.log("🔐 Auth Token Status:", token ? "Present" : "Missing");
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const decoded = verifyToken(token);
      userId = decoded.userId;
      console.log("🔑 User ID extracted:", userId);
    } catch (error) {
      console.error("❌ Token verification failed:", error);
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("❌ Invalid user ID format");
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId)
      .select('-password -__v')
      .populate('friends', 'name avatarUrl');

    if (!user) {
      console.error("❌ User not found for ID:", userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Debug log raw user data
    console.log("📄 Raw user data from DB:", {
      _id: user._id?.toString(),
      id: user.id,
      type: typeof user._id,
    });

    // Transform the user data to include both _id and id
    const profileData = {
      _id: user._id.toString(),  // Explicitly convert ObjectId to string
      id: user._id.toString(),   // Add id field as string
      name: user.name,
      age: user.age || 0,
      location: user.location || "",
      bio: user.bio || "",
      photos: (user.photos || []).map((photo: UserPhoto) => ({
        _id: photo._id.toString(),
        url: photo.url,
        order: photo.order,
        region: photo.region,
        publicId: photo.publicId || null
      })),
      prompts: (user.prompts || []).map((prompt: UserPrompt) => ({
        _id: prompt._id.toString(),
        prompt: prompt.prompt,
        response: prompt.response
      })),
      avatarUrl: user.avatarUrl || null,
      bannerUrl: user.bannerUrl || null,
      stats: {
        flakeScore: user.reliabilityScore || 100,
        friendCount: user.friends?.length || 0,
        status: user.status || DEFAULT_STATUS_OPTIONS[0]
      },
      emailVerified: user.emailVerified || false,
      phoneVerified: user.phoneVerified || false,
      phoneNumber: user.phoneNumber || "",
      universityEmail: user.universityEmail || "",
      university: user.university || "",
      joinDate: user.createdAt,
      lastUpdated: user.updatedAt,
      friends: (user.friends || []).slice(0, 6).map((friend: any) => ({
        id: friend._id.toString(),
        name: friend.name,
        avatarUrl: friend.avatarUrl
      }))
    };

    // Debug log transformed data
    console.log("✨ Transformed user data:", {
      id: profileData.id,
      _id: profileData._id,
      hasId: Boolean(profileData.id),
      hasUnderscoreId: Boolean(profileData._id)
    });

    console.log("✅ Successfully prepared profile data");
    
    const response = NextResponse.json(profileData, { status: 200 });
    response.headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
    
    return response;

  } catch (error) {
    console.error("❌ Server error while fetching user data:", error);
    
    const isMongoError = error instanceof mongoose.Error;
    const errorMessage = isMongoError 
      ? "Database operation failed" 
      : "Internal server error";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}