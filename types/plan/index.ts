import mongoose from "mongoose";
import { Location } from "../common";

export interface Participant {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  status: "creator" | "going";
  joinedAt: string;
}

export interface InterestedUser {
  userId: string;
  name: string;
  avatar: string | null;
  joinedAt: string;
}

export interface Poster {
  id: string;
  name: string;
  age?: number;
  connection: "1st" | "2nd" | "3rd";
  avatarUrl?: string | null;
}

export interface Event {
  title: string;
  description: string;
  location: string | Location;
  time?: string;
  startTime?: number;
  duration?: number;
  currentInterested: number;
  openInvite: boolean;
  totalSpots: number;
  openSpots: number;
  participants: Participant[];
  interestedUsers: InterestedUser[];
  originalPoster?: Poster;
  host?: {
    name: string;
    avatarUrl?: string;
  };
}

export interface FeedItem {
  id: string;
  type: "scheduled" | "realtime" | "repost";
  creator: {
    id: string;
  };
  poster: Poster;
  event: Event;
  repostMessage?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'confirmed';
  comments?: Array<{
    id: string;
    userId: string;
    content: string;
    userName: string;
    userAvatar?: string;
    createdAt: string;
  }>;
}

export interface PlanActionResponse {
  success: boolean;
  interestedCount: number;
  interestedUsers: InterestedUser[];
  participants: Participant[];
  openSpots: number;
}

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
  status?: 'pending' | 'accepted' | 'rejected';
}

export interface IPlan extends mongoose.Document {
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

export interface FeedCardProps {
  item: FeedItem;
  onInterestToggle: (id: string) => void;
  onRepostToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isInterested: boolean;
  isReposted: boolean;
}

export interface ParticipantsDisplayProps {
  totalSpots: number;
  participants: Participant[];
  remainingSpots: number;
  showNames?: boolean;
  openInvite?: boolean;
  maxDisplay?: number;
  posterName?: string;
} 