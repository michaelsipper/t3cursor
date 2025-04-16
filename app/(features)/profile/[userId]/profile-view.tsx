'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ProfileInfo } from '@/app/(features)/profile/components/profile-info';
import { PhotosPrompts } from '@/app/(features)/profile/components/photos-prompts';
import { PlansView } from '@/app/(features)/profile/components/plans-view';
import { InterestsView } from '@/app/(features)/profile/components/interests-view';
import { usePlan } from '@/contexts/PlanContext';
import { PageContainer } from '@/components/shared/page-container';
import type { ProfileData, FeedItem } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface FriendRequestStatus {
  status: 'none' | 'pending' | 'sent' | 'friends';
}

export function ProfileView({ userId }: { userId: string }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { fetchUserPlans } = usePlan();
  const router = useRouter();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [friendStatus, setFriendStatus] = useState<FriendRequestStatus>({ status: 'none' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"photos" | "plans" | "interests">("photos");
  const [userPlans, setUserPlans] = useState<FeedItem[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Check if this is the current user and redirect to the main profile page
  useEffect(() => {
    if (user) {
      const currentUserId = user._id?.toString() || user.id?.toString();
      // Compare as strings to handle different ID formats
      if (currentUserId && (userId === currentUserId)) {
        console.log('[DEBUG] Navigating from profile/[userId] to /profile for current user');
        router.replace('/profile');
      }
    }
  }, [user, userId, router]);

  // Memoize the fetch function to avoid recreating it on every render
  const fetchProfileData = useCallback(async () => {
    if (!userId || !isInitialLoad) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch profile data
      const response = await fetch(`/api/users/${userId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const userData = await response.json();
      
      // Transform data to match ProfileData structure
      const formattedData: ProfileData = {
        name: userData.name,
        age: userData.age || 0,
        location: userData.location || '',
        bio: userData.bio || '',
        photos: userData.photos || [],
        prompts: userData.prompts || [],
        avatarUrl: userData.avatarUrl || null,
        bannerUrl: userData.bannerUrl || null,
        stats: {
          flakeScore: userData.reliability || 100,
          friendCount: userData.friends?.length || 0,
          status: userData.status || 'Down to hangout'
        },
        emailVerified: userData.emailVerified || false,
        phoneVerified: userData.phoneVerified || false,
        phoneNumber: userData.phoneNumber,
        universityEmail: userData.universityEmail,
        university: userData.university,
        joinDate: userData.createdAt || new Date().toISOString(),
        lastUpdated: userData.updatedAt,
        friends: userData.friends?.map((f: any) => ({
          id: f.id || f,
          name: f.name || '',
          avatarUrl: f.avatarUrl || null
        }))
      };
      
      setProfileData(formattedData);

      // Fetch friend request status
      const statusResponse = await fetch(`/api/friends/status/${userId}`, {
        credentials: 'include'
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setFriendStatus(statusData);
      }
      
      // Fetch user's plans
      const plans = await fetchUserPlans(userId);
      setUserPlans(plans || []);
      setIsInitialLoad(false);
      
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      showToast('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId, showToast, fetchUserPlans, isInitialLoad]);

  // Reset initial load flag when userId changes
  useEffect(() => {
    setIsInitialLoad(true);
  }, [userId]);

  // Only fetch profile data once on initial load
  useEffect(() => {
    if (isInitialLoad && userId) {
      fetchProfileData();
    }
  }, [fetchProfileData, isInitialLoad, userId]);

  const handleFriendRequest = async () => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetUserId: userId })
      });

      if (!response.ok) {
        throw new Error('Failed to send friend request');
      }

      setFriendStatus({ status: 'sent' });
      showToast('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      showToast('Failed to send friend request');
    }
  };

  const handleCancelRequest = async () => {
    try {
      const response = await fetch(`/api/friends/request/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to cancel friend request');
      }

      setFriendStatus({ status: 'none' });
      showToast('Friend request cancelled');
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      showToast('Failed to cancel friend request');
    }
  };

  const handleAcceptRequest = async () => {
    try {
      const response = await fetch(`/api/friends/accept/${userId}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to accept friend request');
      }

      setFriendStatus({ status: 'friends' });
      showToast('Friend request accepted!');
      
      // Refresh profile data to update friend count
      const profileResponse = await fetch(`/api/users/${userId}`, {
        credentials: 'include'
      });
      
      if (profileResponse.ok) {
        const updatedData = await profileResponse.json();
        setProfileData(prev => prev ? {
          ...prev,
          stats: {
            ...prev.stats,
            friendCount: updatedData.friends?.length || 0
          }
        } : null);
      }
      
    } catch (error) {
      console.error('Error accepting friend request:', error);
      showToast('Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async () => {
    try {
      const response = await fetch(`/api/friends/decline/${userId}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to decline friend request');
      }

      setFriendStatus({ status: 'none' });
      showToast('Friend request declined');
    } catch (error) {
      console.error('Error declining friend request:', error);
      showToast('Failed to decline friend request');
    }
  };

  // Friend request action buttons component
  const FriendRequestActions = () => {
    if (user?.id === userId) return null;
    
    switch(friendStatus.status) {
      case 'none':
        return (
          <Button onClick={handleFriendRequest} className="bg-blue-500 hover:bg-blue-600">
            Add Friend
          </Button>
        );
      case 'sent':
        return (
          <Button variant="outline" onClick={handleCancelRequest}>
            Cancel Request
          </Button>
        );
      case 'pending':
        return (
          <div className="flex gap-2">
            <Button onClick={handleAcceptRequest} className="bg-blue-500 hover:bg-blue-600">
              Accept
            </Button>
            <Button variant="outline" onClick={handleDeclineRequest}>
              Decline
            </Button>
          </div>
        );
      case 'friends':
        return (
          <Button variant="outline" className="text-blue-500">
            Friends ✓
          </Button>
        );
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="p-4">
        <Alert message={error || "Profile not found"} />
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        {/* Profile Info */}
        <div className="relative">
          <ProfileInfo
            profileData={profileData}
            isEditing={false}
            onEdit={() => {}}
            onFileUpload={() => Promise.resolve()}
            uploadLoading={null}
            onUpdateProfile={() => Promise.resolve()}
          />
          
          {/* Friend Request Button - Positioned absolutely to prevent layout shift */}
          <div className="absolute top-4 right-4">
            <FriendRequestActions />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="border-b border-zinc-200 dark:border-zinc-800 mt-8">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("photos")}
                className={`
                  px-1 py-4 text-sm font-medium border-b-2 transition-colors
                  ${
                    activeTab === "photos"
                      ? "border-blue-500 text-blue-500"
                      : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }
                `}
              >
                Photos & Prompts
              </button>
              <button
                onClick={() => setActiveTab("plans")}
                className={`
                  px-1 py-4 text-sm font-medium border-b-2 transition-colors
                  ${
                    activeTab === "plans"
                      ? "border-blue-500 text-blue-500"
                      : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }
                `}
              >
                Plans
              </button>
              {/* Hide interests tab for now as we don't have that data for other users yet */}
              {/* <button
                onClick={() => setActiveTab("interests")}
                className={`
                  px-1 py-4 text-sm font-medium border-b-2 transition-colors
                  ${
                    activeTab === "interests"
                      ? "border-blue-500 text-blue-500"
                      : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }
                `}
              >
                Interests
              </button> */}
            </div>
          </div>

          {/* Content */}
          <div className="px-4">
            {activeTab === "photos" && (
              <PhotosPrompts
                profileData={profileData}
                isEditing={false}
                uploadLoading={null}
                showPromptModal={false}
                editingPromptId={null}
                onFileUpload={() => Promise.resolve()}
                onUpdateBlurb={() => Promise.resolve()}
                onRemoveBlurb={() => Promise.resolve()}
                onAddBlurb={() => Promise.resolve()}
                onPromptAction={() => Promise.resolve()}
                setShowPromptModal={() => {}}
                setEditingPromptId={() => {}}
              />
            )}

            {activeTab === "plans" && (
              <PlansView plans={userPlans} />
            )}

            {/* {activeTab === "interests" && (
              <InterestsView interestedItems={[]} />
            )} */}
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 