// app/api/plans/create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import { Plan, IPlanParticipant } from "@/models/Plan";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

interface CreatePlanData {
  type: "scheduled" | "realtime" | "repost";
  event: {
    title: string;
    description?: string;
    location: string | { name: string };
    time?: string;
    startTime?: number;
    duration?: number;
    totalSpots: number;
    openInvite: boolean;
  };
  visibility?: "friends" | "mutuals" | "community";
  media?: {
    url?: string;
    processedData?: {
      title?: string;
      datetime?: string;
      location?: string;
      description?: string;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const planData: CreatePlanData = await req.json();

    // Validate required fields
    if (!planData.type || !planData.event?.title || !planData.event?.location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const locationName = typeof planData.event.location === 'string' 
      ? planData.event.location 
      : planData.event.location.name;

    // Transform the data
    const transformedPlanData = {
      type: planData.type,
      creator: new mongoose.Types.ObjectId(userId),
      event: {
        title: planData.event.title,
        description: planData.event.description || "",
        location: {
          name: locationName,
          coordinates: {
            type: 'Point' as const,
            coordinates: [-122.4194, 37.7749] // Default SF coordinates
          }
        },
        time: planData.event.time,
        startTime: planData.event.startTime,
        duration: planData.event.duration,
        currentInterested: 0,
        openInvite: planData.event.openInvite,
        totalSpots: planData.event.totalSpots,
        openSpots: planData.event.totalSpots, // Initialize to totalSpots
        participants: [{
          userId: new mongoose.Types.ObjectId(userId),
          name: user.name,
          avatar: user.avatarUrl || null,
          status: 'creator' as const,
          joinedAt: new Date()
        }],
        interestedUsers: [] // Initialize empty interested users array
      },
      visibility: planData.visibility || 'friends',
      media: planData.media ? {
        ...planData.media,
        processedData: {
          ...planData.media.processedData,
          location: locationName // Ensure location is string
        }
      } : undefined
    };

    const plan = new Plan(transformedPlanData);
    await plan.save();

    // Transform for response
    const transformedPlan = {
      id: plan._id.toString(),
      type: plan.type,
      creator: {
        id: userId,
      },
      poster: {
        id: userId,
        name: user.name,
        age: user.age,
        connection: "1st" as const
      },
      event: {
        title: plan.event.title,
        description: plan.event.description || "",
        location: plan.event.location.name,
        time: plan.event.time,
        startTime: plan.event.startTime,
        duration: plan.event.duration,
        currentInterested: 0,
        openInvite: plan.event.openInvite,
        totalSpots: plan.event.totalSpots,
        openSpots: plan.event.openSpots,
        participants: plan.event.participants.map((participant: IPlanParticipant) => ({
            id: participant.userId.toString(),
            name: participant.name,
            avatar: participant.avatar,
            status: participant.status
          }))
      }
    };

    return NextResponse.json(transformedPlan, { status: 201 });
  } catch (error) {
    console.error("Create plan error:", error);
    return NextResponse.json(
      { 
        error: "Failed to create plan", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}