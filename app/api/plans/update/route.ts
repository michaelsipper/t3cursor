// app/api/plans/update/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import { Plan } from "@/models/Plan";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const { planId, updates } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    // Find plan and verify ownership
    const plan = await Plan.findById(planId);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (plan.creator.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update plan
    const updatedPlan = await Plan.findByIdAndUpdate(
      planId,
      { $set: updates },
      { new: true }
    ).populate('creator', 'name age');

    // Transform to match FeedItem interface
    const transformedPlan = {
      id: updatedPlan._id.toString(),
      type: updatedPlan.type,
      poster: {
        name: updatedPlan.creator.name,
        age: updatedPlan.creator.age,
        connection: "1st" // Since this is the creator's own plan
      },
      event: {
        title: updatedPlan.event.title,
        description: updatedPlan.event.description,
        location: updatedPlan.event.location,
        time: updatedPlan.event.time,
        startTime: updatedPlan.event.startTime,
        duration: updatedPlan.event.duration,
        currentInterested: updatedPlan.event.currentInterested,
        openInvite: updatedPlan.event.openInvite,
        totalSpots: updatedPlan.event.totalSpots,
        participants: updatedPlan.event.participants
      },
      repostMessage: updatedPlan.repost?.message
    };

    return NextResponse.json(transformedPlan, { status: 200 });
  } catch (error) {
    console.error("Update plan error:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}