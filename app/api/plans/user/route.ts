// app/api/plans/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import { Plan } from "@/models/Plan";
import dbConnect from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const { userId } = verifyToken(token);

    const plans = await Plan.find({ creator: userId })
      .populate('creator', 'name age avatarUrl')
      .sort({ createdAt: -1 });

    const transformedPlans = plans.map(plan => ({
      id: plan._id.toString(),
      type: plan.type,
      creator: {
        id: plan.creator._id.toString()
      },
      poster: {
        id: plan.creator._id.toString(),
        name: plan.creator.name,
        age: plan.creator.age,
        avatarUrl: plan.creator.avatarUrl,
        connection: "1st"
      },
      event: {
        title: plan.event.title,
        description: plan.event.description,
        location: plan.event.location.name,
        time: plan.event.time,
        startTime: plan.event.startTime,
        duration: plan.event.duration,
        interestedUsers: plan.event.interestedUsers,
        currentInterested: plan.event.interestedUsers?.length || 0,
        openInvite: plan.event.openInvite,
        totalSpots: plan.event.totalSpots,
        openSpots: plan.event.openSpots,
        participants: plan.event.participants
      }
    }));

    return NextResponse.json({ plans: transformedPlans });
  } catch (error) {
    console.error("Fetch user plans error:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}