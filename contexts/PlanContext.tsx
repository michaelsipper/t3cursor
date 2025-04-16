// contexts/PlanContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type {
  FeedItem,
  CustomPlaylist,
  EventLocation,
  Participant,
  InterestedUser,
  PlanActionResponse,
  IPlan,
  IPlanInterestedUser,
  IPlanParticipant,
} from "@/types";

interface ProcessedData {
  title: string;
  description: string;
  location: EventLocation;
  datetime?: string;
}

interface PlanOptions {
  visibility?: "friends" | "mutuals" | "community";
  timeFilter?: "all" | "now" | "later";
  search?: string;
}

interface PlanContextType {
  feedItems: FeedItem[];
  interestedItems: FeedItem[];
  userPlans: FeedItem[];
  loading: boolean;
  error: string | null;
  visibility: "friends" | "mutuals" | "community";
  timeFilter: "all" | "now" | "later";
  searchQuery: string;
  createPlan: (planData: any) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  updatePlan: (planId: string, updates: any) => Promise<void>;
  toggleInterest: (planId: string) => Promise<void>;
  repostPlan: (planId: string, message?: string) => Promise<void>;
  joinPlan: (planId: string) => Promise<PlanActionResponse>;
  leavePlan: (planId: string) => Promise<PlanActionResponse>;
  addComment: (planId: string, content: string) => Promise<void>;
  fetchPlans: (options?: PlanOptions) => Promise<void>;
  fetchUserPlans: (userId?: string) => Promise<FeedItem[]>;
  fetchNearbyPlans: (
    lat: number,
    lng: number,
    radius?: number
  ) => Promise<void>;
  setVisibility: (visibility: "friends" | "mutuals" | "community") => void;
  setTimeFilter: (filter: "all" | "now" | "later") => void;
  setSearchQuery: (query: string) => void;
  setFeedItems: React.Dispatch<React.SetStateAction<FeedItem[]>>;
  processUpload: (
    file: File | string,
    type: "image" | "url"
  ) => Promise<ProcessedData>;
  getParticipantStatus: (planId: string) => Promise<boolean>;
  refreshPlanStatus: (planId: string) => Promise<void>;
  setParticipantStatus: (planId: string, status: boolean) => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const { isAuthenticated, user } = useAuth();

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [interestedItems, setInterestedItems] = useState<FeedItem[]>([]);
  const [userPlans, setUserPlans] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<
    "friends" | "mutuals" | "community"
  >("friends");
  const [timeFilter, setTimeFilter] = useState<"all" | "now" | "later">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Add a cache map for user plans
  const [userPlansCache, setUserPlansCache] = useState<Record<string, { plans: FeedItem[], timestamp: number }>>({});
  const CACHE_EXPIRY = 30000; // 30 seconds cache expiry

