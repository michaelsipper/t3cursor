import { ReactNode } from "react";
import { FeedItem } from "../plan";

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

export interface CustomPlaylist {
  id: string;
  title: string;
  description: string;
  items: FeedItem[];
} 