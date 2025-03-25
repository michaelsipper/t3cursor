// components/shared/ProfileContext.tsx

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from './AuthContext';
import { MAX_PHOTOS, MAX_PROMPTS, DEFAULT_STATUS_OPTIONS } from '@/lib/constants';

interface ProfilePhoto {
  _id: string;
  url: string | null;
  order: number;
  region: 'main' | 'secondary' | 'tertiary';
  publicId?: string | null;
}

interface ProfilePrompt {
  _id: string;
  prompt: string;
  response: string;
}

interface ProfileStats {
  flakeScore: number;
  friendCount: number;
  status: typeof DEFAULT_STATUS_OPTIONS[number];
}

interface ProfileData {
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

interface ProfileContextType {
  profileData: ProfileData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => Promise<void>;
  updateProfile: (updates: Partial<ProfileData>) => Promise<void>;
  uploadFile: (file: File, type: 'avatar' | 'banner' | 'photo', photoId?: string) => Promise<void>;
  deletePhoto: (photoId: string) => Promise<void>;
  updateBlurb: (id: string, response: string) => Promise<void>;
  editPrompt: (id: string, prompt: string) => Promise<void>;
  removeBlurb: (id: string) => Promise<void>;
  addBlurb: (prompt: string) => Promise<void>;
  cleanupPrompts: () => Promise<void>;
  verifyUniversityEmail: (email: string) => Promise<void>;
  verifyPhoneNumber: (phone: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [tempProfileData, setTempProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Reset temp data when editing mode changes
  useEffect(() => {
    if (isEditing) {
      setTempProfileData(profileData);
    } else {
      setTempProfileData(null);
    }
  }, [isEditing]);

  const refreshProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Refreshing profile data...");
      
      const response = await fetch('/api/users/get', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      console.log("✅ Profile data refreshed:", data);
      setProfileData(data);
      
    } catch (error) {
      console.error("❌ Profile refresh error:", error);
      setError(error instanceof Error ? error.message : 'Failed to load profile');
      showToast("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const saveChanges = async () => {
    if (!tempProfileData) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/users/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ updates: tempProfileData })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setProfileData(tempProfileData);
      setTempProfileData(null);
      showToast('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      showToast('Failed to update profile');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = async (updates: Partial<ProfileData>) => {
    if (isEditing) {
      // Update temp data while editing
      setTempProfileData(prev => prev ? { ...prev, ...updates } : null);
    } else {
      // Direct update when not in editing mode
      try {
        setSaving(true);
        const response = await fetch('/api/users/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ updates })
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        setProfileData(prev => prev ? { ...prev, ...updates } : null);
      } catch (error) {
        console.error('Failed to update profile:', error);
        showToast('Failed to update profile');
      } finally {
        setSaving(false);
      }
    }
  };

  const cleanupPrompts = async () => {
    try {
      setSaving(true);
      if (!profileData) return;
      
      // Keep only the first MAX_PROMPTS prompts
      const validPrompts = profileData.prompts.slice(0, MAX_PROMPTS);
      
      await updateProfile({ prompts: validPrompts });
      console.log("✅ Prompts cleaned up successfully");
    } catch (error) {
      console.error("❌ Failed to cleanup prompts:", error);
      showToast('Failed to cleanup prompts');
    } finally {
      setSaving(false);
    }
  };

  const updateBlurb = async (id: string, response: string) => {
    if (isEditing && tempProfileData) {
      const updatedPrompts = tempProfileData.prompts.map(prompt =>
        prompt._id === id ? { ...prompt, response } : prompt
      );
      setTempProfileData(prev => prev ? { ...prev, prompts: updatedPrompts } : null);
    } else if (!isEditing && profileData) {
      try {
        const updatedPrompts = profileData.prompts.map(prompt =>
          prompt._id === id ? { ...prompt, response } : prompt
        );
        await updateProfile({ prompts: updatedPrompts });
      } catch (error) {
        console.error("❌ Update blurb error:", error);
        showToast('Failed to update prompt');
        throw error;
      }
    }
  };

  const editPrompt = async (id: string, prompt: string) => {
    try {
      if (!profileData) return;
      
      const updatedPrompts = profileData.prompts.map(p =>
        p._id === id ? { ...p, prompt } : p
      );

      await updateProfile({ prompts: updatedPrompts });
      showToast('Prompt updated successfully');
    } catch (error) {
      console.error("❌ Edit prompt error:", error);
      showToast('Failed to update prompt');
      throw error;
    }
  };

  const removeBlurb = async (id: string) => {
    if (isEditing && tempProfileData) {
      const updatedPrompts = tempProfileData.prompts.filter(prompt => prompt._id !== id);
      setTempProfileData(prev => prev ? { ...prev, prompts: updatedPrompts } : null);
    } else if (!isEditing && profileData) {
      try {
        const updatedPrompts = profileData.prompts.filter(prompt => prompt._id !== id);
        await updateProfile({ prompts: updatedPrompts });
        showToast('Prompt removed successfully');
      } catch (error) {
        console.error("❌ Remove blurb error:", error);
        showToast('Failed to remove prompt');
        throw error;
      }
    }
  };

  const addBlurb = async (prompt: string) => {
    try {
      if (!profileData && !tempProfileData) return;

      const currentPrompts = isEditing ? tempProfileData!.prompts : profileData!.prompts;
      
      if (currentPrompts.length >= MAX_PROMPTS) {
        showToast(`Maximum of ${MAX_PROMPTS} prompts allowed`);
        return;
      }
  
      // Generate a temporary ID that matches MongoDB ObjectId format
      const tempId = Array.from(Array(24), () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
  
      const newPrompt = {
        _id: tempId,
        prompt,
        response: ""
      };

      const updatedPrompts = [...currentPrompts, newPrompt];

      if (isEditing) {
        setTempProfileData(prev => prev ? { ...prev, prompts: updatedPrompts } : null);
      } else {
        await updateProfile({ prompts: updatedPrompts });
        showToast('Prompt added successfully');
      }
    } catch (error) {
      console.error("❌ Add blurb error:", error);
      showToast('Failed to add prompt');
      throw error;
    }
  };

  const uploadFile = async (file: File, type: 'avatar' | 'banner' | 'photo', photoId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (photoId) formData.append('photoId', photoId);
  
    try {
      setSaving(true);
      console.log("📤 Uploading file:", { type, photoId });

      const response = await fetch('/api/users/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
  
      if (!response.ok) {
        throw new Error(await response.text());
      }
  
      const { url, publicId } = await response.json();
      
      if (type === 'avatar' || type === 'banner') {
        const updates = {
          [type === 'avatar' ? 'avatarUrl' : 'bannerUrl']: url
        };
        
        if (isEditing) {
          setTempProfileData(prev => prev ? { ...prev, ...updates } : null);
        } else {
          await updateProfile(updates);
        }
      } else if (photoId && (profileData || tempProfileData)) {
        const currentPhotos = isEditing ? tempProfileData!.photos : profileData!.photos;
        const updatedPhotos = currentPhotos.map(photo => 
          photo._id === photoId ? { ...photo, url, publicId } : photo
        );

        if (isEditing) {
          setTempProfileData(prev => prev ? { ...prev, photos: updatedPhotos } : null);
        } else {
          await updateProfile({ photos: updatedPhotos });
        }
      }
      
      showToast('Upload successful!');
    } catch (error) {
      console.error("❌ Upload error:", error);
      showToast('Failed to upload file');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      setSaving(true);
      if (!profileData && !tempProfileData) return;

      const currentPhotos = isEditing ? tempProfileData!.photos : profileData!.photos;
      const updatedPhotos = currentPhotos.map(photo => 
        photo._id === photoId ? { ...photo, url: null, publicId: null } : photo
      );

      if (isEditing) {
        setTempProfileData(prev => prev ? { ...prev, photos: updatedPhotos } : null);
      } else {
        await updateProfile({ photos: updatedPhotos });
        showToast('Photo deleted successfully');
      }
    } catch (error) {
      console.error("❌ Delete photo error:", error);
      showToast('Failed to delete photo');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const verifyUniversityEmail = async (email: string) => {
    try {
      const response = await fetch('/api/users/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      if (!response.ok) throw new Error(await response.text());

      showToast('Verification email sent');
      await refreshProfile();
    } catch (error) {
      console.error("❌ Email verification error:", error);
      showToast('Failed to verify email');
      throw error;
    }
  };

  const verifyPhoneNumber = async (phone: string) => {
    try {
      const response = await fetch('/api/users/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone })
      });

      if (!response.ok) throw new Error(await response.text());

      showToast('Verification code sent');
      await refreshProfile();
    } catch (error) {
      console.error("❌ Phone verification error:", error);
      showToast('Failed to verify phone');
      throw error;
    }
  };

  const contextValue = {
    profileData: isEditing ? tempProfileData : profileData,
    loading,
    saving,
    error,
    isEditing,
    setIsEditing: async (editing: boolean) => {
      if (!editing && isEditing) {
        // Save changes when exiting edit mode
        await saveChanges();
      }
      setIsEditing(editing);
    },
    updateProfile,
    uploadFile,
    deletePhoto,
    updateBlurb,
    editPrompt,
    removeBlurb,
    addBlurb,
    cleanupPrompts,
    verifyUniversityEmail,
    verifyPhoneNumber,
    refreshProfile,
  };

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}