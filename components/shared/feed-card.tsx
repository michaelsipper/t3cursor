// components/shared/feed-card.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { TimeProgressBar } from "./time-progress-bar";
import { ParticipantsDisplay } from "./participants-display";
import {
  Heart,
  MessageCircle,
  Send,
  Repeat,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { usePlan } from "./PlanContext";
import type {
  FeedItem,
  Location,
} from "@/lib/types";

interface FeedCardProps {
  item: FeedItem;
  onInterestToggle: (id: number | string) => void;
  onRepostToggle: (id: number | string) => void;
  onDelete: (id: number | string) => void;
  isInterested: boolean;
  isReposted: boolean;
}

const getLocationName = (location: string | Location): string => {
  if (typeof location === "string") {
    return location;
  }
  return location.name;
};

const DeleteMenu = ({ onClose, onDelete }: { onClose: () => void; onDelete: () => void }) => (
  <>
    <div 
      className="fixed inset-0 z-40" 
      onClick={onClose}
    />
    <div className="absolute top-8 right-2 z-50 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <button
        onClick={onDelete}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
      >
        <Trash2 className="w-4 h-4" />
        Delete plan
      </button>
    </div>
  </>
);


export function FeedCard({
  item,
  onInterestToggle,
  onRepostToggle,
  onDelete,
  isInterested,
  isReposted,
}: FeedCardProps) {
  // Debug log for props
  console.log('FeedCard Mount:', {
    itemId: item.id,
    hasInterestedUsers: Boolean(item.event.interestedUsers),
    interestedUsers: item.event.interestedUsers
  });

  const [showMenu, setShowMenu] = useState(false);
  const [participantStatus, setParticipantStatus] = useState<"none" | "interested" | "going" | "creator">("none");
  const [interestedCount, setInterestedCount] = useState(item.event.interestedUsers?.length || 0);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { joinPlan, leavePlan } = usePlan();
  const isCreator = user && (user.id === item.creator?.id || user._id === item.creator?.id);
  
  const handleDelete = async () => {
    setShowMenu(false);
    onDelete(item.id);
  };

  // Debug log for user
  useEffect(() => {
    console.log('Feed card initialization:', {
      user,
      userId: user?._id || user?.id,
      itemId: item.id,
      interestedUsers: item.event.interestedUsers
    });
  }, [user]);

  useEffect(() => {
    if (!user) {
      console.log('No user data available in feed-card');
      return;
    }
  
    // Get user ID safely, handling both MongoDB _id and client-side id
    const userId = user._id?.toString() || user.id?.toString();
    const creatorId = item.creator?.id?.toString();
    
    if (!userId) {
      console.log('No user ID available:', user);
      return;
    }
  
    // Check if user is creator by comparing string versions of IDs
    const isCreator = userId === creatorId;
    
    if (isCreator) {
      console.log('User is creator:', { userId, creatorId });
      setParticipantStatus("creator");
      setInterestedCount(item.event.interestedUsers?.length || 0);
      return;
    }
  
    // Check if user is interested
    const isInInterestedArray = item.event.interestedUsers?.some(
      interestedUser => String(interestedUser.userId) === String(userId)
    );
  
    console.log('Interest check:', {
      userId,
      isInInterestedArray,
      interestedUserIds: item.event.interestedUsers?.map(u => u.userId)
    });
  
    setParticipantStatus(isInInterestedArray ? "interested" : "none");
    setInterestedCount(item.event.interestedUsers?.length || 0);
  }, [user, item.id, JSON.stringify(item.event.interestedUsers)]);

  const handleJoinClick = async () => {
    if (!user) {
      console.log('No user data available in handleJoinClick');
      return;
    }

    const userId = user._id || user.id;
    if (!userId) {
      console.log('No user ID available:', user);
      return;
    }

    const isCreator = userId === item.creator.id;
    if (isCreator) return;

    try {
      console.log('Attempting join/leave:', {
        currentStatus: participantStatus,
        userId,
        planId: item.id
      });

      const action = participantStatus === "none" ? joinPlan : leavePlan;
      const result = await action(item.id);

      if (result.success) {
        const newStatus = participantStatus === "none" ? "interested" : "none";
        setParticipantStatus(newStatus);
        setInterestedCount(result.interestedCount);

        if (newStatus === "interested") {
          item.event.interestedUsers = [
            ...(item.event.interestedUsers || []),
            {
              userId: userId,
              name: user.name,
              avatar: user.avatarUrl || null,
              joinedAt: new Date().toISOString()
            }
          ];
        } else {
          item.event.interestedUsers = item.event.interestedUsers?.filter(
            u => String(u.userId) !== String(userId)
          ) || [];
        }

        console.log('Join/Leave successful:', {
          newStatus,
          userId,
          updatedInterestedUsers: item.event.interestedUsers
        });
      }
    } catch (error) {
      console.error("Error toggling interest:", error);
    }
  };

  const getButtonDisplay = () => {
    if (participantStatus === "creator") {
      return null;
    }

    switch (participantStatus) {
      case "interested":
        return (
          <button
            onClick={handleJoinClick}
            className="px-4 py-1.5 rounded-xl text-sm font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            Interested
          </button>
        );
      default:
        return (
          <button
            onClick={handleJoinClick}
            className="px-4 py-1.5 rounded-xl text-sm font-medium bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity"
          >
            Join
          </button>
        );
    }
  };

  const getConnectionDisplay = () => {
    if (participantStatus === "creator") {
      return (
        <span className="text-xs px-2 py-0.5 rounded-lg bg-yellow-100 dark:bg-yellow-400/10 text-yellow-600 dark:text-yellow-400">
          Your post
        </span>
      );
    }

    return (
      <span
        className={`
          text-xs px-2 py-0.5 rounded-lg 
          ${
            item.poster.connection === "1st"
              ? "bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400"
              : item.poster.connection === "2nd"
              ? "bg-sky-100 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400"
              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}
      >
        {item.poster.connection}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
      <div className="p-4">
        {/* Add delete menu button */}
        {isCreator && (
          <div className="absolute top-2 right-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <DeleteMenu 
                onClose={() => setShowMenu(false)} 
                onDelete={handleDelete}
              />
            )}
          </div>
        )}
  
        {item.type === "realtime" && (
          <div className="mb-4">
            <TimeProgressBar
              startTime={item.event.startTime!}
              duration={item.event.duration!}
            />
          </div>
        )}
  
        <div className="flex items-center mb-4">
          {item.poster.avatarUrl ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden relative">
              <img
                src={item.poster.avatarUrl}
                alt={item.poster.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white dark:text-black font-medium">
              {item.poster.name[0]}
            </div>
          )}
          <div className="ml-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-black dark:text-white">
                {item.poster.name}
              </span>
              {item.poster.age && (
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {item.poster.age}
                </span>
              )}
              {getConnectionDisplay()}
            </div>
          </div>
        </div>
  
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">
            {item.event.title}
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed">
            {item.event.description}
          </p>
          <div className="flex flex-wrap gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span>{item.event.time}</span>
            <span>•</span>
            <span>{getLocationName(item.event.location)}</span>
          </div>
        </div>
  
        <div className="py-3 border-t border-zinc-200 dark:border-zinc-800">
          <ParticipantsDisplay
            totalSpots={item.event.totalSpots}
            participants={item.event.participants}
            remainingSpots={item.event.openSpots || item.event.totalSpots}
            showNames={true}
            openInvite={item.event.openInvite}
            maxDisplay={5}
            posterName={item.poster.name}
          />
        </div>
  
        <div className="flex justify-between items-center pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex gap-4">
            <button className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <button className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
              <Send className="w-5 h-5" />
            </button>
            {item.event.openInvite && participantStatus !== "creator" && (
              <button
                onClick={() => onRepostToggle(item.id)}
                className={`transition-colors ${
                  isReposted
                    ? "text-sky-600 dark:text-sky-400"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                }`}
              >
                <Repeat className="w-5 h-5" />
              </button>
            )}
          </div>
  
          <div className="flex items-center gap-3">
            {interestedCount > 0 && (
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {interestedCount} interested
              </span>
            )}
            {getButtonDisplay()}
          </div>
        </div>
      </div>
    </div>
  );
}