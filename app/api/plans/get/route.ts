// app/api/plans/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import { Plan, IPlan } from "@/models/Plan";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
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

    // Get query parameters
    const url = new URL(req.url);
    const visibility = url.searchParams.get('visibility') || 'friends';
    const timeFilter = url.searchParams.get('timeFilter') || 'all';
    const search = url.searchParams.get('search') || '';

    // Base query
    let query: mongoose.FilterQuery<IPlan> = {};

    // Visibility filter
    switch (visibility) {
      case 'friends':
        query.creator = { $in: user.friends };
        break;
      case 'mutuals':
        // TODO: Implement mutual friends logic
        query.creator = { $in: user.friends };
        break;
      case 'community':
        query.visibility = 'community';
        break;
    }

    // Time filter
    switch (timeFilter) {
      case 'now':
        query.type = 'realtime';
        query['event.startTime'] = { 
          $lte: Date.now(),
          $gte: Date.now() - (24 * 60 * 60 * 1000) 
        };
        break;
      case 'later':
        query.type = 'scheduled';
        break;
    }

    // Search filter
    if (search) {
      query.$or = [
        { 'event.title': { $regex: search, $options: 'i' } },
        { 'event.description': { $regex: search, $options: 'i' } },
        { 'event.location': { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch plans with populated creator data
    const plans = await Plan.find(query)
      .populate('creator', 'name age')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Transform plans to match UI format
    const transformedPlans = plans.map(plan => ({
      id: (plan._id as mongoose.Types.ObjectId).toString(),
      type: plan.type,
      poster: {
        name: plan.creator?.name || 'Unknown',
        age: plan.creator?.age,
        connection: visibility === 'friends' ? '1st' : 
                   visibility === 'mutuals' ? '2nd' : '3rd'
      },
      event: {
        title: plan.event.title,
        description: plan.event.description,
        location: plan.event.location,
        time: plan.event.time,
        startTime: plan.event.startTime,
        duration: plan.event.duration,
        currentInterested: plan.event.currentInterested,
        openInvite: plan.event.openInvite,
        totalSpots: plan.event.totalSpots,
        participants: plan.event.participants
      },
      repostMessage: plan.repost?.message
    }));

    return NextResponse.json(transformedPlans, { status: 200 });
  } catch (error) {
    console.error("Get plans error:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}