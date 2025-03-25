// lib/index.ts

export interface Participant {
    id: number;
    name: string;
    avatar: string | null;
  }
  
  export interface Poster {
    name: string;
    age?: number;
    connection: '1st' | '2nd' | '3rd';
  }
  
  export interface Event {
    title: string;
    description: string;
    time?: string;
    location: string;
    currentInterested: number;
    openInvite: boolean;
    totalSpots: number;
    participants: Participant[];
    startTime?: number;
    duration?: number;
    originalPoster?: Poster;
  }
  
  export interface FeedItem {
    id: number;
    type: 'scheduled' | 'realtime' | 'repost';
    poster: Poster;
    event: Event;
    repostMessage?: string;
  }