//components/shared/AppContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { FeedItem, CustomPlaylist } from "@/lib/types";
import { feedItems as initialFeedItems } from "@/lib/mock-data";

interface ProfilePhoto {
  id: string;
  url: string | null;
  order: number;
}

interface ProfileBlurb {
  id: string;
  prompt: string;
  response: string;
}

interface ProfileData {
  name: string;
  age: number;
  location: string;
  bio: string;
  photos: ProfilePhoto[];
  blurbs: ProfileBlurb[];
  joinDate: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  stats: {
    flakeScore: number;
    friendCount: number;
    status: string;
  };
}

interface AppContextType {
  interestedItems: FeedItem[];
  addInterestedItem: (item: FeedItem) => void;
  removeInterestedItem: (itemId: string) => void;
  feedItems: FeedItem[];
  addFeedItem: (item: Omit<FeedItem, 'id'>) => void;
  deleteFeedItem: (itemId: string) => void;
  resetToInitialFeed: () => void;
  customPlaylists: CustomPlaylist[];
  addCustomPlaylist: (playlist: Omit<CustomPlaylist, 'id'>) => void;
  addToPlaylist: (playlistId: string, item: FeedItem) => void;
  removeFromPlaylist: (playlistId: string, itemId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  profileData: ProfileData;
  updateProfileData: (data: Partial<ProfileData>) => void;
  updateProfilePhoto: (id: string, url: string) => void;
  updateAvatarPhoto: (url: string) => void;
  updateBannerPhoto: (url: string) => void;
  updateBlurb: (id: string, response: string) => void;
  removeBlurb: (id: string) => void;
  addBlurb: (prompt: string) => void;
  updateStats: (stats: Partial<ProfileData['stats']>) => void;
}

const initialProfileData: ProfileData = {
  name: "Michael Sipper",
  age: 22,
  location: "San Francisco, CA",
  bio: "Exploring SF's hidden gems and building community through spontaneous adventures 🌉",
  photos: [
    { id: "1", url: null, order: 1 },
    { id: "2", url: null, order: 2 },
    { id: "3", url: null, order: 3 },
  ],
  blurbs: [
    {
      id: "1",
      prompt: "A perfect night looks like...",
      response: "Impromptu rooftop gatherings, vinyl records, and conversations that last until sunrise",
    },
    {
      id: "2",
      prompt: "Best spontaneous decision...",
      response: "Booking a one-way flight to Tokyo, ended up staying for a month",
    },
  ],
  joinDate: "October 2023",
  avatarUrl: null,
  bannerUrl: null,
  stats: {
    flakeScore: 95,
    friendCount: 37,
    status: "Down to hangout",
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [interestedItems, setInterestedItems] = useState<FeedItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('interestedItems');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [feedItems, setFeedItems] = useState<FeedItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('feedItems');
      return saved && JSON.parse(saved).length > 0 ? JSON.parse(saved) : initialFeedItems;
    }
    return initialFeedItems;
  });

  const [customPlaylists, setCustomPlaylists] = useState<CustomPlaylist[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customPlaylists');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [profileData, setProfileData] = useState<ProfileData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('profileData');
      return saved ? JSON.parse(saved) : initialProfileData;
    }
    return initialProfileData;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('interestedItems', JSON.stringify(interestedItems));
      localStorage.setItem('feedItems', JSON.stringify(feedItems));
      localStorage.setItem('customPlaylists', JSON.stringify(customPlaylists));
      localStorage.setItem('profileData', JSON.stringify(profileData));
    }
  }, [interestedItems, feedItems, customPlaylists, profileData]);

  const addInterestedItem = (item: FeedItem) => {
    setInterestedItems((prev) => {
      if (prev.some(existingItem => existingItem.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeInterestedItem = (itemId: string) => {
    setInterestedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const addFeedItem = (item: Omit<FeedItem, 'id'>) => {
    const newItem: FeedItem = {
      ...item,
      id: Date.now().toString(),
    };
    setFeedItems((prev) => [newItem, ...prev]);
  };

  const deleteFeedItem = (itemId: string) => {
    setFeedItems((prev) => prev.filter(item => item.id !== itemId));
    setInterestedItems((prev) => prev.filter(item => item.id !== itemId));
    setCustomPlaylists(prev => 
      prev.map(playlist => ({
        ...playlist,
        items: playlist.items.filter(item => item.id !== itemId)
      }))
    );
  };

  const addCustomPlaylist = (playlist: Omit<CustomPlaylist, 'id'>) => {
    setCustomPlaylists(prev => [...prev, { ...playlist, id: Date.now().toString() }]);
  };

  const addToPlaylist = (playlistId: string, item: FeedItem) => {
    setCustomPlaylists(prev => 
      prev.map(playlist => 
        playlist.id === playlistId
          ? { ...playlist, items: [...playlist.items, item] }
          : playlist
      )
    );
  };

  const removeFromPlaylist = (playlistId: string, itemId: string) => {
    setCustomPlaylists(prev => 
      prev.map(playlist => 
        playlist.id === playlistId
          ? { ...playlist, items: playlist.items.filter(item => item.id !== itemId) }
          : playlist
      )
    );
  };

  const deletePlaylist = (playlistId: string) => {
    setCustomPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId));
  };

  const updateProfileData = (data: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...data }));
  };

  const updateProfilePhoto = (id: string, url: string) => {
    setProfileData(prev => ({
      ...prev,
      photos: prev.photos.map(photo => 
        photo.id === id ? { ...photo, url } : photo
      ),
    }));
  };

  const updateAvatarPhoto = (url: string) => {
    setProfileData(prev => ({ ...prev, avatarUrl: url }));
  };

  const updateBannerPhoto = (url: string) => {
    setProfileData(prev => ({ ...prev, bannerUrl: url }));
  };

  const updateBlurb = (id: string, response: string) => {
    setProfileData(prev => ({
      ...prev,
      blurbs: prev.blurbs.map(blurb => 
        blurb.id === id ? { ...blurb, response } : blurb
      ),
    }));
  };

  const removeBlurb = (id: string) => {
    setProfileData(prev => ({
      ...prev,
      blurbs: prev.blurbs.filter(blurb => blurb.id !== id),
    }));
  };

  const addBlurb = (prompt: string) => {
    setProfileData(prev => ({
      ...prev,
      blurbs: [...prev.blurbs, {
        id: Date.now().toString(),
        prompt,
        response: "",
      }],
    }));
  };

  const updateStats = (stats: Partial<ProfileData['stats']>) => {
    setProfileData(prev => ({
      ...prev,
      stats: { ...prev.stats, ...stats },
    }));
  };

  const resetToInitialFeed = () => {
    setFeedItems(initialFeedItems);
    setCustomPlaylists([]);
    setProfileData(initialProfileData);
    setInterestedItems([]);
    localStorage.removeItem('feedItems');
    localStorage.removeItem('customPlaylists');
    localStorage.removeItem('profileData');
    localStorage.removeItem('interestedItems');
  };

  const contextValue = {
    interestedItems,
    addInterestedItem,
    removeInterestedItem,
    feedItems,
    addFeedItem,
    deleteFeedItem,
    resetToInitialFeed,
    customPlaylists,
    addCustomPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    deletePlaylist,
    profileData,
    updateProfileData,
    updateProfilePhoto,
    updateAvatarPhoto,
    updateBannerPhoto,
    updateBlurb,
    removeBlurb,
    addBlurb,
    updateStats,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}