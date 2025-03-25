// app/api/plans/repost/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import { Plan } from "@/models/Plan";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const { planId, message } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    // Find original plan
    const originalPlan = await Plan.findById(planId).populate('creator', 'name age');
    if (!originalPlan) {
      return NextResponse.json({ error: "Original plan not found" }, { status: 404 });
    }

    // Get reposter info
    const reposter = await User.findById(userId);
    if (!reposter) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create repost
    const repost = new Plan({
      type: 'repost',
      creator: userId,
      event: originalPlan.event,
      visibility: originalPlan.visibility,
      repost: {
        originalPlanId: planId,
        message: message || ''
      }
    });

    await repost.save();

    // Transform to match FeedItem interface
    const transformedRepost = {
      id: repost._id.toString(),
      type: 'repost',
      poster: {
        name: reposter.name,
        age: reposter.age,
        connection: "1st" // Since this is the user's own repost
      },
      event: {
        ...originalPlan.event.toObject(),
        originalPoster: {
          name: originalPlan.creator.name,
          age: originalPlan.creator.age,
          connection: originalPlan.visibility
        }
      },
      repostMessage: message || ''
    };

    return NextResponse.json(transformedRepost, { status: 201 });
  } catch (error) {
    console.error("Repost plan error:", error);
    return NextResponse.json(
      { error: "Failed to repost plan" },
      { status: 500 }
    );
  }
}