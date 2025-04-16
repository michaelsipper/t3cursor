// app/api/plans/participants/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import { Plan } from "@/models/Plan";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { IPlanInterestedUser } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    console.log('[DEBUG] Starting confirm attendance');
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const { planId } = await req.json();
    console.log('[DEBUG] Confirming attendance for user:', userId, 'plan:', planId);

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    const [plan, user] = await Promise.all([
      Plan.findById(planId),
      User.findById(userId)
    ]);

    if (!plan || !user) {
      console.log('[DEBUG] Plan or user not found:', { plan: !!plan, user: !!user });
      return NextResponse.json({ error: "Plan or user not found" }, { status: 404 });
    }

    const interestedUser = plan.event.interestedUsers.find(
      (u: IPlanInterestedUser) => u.userId.toString() === userId && u.status === 'accepted'
    );

    if (!interestedUser) {
      console.log('[DEBUG] User not approved for plan');
      return NextResponse.json({ error: "Not approved for this plan" }, { status: 403 });
    }

    plan.event.interestedUsers = plan.event.interestedUsers.filter(
      (u: IPlanInterestedUser) => u.userId.toString() !== userId
    );

    plan.event.participants.push({
      userId: user._id,
      name: user.name,
      avatar: user.avatarUrl || null,
      status: 'going',
      joinedAt: new Date()
    });

    plan.event.openSpots--;
    await plan.save();
    console.log('[DEBUG] Successfully confirmed attendance, participants:', plan.event.participants);

    return NextResponse.json({
      success: true,
      participants: plan.event.participants,
      interestedUsers: plan.event.interestedUsers,
      openSpots: plan.event.openSpots
    });

  } catch (error) {
    console.error("Confirm attendance error:", error);
    return NextResponse.json(
      { error: "Failed to confirm attendance" },
      { status: 500 }
    );
  }
}