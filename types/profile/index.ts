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