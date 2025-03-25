// lib/types.ts

import { ReactNode } from "react";
import mongoose from "mongoose";

// Basic User Types
export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
}

// Participant Types
export interface Participant {
  id: string; // Add this
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

// Location Types
export interface Location {
  name: string;
  coordinates?: {
    type: string;
    coordinates: [number, number];
  };
  address?: string;
}

export interface EventLocation {
  name: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Feed and Plan Types
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
  status?: 'pending' | 'accepted' | 'rejected' | 'confirmed';  // Move this here
  comments?: Array<{
    id: string;
    userId: string;
    content: string;
    userName: string;
    userAvatar?: string;
    createdAt: string;
  }>;
}

// Plan Interaction Response Types
export interface PlanActionResponse {
  success: boolean;
  interestedCount: number;
  interestedUsers: InterestedUser[];
  participants: Participant[];
  openSpots: number;
}

// Custom Playlist Types
export interface CustomPlaylist {
  id: string;  // Changed from number
  title: string;
  description: string;
  items: FeedItem[];
}

// Profile Types
export interface ProfilePhoto {
  _id: string;
  url: string | null;
  order: number;
  region: string;
  publicId?: string | null;
}

export interface ProfilePrompt {
  _id: string;
  prompt: string;
  response: string;
}

export interface ProfileStats {
  flakeScore: number;
  friendCount: number;
  status: string;
}

export interface ProfileData {
  name: string;
  age: number;
  location: string;
  bio: string;
  photos: ProfilePhoto[];
  prompts: ProfilePrompt[];
  avatarUrl: string | null;
  bannerUrl: string | null;
  stats: ProfileStats;
  emailVerified: boolean;
  phoneVerified: boolean;
  phoneNumber?: string;
  universityEmail?: string;
  university?: string;
  joinDate: string;
  lastUpdated?: string;
  friends?: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
  }>;
}

// Mongoose Model Types
export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password?: string;
  age?: number;
  location?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  photos: ProfilePhoto[];
  prompts: ProfilePrompt[];
  reliabilityScore: number;
  friends: mongoose.Types.ObjectId[];
  emailVerified: boolean;
  phoneVerified: boolean;
  phoneNumber?: string;
  universityEmail?: string;
  university?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
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

// Component Props Types
export interface FeedCardProps {
  item: FeedItem;
  onInterestToggle: (id: string) => void;  // Change to string
  onRepostToggle: (id: string) => void;    // Change to string
  onDelete: (id: string) => void;          // Change to string
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