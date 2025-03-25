// app/api/plans/feed/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import { Plan } from "@/models/Plan";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

interface PopulatedCreator {
  _id: mongoose.Types.ObjectId;
  name: string;
  age: number;
  avatarUrl?: string;
  friends?: mongoose.Types.ObjectId[];
}

interface DBPlan {
  _id: mongoose.Types.ObjectId;
  type: string;
  creator: {
    _id: mongoose.Types.ObjectId;
    name: string;
    age?: number;
    avatarUrl?: string;
    friends?: mongoose.Types.ObjectId[];
  };
  event: {
    title: string;
    description: string;
    location: {
      name: string;
      coordinates?: {
        type: string;
        coordinates: [number, number];
      };
    };
    time?: string;
    startTime?: number;
    duration?: number;
    interestedUsers: Array<{
      userId: mongoose.Types.ObjectId;
      name: string;
      avatar: string | null;
      joinedAt: Date;
    }>;
    totalSpots: number;
    openSpots: number;
    openInvite: boolean;
    participants: Array<{
      userId: mongoose.Types.ObjectId;
      name: string;
      avatar: string | null;
      status: 'creator' | 'going';
      joinedAt: Date;
    }>;
  };
  visibility: "friends" | "mutuals" | "community";
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const url = new URL(req.url);
    
    const requestedView = url.searchParams.get("visibility") || "friends";
    const timeFilter = url.searchParams.get("timeFilter") || "all";
    const search = url.searchParams.get("search") || "";
    const fetchForProfile = url.searchParams.get('fetchForProfile') === 'true';

    // Find user and their friends
    const user = await User.findById(userId).select('friends');
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Convert friend IDs to ObjectIds
    const friendIds = (user.friends || []).map((id: mongoose.Types.ObjectId) => 
      new mongoose.Types.ObjectId(id.toString())
    );

    // Get friends of friends for mutuals
    const friendsOfFriends = await User.find({
      _id: { $in: friendIds }
    }).distinct('friends');

    // Filter out direct friends and self from mutuals
    const mutualIds = friendsOfFriends.filter((fofId: mongoose.Types.ObjectId) => 
      !friendIds.some((fId: mongoose.Types.ObjectId) => fId.equals(fofId)) && 
      fofId.toString() !== userId
    );

    // Build base filters
    let baseFilters: any = {};

    if (timeFilter === "now") {
      baseFilters.type = "realtime";
      baseFilters["event.startTime"] = {
        $lte: Date.now(),
        $gte: Date.now() - (24 * 60 * 60 * 1000)
      };
    } else if (timeFilter === "later") {
      baseFilters.type = "scheduled";
    }

    // Search filter
    if (search) {
      baseFilters.$or = [
        { 'event.title': { $regex: search, $options: 'i' } },
        { 'event.description': { $regex: search, $options: 'i' } },
        { 'event.location.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Build visibility query based on requested view
    let visibilityQuery: any = {};

    // If fetching for profile page, ignore visibility filters
    if (fetchForProfile) {
      visibilityQuery = {
        creator: new mongoose.Types.ObjectId(userId)
      };
    } else {
      switch (requestedView) {
        case "friends":
          visibilityQuery = {
            $or: [
              // Self-posted plans to friends
              {
                creator: new mongoose.Types.ObjectId(userId),
                visibility: "friends"
              },
              // Friend-posted plans (any visibility)
              {
                creator: { $in: friendIds }
              }
            ]
          };
          break;

        case "mutuals":
          visibilityQuery = {
            $or: [
              // Self-posted plans to mutuals
              {
                creator: new mongoose.Types.ObjectId(userId),
                visibility: "mutuals"
              },
              // Mutual-posted plans to mutuals or community
              {
                creator: { $in: mutualIds },
                visibility: { $in: ["mutuals", "community"] }
              }
            ]
          };
          break;

        case "community":
          visibilityQuery = {
            $or: [
              // Self-posted plans to community
              {
                creator: new mongoose.Types.ObjectId(userId),
                visibility: "community"
              },
              // Third-degree connection plans posted to community
              {
                creator: { 
                  $nin: [...friendIds, ...mutualIds, new mongoose.Types.ObjectId(userId)]
                },
                visibility: "community"
              }
            ]
          };
          break;
      }
    }

    // Combine all filters
    const finalQuery = {
      $and: [
        visibilityQuery,
        baseFilters
      ]
    };

    // console.log('Query:', JSON.stringify(finalQuery, null, 2));

    // Fetch and populate plans
    const plans = (await Plan.find(finalQuery)
    .populate('creator', 'name age avatarUrl friends')
    .sort({ createdAt: -1 })
    .lean()) as unknown as DBPlan[];

    // console.log('Raw plans from DB:', plans);

    // Transform plans for frontend
    const transformedPlans = plans.map((plan: DBPlan) => {
      const isCreator = plan.creator._id.toString() === userId;
      const isFriend = friendIds.some((fId: mongoose.Types.ObjectId) => 
        fId.equals(plan.creator._id)
      );
      const isMutual = mutualIds.some(mId => 
        mId.equals(plan.creator._id)
      );
      
      // Determine connection type
      let connection: "1st" | "2nd" | "3rd";
      if (isCreator || isFriend) {
        connection = "1st";
      } else if (isMutual) {
        connection = "2nd";
      } else {
        connection = "3rd";
      }

      return {
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
          connection
        },
        event: {
          title: plan.event.title,
          description: plan.event.description || "",
          location: plan.event.location,
          time: plan.event.time,
          startTime: plan.event.startTime,
          duration: plan.event.duration,
          interestedUsers: plan.event.interestedUsers.map(user => ({
            userId: user.userId.toString(),
            name: user.name,
            avatar: user.avatar,
            joinedAt: user.joinedAt instanceof Date ? user.joinedAt.toISOString() : user.joinedAt
          })),
          currentInterested: plan.event.interestedUsers?.length || 0,
          openInvite: plan.event.openInvite,
          totalSpots: plan.event.totalSpots,
          openSpots: plan.event.openSpots,
          participants: plan.event.participants.map(p => ({
            userId: p.userId.toString(),
            name: p.name,
            avatar: p.avatar,
            status: p.status,
            joinedAt: p.joinedAt instanceof Date ? p.joinedAt.toISOString() : p.joinedAt
          }))
        }
      };
    });

    // console.log('Transformed plans:', JSON.stringify(transformedPlans, null, 2));

    return NextResponse.json({
      plans: transformedPlans,
      count: transformedPlans.length
    });

  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}