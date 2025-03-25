// app/api/plans/nearby/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/middleware/auth";
import { Plan } from "@/models/Plan";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

const DEFAULT_RADIUS = 10; // kilometers
const MAX_RADIUS = 50; // kilometers

interface PopulatedCreator {
  _id: mongoose.Types.ObjectId;
  name: string;
  age: number;
  friends?: mongoose.Types.ObjectId[];
}

interface LeanPlanDocument {
  _id: mongoose.Types.ObjectId;
  type: string;
  creator: PopulatedCreator;
  event: {
    title: string;
    description: string;
    location: {
      name: string;
      coordinates?: {
        coordinates: [number, number];
      };
    };
    time?: string;
    startTime?: number;
    duration?: number;
    currentInterested: number;
    openInvite: boolean;
    totalSpots: number;
    participants: Array<{
      userId: mongoose.Types.ObjectId;
      name: string;
      avatar: string | null;
    }>;
  };
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
    
    // Get query parameters
    const lat = Number(url.searchParams.get('lat'));
    const lng = Number(url.searchParams.get('lng'));
    const radius = Math.min(
      Number(url.searchParams.get('radius')) || DEFAULT_RADIUS,
      MAX_RADIUS
    );

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "Valid latitude and longitude required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId).select('friends');
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build geospatial query
    const query = {
      "event.location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat] // MongoDB uses [longitude, latitude]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      },
      // Only show active plans
      $or: [
        { type: "scheduled", "event.time": { $gte: new Date() } },
        { 
          type: "realtime",
          "event.startTime": { 
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
          }
        }
      ]
    };

    // Fetch nearby plans
    const nearbyPlans = await Plan.find(query)
      .populate<{ creator: PopulatedCreator }>('creator', 'name age friends')
      .limit(50)
      .lean() as unknown as LeanPlanDocument[];

    // Transform plans for response
    const transformedPlans = nearbyPlans.map(plan => {
      const isFriend = user.friends?.some((friend: mongoose.Types.ObjectId) => 
        friend.toString() === plan.creator._id.toString()
      );
      
      const hasMutualFriends = user.friends?.some((friend: mongoose.Types.ObjectId) => 
        plan.creator.friends?.some(creatorFriend => 
          creatorFriend.toString() === friend.toString()
        )
      );

      const connection = plan.creator._id.toString() === userId ? '1st' : 
                        isFriend ? '1st' :
                        hasMutualFriends ? '2nd' : '3rd';

      return {
        id: plan._id.toString(),
        type: plan.type,
        poster: {
          name: plan.creator.name,
          age: plan.creator.age,
          connection
        },
        event: {
          title: plan.event.title,
          description: plan.event.description,
          location: plan.event.location.name,
          time: plan.event.time,
          startTime: plan.event.startTime,
          duration: plan.event.duration,
          currentInterested: plan.event.currentInterested,
          openInvite: plan.event.openInvite,
          totalSpots: plan.event.totalSpots,
          participants: plan.event.participants,
          distance: plan.event.location.coordinates 
            ? calculateDistance(
                lat, 
                lng, 
                plan.event.location.coordinates.coordinates[1],
                plan.event.location.coordinates.coordinates[0]
              )
            : null
        }
      };
    });

    return NextResponse.json({
      plans: transformedPlans,
      count: transformedPlans.length
    });

  } catch (error) {
    console.error("Nearby plans error:", error);
    return NextResponse.json(
      { error: "Failed to fetch nearby plans" },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}