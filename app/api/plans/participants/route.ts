// app/api/plans/participants/route.ts

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
    console.log('Connected to database');
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const { planId, targetUserId, action } = await req.json();

    console.log('Received request:', { planId, targetUserId, action });

    if (!mongoose.Types.ObjectId.isValid(planId) || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      console.log('Invalid IDs:', { planId, targetUserId });
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const [plan, targetUser] = await Promise.all([
      Plan.findById(planId),
      User.findById(targetUserId)
    ]);

    if (!plan || !targetUser) {
      console.log('Not found:', { plan: !!plan, targetUser: !!targetUser });
      return NextResponse.json({ error: "Plan or user not found" }, { status: 404 });
    }

    if (plan.creator.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const interestedUser = plan.event.interestedUsers.find(
      (u: IPlanInterestedUser) => u.userId.toString() === targetUserId
    );

    if (!interestedUser) {
      return NextResponse.json({ error: "User not interested in plan" }, { status: 400 });
    }

    switch (action) {
      case 'accept':
        // Update status to accepted without adding to participants
        plan.event.interestedUsers = plan.event.interestedUsers.map((u: IPlanInterestedUser) => {
          if (u.userId.toString() === targetUserId) {
            return {
              ...u,
              status: 'accepted'
            };
          }
          return u;
        });
        break;

      case 'reject':
        plan.event.interestedUsers = plan.event.interestedUsers.map((u: IPlanInterestedUser) => {
          if (u.userId.toString() === targetUserId) {
            return {
              ...u,
              status: 'rejected'
            };
          }
          return u;
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await plan.save();
    console.log('Plan updated successfully', { action, targetUserId });

    return NextResponse.json({
      success: true,
      participants: plan.event.participants,
      interestedUsers: plan.event.interestedUsers,
      openSpots: plan.event.openSpots
    });

  } catch (error) {
    console.error("Participants error:", error);
    return NextResponse.json(
      { error: "Failed to modify plan participants" },
      { status: 500 }
    );
  }
}