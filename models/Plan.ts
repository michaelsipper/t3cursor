// models/Plan.ts

import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IPlanParticipant {
  userId: mongoose.Types.ObjectId;
  name: string;
  avatar: string | null;
  status: 'creator' | 'going';
  joinedAt: Date;
}

export interface IPlanInterestedUser {
  userId: mongoose.Types.ObjectId;
  name: string;
  avatar: string | null;
  joinedAt: Date;
}

export interface IPlan extends Document {
  type: "scheduled" | "realtime" | "repost";
  creator: mongoose.Types.ObjectId;
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
    currentInterested: number;
    openInvite: boolean;
    totalSpots: number;
    openSpots: number;
    participants: IPlanParticipant[];
    interestedUsers: IPlanInterestedUser[];
  };
  visibility: "friends" | "mutuals" | "community";
  repost?: {
    originalPlanId: mongoose.Types.ObjectId;
    message?: string;
  };
  media?: {
    url?: string;
    publicId?: string;
    processedData?: {
      title?: string;
      datetime?: string;
      location?: string;
      description?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>({
  type: {
    type: String,
    required: true,
    enum: ["scheduled", "realtime", "repost"],
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  event: {
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String,
      default: "" 
    },
    location: {
      name: { 
        type: String, 
        required: true 
      },
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [-122.4194, 37.7749] // Default SF coordinates
        }
      }
    },
    time: String,
    startTime: Number,
    duration: Number,
    currentInterested: { 
      type: Number, 
      default: 0 
    },
    openInvite: { 
      type: Boolean, 
      default: false 
    },
    totalSpots: { 
      type: Number, 
      required: true 
    },
    openSpots: { 
      type: Number, 
      required: true 
    },
    participants: [{
      userId: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
      },
      name: { 
        type: String, 
        required: true 
      },
      avatar: { 
        type: String, 
        default: null 
      },
      status: { 
        type: String, 
        enum: ['creator', 'going'],
        required: true 
      },
      joinedAt: { 
        type: Date, 
        default: Date.now 
      }
    }],
    interestedUsers: [{
      userId: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
      },
      name: { 
        type: String, 
        required: true 
      },
      avatar: { 
        type: String, 
        default: null 
      },
      status: {  // Add this
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'confirmed'],
        default: 'pending'
      },
      joinedAt: { 
        type: Date, 
        default: Date.now 
      }
    }]
  },
  visibility: {
    type: String,
    required: true,
    enum: ["friends", "mutuals", "community"],
    default: "friends",
  },
  repost: {
    originalPlanId: { type: Schema.Types.ObjectId, ref: "Plan" },
    message: { type: String },
  },
  media: {
    url: String,
    publicId: String,
    processedData: {
      title: String,
      datetime: String,
      location: String,
      description: String,
    },
  },
}, {
  timestamps: true,
});

// Middleware to maintain counts and states
PlanSchema.pre('save', function(next) {
  if (this.isModified('event.interestedUsers')) {
    // Update currentInterested count
    this.event.currentInterested = this.event.interestedUsers.length;
  }
  
  // Always maintain correct openSpots (only creator should be in participants initially)
  if (this.isNew || this.isModified('event.participants')) {
    const creatorParticipant = this.event.participants.find(p => p.status === 'creator');
    // Ensure only creator is in participants
    if (this.isNew) {
      this.event.participants = creatorParticipant ? [creatorParticipant] : [];
      this.event.openSpots = this.event.totalSpots;
    }
  }
  
  next();
});

// Indexes
PlanSchema.index({ creator: 1, createdAt: -1 });
PlanSchema.index({ type: 1 });
PlanSchema.index({ "event.startTime": 1 }, { sparse: true });
PlanSchema.index({ "event.location.coordinates": "2dsphere" });

// Transform for JSON
PlanSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Plan = models.Plan || model<IPlan>("Plan", PlanSchema);