  // Clear state when auth changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setFeedItems([]);
      setInterestedItems([]);
      setUserPlans([]);
      setError(null);
      setVisibility("friends");
      setTimeFilter("all");
      setSearchQuery("");
    }
  }, [isAuthenticated, user]);

  // Only fetch plans if authenticated and filter settings change
  useEffect(() => {
    if (isAuthenticated && user) {
      const options: PlanOptions = {
        visibility,
        timeFilter,
        search: searchQuery,
      };
      
      // Don't use fetchUserPlans here - it will be called separately when needed
      fetchPlans(options);
    }
  }, [isAuthenticated, user, visibility, timeFilter, searchQuery]);

  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) return null;
      
      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  const enhanceParticipantsData = async (participants: any[]) => {
    if (!Array.isArray(participants) || participants.length === 0) return participants;
    
    // Get unique user IDs that are missing data (name or avatar)
    const incompleteParticipants = participants.filter(
      p => (!p.name || p.name === 'Unknown participant' || !p.avatar)
    );
    
    if (incompleteParticipants.length === 0) return participants;
    
    console.log('🔍 Enhancing participant data for:', 
      incompleteParticipants.map(p => ({ userId: p.userId, name: p.name }))
    );
    
    // Fetch user data for each incomplete participant
    const enhancedParticipants = [...participants];
    
    await Promise.all(
      incompleteParticipants.map(async (participant) => {
        try {
          // Find the participant in our array
          const index = enhancedParticipants.findIndex(p => p.userId === participant.userId);
          if (index === -1) return;
          
          // Fetch user data
          const userData = await fetchUserData(participant.userId);
          if (!userData) return;
          
          // Update the participant with the fetched data
          if (!enhancedParticipants[index].name || enhancedParticipants[index].name === 'Unknown participant') {
            enhancedParticipants[index].name = userData.name || enhancedParticipants[index].name;
          }
          
          if (!enhancedParticipants[index].avatar) {
            enhancedParticipants[index].avatar = userData.avatarUrl || 
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name || 'User')}`;
          }
          
          console.log('🔍 Enhanced participant data:', {
            userId: participant.userId,
            name: enhancedParticipants[index].name,
            hasAvatar: !!enhancedParticipants[index].avatar
          });
        } catch (err) {
          console.error('Error enhancing participant:', participant.userId, err);
        }
      })
    );
    
    return enhancedParticipants;
  };

  const fetchUserPlans = useCallback(async (userId?: string) => {
    if (!user) {
      console.log('[DEBUG] fetchUserPlans called without user, skipping');
      return [];
    }
    
    const currentTime = Date.now();
    const targetUserId = userId || user._id?.toString() || user.id?.toString() || '';
    const isCurrentUser = !userId || targetUserId === user._id?.toString() || targetUserId === user.id?.toString();
    
    console.log('[DEBUG] fetchUserPlans', {
      userId,
      targetUserId,
      isCurrentUser,
      currentUserId: user._id?.toString() || user.id?.toString()
    });
    
    // Check if we have recent data in cache
    if (userPlansCache[targetUserId] && 
        currentTime - userPlansCache[targetUserId].timestamp < CACHE_EXPIRY) {
      console.log('[DEBUG] Using cached plans for user', targetUserId.slice(0, 8) + '...');
      
      if (isCurrentUser) {
        console.log('[DEBUG] Setting userPlans state from cache for current user');
        setUserPlans(userPlansCache[targetUserId].plans);
      }
      
      return userPlansCache[targetUserId].plans;
    }
    
    try {
      // Truncate IDs in logs for better readability
      console.log('[DEBUG] Fetching fresh plans for user', targetUserId.slice(0, 8) + '...');
      
      const params = new URLSearchParams();
      params.append('userOnly', 'true');
      
      // If fetching for another user, add their ID to the query
      if (!isCurrentUser) {
        params.append('userId', userId!);
      }
      
      const response = await fetch(`/api/plans/feed?${params.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { plans } = await response.json();
      console.log('[DEBUG] Received plans from API:', plans?.length || 0, 'plans');
      
      // Enhance participant data for each plan
      const enhancedPlans = await Promise.all(
        (plans || []).map(async (plan: any) => {
          if (plan.event.participants && plan.event.participants.length > 0) {
            plan.event.participants = await enhanceParticipantsData(plan.event.participants);
          }
          return plan;
        })
      );
      
      // Store plans in cache
      setUserPlansCache(prev => ({
        ...prev,
        [targetUserId]: {
          plans: enhancedPlans || [],
          timestamp: currentTime
        }
      }));
      
      // For current user, update the state
      if (isCurrentUser) {
        console.log('[DEBUG] Setting userPlans state for current user');
        setUserPlans(enhancedPlans || []);
      }
      
      return enhancedPlans || [];
    } catch (error) {
      console.error('Error fetching user plans:', error);
      showToast('Failed to load plans');
      return [];
    }
  }, [user, showToast, userPlansCache, enhanceParticipantsData]);

  const fetchPlans = async (options?: PlanOptions) => {
    if (!user) {
      console.log("No user data available, skipping fetch");
      return;
    }

    try {
      console.log('[DEBUG] Starting fetchPlans');
      setLoading(true);
      setError(null);

      const finalOptions = {
        visibility: options?.visibility || visibility,
        timeFilter: options?.timeFilter || timeFilter,
        search: options?.search || searchQuery,
      };

      console.log("[DEBUG] Fetching plans with options:", finalOptions);

      const params = new URLSearchParams();
      params.append("visibility", finalOptions.visibility);
      params.append("timeFilter", finalOptions.timeFilter);
      if (finalOptions.search) {
        params.append("search", finalOptions.search);
      }

      console.log('[DEBUG] Fetching plans with params:', Object.fromEntries(params.entries()));
      const response = await fetch(`/api/plans/feed?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { plans } = await response.json();
      
      // Enhance participant data for each plan
      const enhancedPlans = await Promise.all(
        plans.map(async (plan: any) => {
          if (plan.event.participants && plan.event.participants.length > 0) {
            plan.event.participants = await enhanceParticipantsData(plan.event.participants);
          }
          return plan;
        })
      );
      
      const transformedPlans = enhancedPlans;
      console.log("[DEBUG] Received plans from API:", transformedPlans);

      const userId = user._id?.toString() || user.id?.toString();
      console.log("[DEBUG] Current user ID:", userId);

      // For feed page, update feed items and filter interested/participating plans
      setFeedItems(transformedPlans);
      
      if (userId) {
        // Plans where user is only interested (not yet a participant)
        const userInterestedPlans = transformedPlans.filter((plan: FeedItem) => {
          const isInterested = plan.event.interestedUsers?.some(
            (interestedUser) => String(interestedUser.userId) === String(userId)
          );
          const isParticipant = plan.event.participants?.some(
            (participant) => String(participant.userId) === String(userId)
          );
          console.log(`[DEBUG] Plan ${plan.id} - isInterested: ${isInterested}, isParticipant: ${isParticipant}`);
          return isInterested && !isParticipant;
        });
        console.log("[DEBUG] Filtered interested plans:", userInterestedPlans);
        setInterestedItems(userInterestedPlans);
      }
    } catch (error) {
      console.error("Fetch plans error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch plans"
      );
      showToast("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = async (planId: string) => {
    try {
      const response = await fetch("/api/plans/interested", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();

      // Update feed items with new interested state
      setFeedItems((prev) =>
        prev.map((item) =>
          item.id === planId
            ? {
                ...item,
                event: {
                  ...item.event,
                  interestedUsers: data.interestedUsers.map((user: any) => ({
                    userId:
                      typeof user.userId === "string"
                        ? user.userId
                        : user.userId.toString(),
                    name: user.name,
                    avatar: user.avatar,
                    joinedAt:
                      typeof user.joinedAt === "string"
                        ? user.joinedAt
                        : user.joinedAt.toISOString(),
                  })),
                  currentInterested: data.interestedCount,
                },
              }
            : item
        )
      );

      // Update interested items
      if (user?.id) {
        const plan = feedItems.find((item) => item.id === planId);
        const isCurrentlyInterested = data.interestedUsers.some((u: any) =>
          typeof u.userId === "string"
            ? u.userId === user.id
            : u.userId.toString() === user.id
        );

        if (isCurrentlyInterested && plan) {
          setInterestedItems((prev) => [
            ...prev,
            {
              ...plan,
              event: {
                ...plan.event,
                interestedUsers: data.interestedUsers,
                currentInterested: data.interestedCount,
              },
            },
          ]);
        } else {
          setInterestedItems((prev) =>
            prev.filter((item) => item.id !== planId)
          );
        }

        showToast(
          isCurrentlyInterested
            ? "Added to interested plans"
            : "Removed from interested plans"
        );
      }
    } catch (error) {
      console.error("Toggle interest error:", error);
      showToast("Failed to toggle interest");
    }
  };

  const joinPlan = async (planId: string): Promise<PlanActionResponse> => {
    try {
      const response = await fetch('/api/plans/interested', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId })
      });
  
      if (!response.ok) {
        throw new Error('Failed to join plan');
      }
  
      const data = await response.json();
      return {
        success: true,
        interestedCount: data.interestedCount,
        interestedUsers: data.interestedUsers,
        participants: data.participants,
        openSpots: data.openSpots
      };
    } catch (error) {
      console.error('Join plan error:', error);
      throw error;
    }
  };

  const leavePlan = async (planId: string): Promise<PlanActionResponse> => {
    try {
      const response = await fetch('/api/plans/interested', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId })
      });
  
      if (!response.ok) {
        throw new Error('Failed to leave plan');
      }
  
      const data = await response.json();
      return {
        success: true,
        interestedCount: data.interestedCount,
        interestedUsers: data.interestedUsers,
        participants: data.participants,
        openSpots: data.openSpots
      };
    } catch (error) {
      console.error('Leave plan error:', error);
      throw error;
    }
  };

  const createPlan = async (planData: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/plans/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const newPlan = await response.json();
      
      // Add to feed items
      setFeedItems((prev) => [newPlan, ...prev]);
      
      // Also add to user plans since the user is the creator
      setUserPlans((prev) => [newPlan, ...prev]);
      
      // Update the cache for current user
      if (user) {
        const userId = user._id?.toString() || user.id?.toString();
        if (userId) {
          setUserPlansCache(prev => {
            const currentCache = prev[userId];
            return {
              ...prev,
              [userId]: {
                plans: currentCache ? [newPlan, ...currentCache.plans] : [newPlan],
                timestamp: Date.now()
              }
            };
          });
        }
      }
      
      showToast("Plan created successfully!");
    } catch (error) {
      console.error("Create plan error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create plan"
      );
      showToast("Failed to create plan");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/plans/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setFeedItems((prev) => prev.filter((item) => item.id !== planId));
      setInterestedItems((prev) => prev.filter((item) => item.id !== planId));
      // Also update userPlans to ensure it's removed from profile
      setUserPlans((prev) => prev.filter((item) => item.id !== planId));
      
      // Clear the plan from the cache if it exists
      if (user) {
        const userId = user._id?.toString() || user.id?.toString();
        if (userId) {
          setUserPlansCache(prev => {
            const currentCache = prev[userId];
            if (!currentCache) return prev;
            
            return {
              ...prev,
              [userId]: {
                plans: currentCache.plans.filter(plan => plan.id !== planId),
                timestamp: Date.now()
              }
            };
          });
        }
      }
      
      showToast("Plan deleted successfully");
    } catch (error) {
      console.error("Delete plan error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete plan"
      );
      showToast("Failed to delete plan");
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (planId: string, updates: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/plans/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId, updates }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const updatedPlan = await response.json();

      // Update in feed items
      setFeedItems((prev) =>
        prev.map((item) => (item.id === planId ? updatedPlan : item))
      );

      // Update in interested items
      setInterestedItems((prev) =>
        prev.map((item) => (item.id === planId ? updatedPlan : item))
      );
      
      // Update in user plans
      setUserPlans((prev) =>
        prev.map((item) => (item.id === planId ? updatedPlan : item))
      );
      
      // Update in cache
      if (user) {
        const userId = user._id?.toString() || user.id?.toString();
        if (userId) {
          setUserPlansCache(prev => {
            const currentCache = prev[userId];
            if (!currentCache) return prev;
            
            return {
              ...prev,
              [userId]: {
                plans: currentCache.plans.map(plan => 
                  plan.id === planId ? updatedPlan : plan
                ),
                timestamp: Date.now()
              }
            };
          });
        }
      }

      showToast("Plan updated successfully");
    } catch (error) {
      console.error("Update plan error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update plan"
      );
      showToast("Failed to update plan");
    } finally {
      setLoading(false);
    }
  };

  const repostPlan = async (planId: string, message?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/plans/repost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId, message }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const repostedPlan = await response.json();
      setFeedItems((prev) => [repostedPlan, ...prev]);
      showToast("Plan reposted successfully");
    } catch (error) {
      console.error("Repost plan error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to repost plan"
      );
      showToast("Failed to repost plan");
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (planId: string, content: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/plans/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId, content }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { comment } = await response.json();

      setFeedItems((prev) =>
        prev.map((item) =>
          item.id === planId
            ? {
                ...item,
                comments: [...(item.comments || []), comment],
              }
            : item
        )
      );

      showToast("Comment added successfully");
    } catch (error) {
      console.error("Add comment error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to add comment"
      );
      showToast("Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyPlans = async (
    lat: number,
    lng: number,
    radius: number = 10
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radius.toString(),
      });

      const response = await fetch(`/api/plans/nearby?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { plans } = await response.json();
      setFeedItems(plans);
    } catch (error) {
      console.error("Fetch nearby plans error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch nearby plans"
      );
      showToast("Failed to load nearby plans");
    } finally {
      setLoading(false);
    }
  };

  const processUpload = async (
    file: File | string,
    type: "image" | "url"
  ): Promise<ProcessedData> => {
    try {
      setLoading(true);
      const formData = new FormData();

      if (type === "url") {
        formData.append("url", file as string);
      } else {
        formData.append("image", file as File);
      }

      const response = await fetch("/api/discovery/process", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return await response.json();
    } catch (error) {
      console.error("Process upload error:", error);
      showToast("Failed to process upload");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getParticipantStatus = async (planId: string): Promise<boolean> => {
    // Implementation of getParticipantStatus
    throw new Error("Method not implemented");
  };

  const refreshPlanStatus = async (planId: string): Promise<void> => {
    // Implementation of refreshPlanStatus
    throw new Error("Method not implemented");
  };

  const setParticipantStatus = async (planId: string, status: boolean): Promise<void> => {
    // Implementation of setParticipantStatus
    throw new Error("Method not implemented");
  };

  const contextValue: PlanContextType = {
    feedItems,
    interestedItems,
    userPlans,
    loading,
    error,
    visibility,
    timeFilter,
    searchQuery,
    createPlan,
    deletePlan,
    updatePlan,
    toggleInterest,
    repostPlan,
    joinPlan,
    leavePlan,
    addComment,
    fetchPlans,
    fetchUserPlans,
    fetchNearbyPlans,
    setVisibility,
    setTimeFilter,
    setSearchQuery,
    processUpload,
    setFeedItems,
    getParticipantStatus,
    refreshPlanStatus,
    setParticipantStatus
  };

  return (
    <PlanContext.Provider value={contextValue}>
      <div key={user?.id || 'no-user'}>
        {children}
      </div>
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("usePlan must be used within a PlanProvider");
  }
  return context;
}
