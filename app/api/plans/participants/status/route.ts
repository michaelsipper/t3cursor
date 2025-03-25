// app/api/plans/participants/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import { Plan } from "@/models/Plan";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { IPlanInterestedUser, IPlanParticipant } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const url = new URL(req.url);
    const planId = url.searchParams.get('planId');

    if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const transformedInterestedUsers = plan.event.interestedUsers.map((user: IPlanInterestedUser) => ({
      userId: user.userId.toString(),
      name: user.name,
      avatar: user.avatar,
      status: user.status || 'pending',
      joinedAt: user.joinedAt
    }));

    const transformedParticipants = plan.event.participants.map((participant: IPlanParticipant) => ({
      userId: participant.userId.toString(),
      name: participant.name,
      avatar: participant.avatar,
      status: 'confirmed',
      joinedAt: participant.joinedAt
    }));

    return NextResponse.json({
      interestedUsers: transformedInterestedUsers,
      participants: transformedParticipants
    });

  } catch (error) {
    console.error("Get plan status error:", error);
    return NextResponse.json(
      { error: "Failed to get plan status" },
      { status: 500 }
    );
  }
}