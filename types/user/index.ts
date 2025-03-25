import mongoose from "mongoose";
import { ProfilePhoto, ProfilePrompt } from "../profile";

export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
}

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