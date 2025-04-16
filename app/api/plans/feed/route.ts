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

    const { userId: currentUserId } = verifyToken(token);
    const url = new URL(req.url);
    
    const requestedView = url.searchParams.get("visibility") || "friends";
    const timeFilter = url.searchParams.get("timeFilter") || "all";
    const search = url.searchParams.get("search") || "";
    const fetchForProfile = url.searchParams.get('fetchForProfile') === 'true';
    const userOnly = url.searchParams.get('userOnly') === 'true';
    const targetUserId = url.searchParams.get('userId') || currentUserId;

    // Find user and their friends
    const user = await User.findById(currentUserId).select('friends');
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
      fofId.toString() !== currentUserId
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

    // If fetching for profile page, only get plans where user is a participant
    if (userOnly) {
      const userIdForQuery = targetUserId;
      console.log('[DEBUG] Fetching plans for profile page, userId:', userIdForQuery);
      
      visibilityQuery = {
        $or: [
          // Plans where user is a participant (including creator)
          {
            'event.participants.userId': new mongoose.Types.ObjectId(userIdForQuery)
          },
          // Plans explicitly created by the user (in case there was any issue with participants array)
          {
            creator: new mongoose.Types.ObjectId(userIdForQuery)
          }
        ]
      };
      
      // If viewing someone else's plans, only show plans that are visible to the current user
      if (targetUserId !== currentUserId) {
        const isFriend = friendIds.some((id: mongoose.Types.ObjectId) => id.toString() === targetUserId);
        const isMutual = mutualIds.some((id: mongoose.Types.ObjectId) => id.toString() === targetUserId);
        
        let visibilityRestriction;
        if (isFriend) {
          // Friends can see everything
          visibilityRestriction = { visibility: { $in: ['friends', 'mutuals', 'community'] } };
        } else if (isMutual) {
          // Mutuals can only see mutuals and community plans
          visibilityRestriction = { visibility: { $in: ['mutuals', 'community'] } };
        } else {
          // Others can only see community plans
          visibilityRestriction = { visibility: 'community' };
        }
        
        visibilityQuery = {
          $and: [
            visibilityQuery,
            visibilityRestriction
          ]
        };
      }
      
      console.log('[DEBUG] User-only query:', JSON.stringify(visibilityQuery, null, 2));
    } else {
      switch (requestedView) {
        case "friends":
          visibilityQuery = {
            $or: [
              // Self-posted plans to friends
              {
                creator: new mongoose.Types.ObjectId(currentUserId),
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
                creator: new mongoose.Types.ObjectId(currentUserId),
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
                creator: new mongoose.Types.ObjectId(currentUserId),
                visibility: "community"
              },
              // Third-degree connection plans posted to community
              {
                creator: { 
                  $nin: [...friendIds, ...mutualIds, new mongoose.Types.ObjectId(currentUserId)]
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
        baseFilters,
        visibilityQuery
      ]
    };

    console.log('[DEBUG] Final query:', JSON.stringify(finalQuery, null, 2));
    const plans = await Plan.find(finalQuery)
      .populate('creator', 'name age avatarUrl friends')
      .sort({ createdAt: -1 });

    console.log('[DEBUG] Found plans:', plans.length);

    // Transform plans for frontend
    const transformedPlans = plans.map((plan: DBPlan) => {
      const isCreator = plan.creator._id.toString() === currentUserId;
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
          currentInterested: plan.event.interestedUsers?.length || 0,
          interestedUsers: plan.event.interestedUsers || [],
          totalSpots: plan.event.totalSpots || 0,
          openSpots: plan.event.openSpots || 0,
          openInvite: plan.event.openInvite || false,
          participants: plan.event.participants?.map(p => ({
            ...p,
            id: p.userId.toString(),
            userId: p.userId.toString(),
            joinedAt: p.joinedAt.toISOString()
          })) || []
        },
        isInterested: plan.event.interestedUsers?.some(u => 
          u.userId.toString() === currentUserId
        ) || false,
        isParticipating: plan.event.participants?.some(p => 
          p.userId.toString() === currentUserId
        ) || false
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