// components/shared/PlanContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "./AuthContext";
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
} from "@/lib/types";

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
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const { isAuthenticated, user } = useAuth();

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [interestedItems, setInterestedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<
    "friends" | "mutuals" | "community"
  >("friends");
  const [timeFilter, setTimeFilter] = useState<"all" | "now" | "later">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      const options: PlanOptions = {
        visibility,
        timeFilter,
        search: searchQuery,
      };
      fetchPlans(options);
    }
  }, [isAuthenticated, user, visibility, timeFilter, searchQuery]);

  const fetchPlans = async (options?: PlanOptions & { userOnly?: boolean }) => {
    if (!user) {
      console.log("No user data available, skipping fetch");
      return;
    }

    // console.log('Auth state:', {
    //   isAuthenticated,
    //   userId: user?._id || user?.id,
    //   user: user
    // });

    try {
      setLoading(true);
      setError(null);

      const finalOptions = {
        visibility: options?.visibility || visibility,
        timeFilter: options?.timeFilter || timeFilter,
        search: options?.search || searchQuery,
        userOnly: options?.userOnly,
      };

      console.log("Fetching plans with options:", finalOptions);

      const params = new URLSearchParams();
      params.append("visibility", finalOptions.visibility);
      params.append("timeFilter", finalOptions.timeFilter);
      if (finalOptions.search) {
        params.append("search", finalOptions.search);
      }
      if (finalOptions.userOnly) {
        params.append("userOnly", "true");
      }

      //   console.log('Fetch request URL:', `/api/plans/feed?${params.toString()}`);

      const response = await fetch(`/api/plans/feed?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { plans } = await response.json();

      if (!Array.isArray(plans)) {
        throw new Error("Invalid plans data received");
      }

      const transformedPlans = plans.map((plan: any) => ({
        id: plan.id || plan._id?.toString(),
        type: plan.type,
        creator: {
          id: plan.creator.id || plan.creator._id?.toString(),
        },
        poster: {
          id: plan.poster.id || plan.poster._id?.toString(),
          name: plan.poster.name,
          age: plan.poster.age,
          avatarUrl: plan.poster.avatarUrl,
          connection: plan.poster.connection,
        },
        event: {
          title: plan.event.title,
          description: plan.event.description || "",
          location: plan.event.location,
          time: plan.event.time,
          startTime: plan.event.startTime,
          duration: plan.event.duration,
          interestedUsers: Array.isArray(plan.event.interestedUsers)
            ? plan.event.interestedUsers.map((user: any) => ({
                userId: user.userId?.toString() || user._id?.toString(),
                name: user.name,
                avatar: user.avatar,
                joinedAt: user.joinedAt,
              }))
            : [],
          currentInterested: plan.event.currentInterested || 0,
          openInvite: plan.event.openInvite,
          totalSpots: plan.event.totalSpots,
          openSpots: plan.event.openSpots,
          participants: Array.isArray(plan.event.participants)
            ? plan.event.participants.map((p: any) => ({
                userId: p.userId?.toString() || p._id?.toString(),
                name: p.name,
                avatar: p.avatar,
                status: p.status,
                joinedAt: p.joinedAt,
              }))
            : [],
        },
      }));

      // console.log(
      //   "Transformed plans:",
      //   JSON.stringify(transformedPlans, null, 2)
      // );
      setFeedItems(transformedPlans);

      // Handle interested items with proper ID checking
      const userId = user._id?.toString() || user.id?.toString();
      if (userId) {
        const userInterestedPlans = transformedPlans.filter((plan: FeedItem) =>
          plan.event.interestedUsers?.some(
            (interestedUser) => String(interestedUser.userId) === String(userId)
          )
        );
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
      setFeedItems((prev) => [newPlan, ...prev]);
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

      setFeedItems((prev) =>
        prev.map((item) => (item.id === planId ? updatedPlan : item))
      );

      setInterestedItems((prev) =>
        prev.map((item) => (item.id === planId ? updatedPlan : item))
      );

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

  const contextValue: PlanContextType = {
    feedItems,
    interestedItems,
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
    fetchNearbyPlans,
    setVisibility,
    setTimeFilter,
    setSearchQuery,
    processUpload,
    setFeedItems,
  };

  return (
    <PlanContext.Provider value={contextValue}>{children}</PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("usePlan must be used within a PlanProvider");
  }
  return context;
}
