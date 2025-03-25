// types/profile.ts
export interface ProfilePhoto {
    _id: string;
    url: string | null;
    order: number;
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
    stats: ProfileStats;
    avatarUrl: string | null;
    bannerUrl: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    universityEmail?: string;
    university?: string;
  }