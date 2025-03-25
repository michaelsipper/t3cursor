// app/api/plans/delete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import { Plan } from "@/models/Plan";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const { planId } = await req.json();

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

    // Delete plan
    await Plan.findByIdAndDelete(planId);

    // Also delete any reposts of this plan
    await Plan.deleteMany({
      'repost.originalPlanId': new mongoose.Types.ObjectId(planId)
    });

    return NextResponse.json({ message: "Plan deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete plan error:", error);
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 500 }
    );
  }
}