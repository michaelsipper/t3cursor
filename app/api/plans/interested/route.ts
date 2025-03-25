// app/api/plans/interested/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import { Plan, IPlanInterestedUser, IPlanParticipant } from "@/models/Plan";
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
    const { planId } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    console.log('Processing interest toggle:', { userId, planId });

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check if user is already interested
    const userIndex = plan.event.interestedUsers.findIndex(
      (u: IPlanInterestedUser) => u.userId.toString() === userId
    );

    let updatedPlan;
    
    if (userIndex === -1) {
      // Add user to interested users
      updatedPlan = await Plan.findByIdAndUpdate(
        planId,
        {
          $push: {
            "event.interestedUsers": {
              userId: new mongoose.Types.ObjectId(userId),
              name: user.name,
              avatar: user.avatarUrl || null,
              joinedAt: new Date()
            }
          }
        },
        { new: true }
      ).populate('creator', 'name age avatarUrl');
    } else {
      // Remove user from interested users
      updatedPlan = await Plan.findByIdAndUpdate(
        planId,
        {
          $pull: {
            "event.interestedUsers": {
              userId: new mongoose.Types.ObjectId(userId)
            }
          }
        },
        { new: true }
      ).populate('creator', 'name age avatarUrl');
    }

    if (!updatedPlan) {
      throw new Error("Failed to update plan");
    }

    const transformedInterestedUsers = updatedPlan.event.interestedUsers.map((user: IPlanInterestedUser) => ({
      userId: user.userId.toString(),
      name: user.name,
      avatar: user.avatar,
      joinedAt: user.joinedAt.toISOString()
    }));

    const transformedParticipants = updatedPlan.event.participants.map((p: IPlanParticipant) => ({
      userId: p.userId.toString(),
      name: p.name,
      avatar: p.avatar,
      status: p.status,
      joinedAt: p.joinedAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      interestedCount: updatedPlan.event.interestedUsers.length,
      interestedUsers: transformedInterestedUsers,
      participants: transformedParticipants,
      openSpots: updatedPlan.event.openSpots
    });

  } catch (error) {
    console.error("Toggle interest error:", error);
    return NextResponse.json(
      { error: "Failed to toggle interest" },
      { status: 500 }
    );
  }
}