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
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import type {
  FeedItem,
  Location,
} from "@/lib/types";
import { ProfileLink } from '@/components/shared/profile-link';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

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

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  // Format: "March 27, 7:37 PM"
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).replace(',', ' •'); // Replace comma with bullet point for better spacing
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
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { joinPlan, leavePlan } = usePlan();
  const isCreator = user && (user.id === item.creator?.id || user._id === item.creator?.id);
  
  // Debug log for props
  useEffect(() => {
    console.log('📊 FEED CARD DATA 📊', {
      itemId: item.id,
      creator: item.creator?.id,
      posterName: item.poster?.name,
      hasParticipants: Boolean(item.event.participants),
      participantsCount: item.event.participants?.length || 0,
      participants: item.event.participants?.map(p => ({
        userId: p.userId,
        name: p.name,
        status: p.status
      })),
      hasInterestedUsers: Boolean(item.event.interestedUsers),
      interestedCount: item.event.interestedUsers?.length || 0
    });
  }, [item]);
  
  // Ensure creator is properly represented in participants array when rendering
  useEffect(() => {
    // If creator is not in participants array, add them for UI purposes
    const creatorInParticipants = item.event.participants?.some(
      p => p.userId === item.creator?.id || p.status === 'creator'
    );
    
    console.log('📊 CREATOR CHECK 📊', {
      creatorId: item.creator?.id,
      posterName: item.poster?.name,
      creatorInParticipants,
      participantsBeforeUpdate: item.event.participants?.length || 0
    });
    
    if (!creatorInParticipants && item.creator?.id && item.poster?.name) {
      if (!Array.isArray(item.event.participants)) {
        item.event.participants = [];
      }
      
      // Add creator to participants array for display purposes if not already there
      item.event.participants.unshift({
        id: item.creator.id,
        userId: item.creator.id,
        name: item.poster.name,
        avatar: item.poster.avatarUrl || null,
        status: 'creator',
        joinedAt: new Date().toISOString()
      });
      
      console.log('📊 CREATOR ADDED 📊', {
        creatorId: item.creator.id,
        posterName: item.poster.name,
        updatedParticipantCount: item.event.participants.length
      });
    }

    // Debug participant data
    console.log('📊 PARTICIPANTS DEBUG 📊', {
      participants: item.event.participants?.map(p => ({
        userId: p.userId,
        name: p.name,
        status: p.status
      }))
    });

    // Ensure anyone who isn't the creator is marked as "going"
    // This ensures they show up in the participants display
    if (Array.isArray(item.event.participants)) {
      item.event.participants.forEach(p => {
        if (p.userId !== item.creator?.id && p.status !== 'going') {
          p.status = 'going';
          console.log('📊 FIXED PARTICIPANT STATUS 📊', {
            userId: p.userId,
            name: p.name,
            newStatus: 'going'
          });
        }
      });
    }
  }, [item]);
  
  useEffect(() => {
    if (!user) {
      console.log('No user data available in feed-card');
      return;
    }
  
    // Get user ID safely, handling both MongoDB _id and client-side id
    const userId = user._id?.toString() || user.id?.toString();
    const creatorId = item.creator?.id?.toString();
    
    console.log('📊 USER STATUS CHECK 📊', {
      userId,
      userName: user.name,
      creatorId,
      isCreator: userId === creatorId,
      participantsCount: item.event.participants?.length || 0
    });
    
    if (!userId) {
      console.log('No user ID available:', user);
      return;
    }
  
    // Check if user is creator by comparing string versions of IDs
    const isCreator = userId === creatorId;
    
    if (isCreator) {
      console.log('📊 USER IS CREATOR 📊', { userId, creatorId });
      setParticipantStatus("creator");
      setInterestedCount(item.event.interestedUsers?.length || 0);
      return;
    }
  
    // First check if user is in participants list (with ANY status)
    const isInParticipantsList = item.event.participants?.some(
      participant => String(participant.userId) === String(userId)
    );

    // Then check if user has "going" status specifically
    const isGoingParticipant = item.event.participants?.some(
      participant => 
        String(participant.userId) === String(userId) && 
        participant.status === 'going'
    );

    console.log('📊 USER PARTICIPANT STATUS CHECK 📊', {
      userId,
      userName: user.name,
      isInParticipantsList,
      isGoingParticipant,
      matchingParticipant: item.event.participants?.find(
        p => String(p.userId) === String(userId)
      )
    });

    // If the user is in the participants list, ensure their info is complete
    if (isInParticipantsList) {
      // Find the matching participant and update their info if needed
      const participantIndex = item.event.participants?.findIndex(
        p => String(p.userId) === String(userId)
      );
      
      if (participantIndex !== -1 && participantIndex !== undefined) {
        const participant = item.event.participants[participantIndex];
        
        // Update the participant info if it's incomplete
        if (!participant.name || participant.name === 'Unknown participant') {
          participant.name = user.name;
          console.log('📊 UPDATED PARTICIPANT NAME 📊', {
            userId,
            newName: user.name
          });
        }

        // Ensure the participant has an avatar
        if (!participant.avatar && user.avatarUrl) {
          participant.avatar = user.avatarUrl;
          console.log('📊 UPDATED PARTICIPANT AVATAR 📊', {
            userId,
            avatar: user.avatarUrl
          });
        }
      }
    }
    
    // Debug log all participants after any updates
    console.log('📊 ALL PARTICIPANTS AFTER UPDATE 📊', 
      item.event.participants?.map(p => ({
        userId: p.userId,
        name: p.name,
        status: p.status,
        hasAvatar: !!p.avatar
      }))
    );

    // Ensure all participants have valid avatar data if possible
    if (Array.isArray(item.event.participants)) {
      // Find any participants without avatar information
      const participantsWithoutAvatars = item.event.participants.filter(p => !p.avatar);
      
      if (participantsWithoutAvatars.length > 0) {
        console.log('📊 PARTICIPANTS MISSING AVATARS 📊', 
          participantsWithoutAvatars.map(p => ({
            userId: p.userId,
            name: p.name
          }))
        );
        
        // We need to update these participants with avatars if possible
        const participantUserIds = participantsWithoutAvatars
          .map(p => p.userId?.toString())
          .filter(Boolean);
          
        if (participantUserIds.length > 0) {
          // Set a default avatar for now (can be replaced with actual fetching if needed)
          participantsWithoutAvatars.forEach(participant => {
            // If we don't have an avatar, assign a default one based on the user's name
            if (!participant.avatar && participant.name) {
              // Use a placeholder service like DiceBear or similar
              participant.avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(participant.name)}`;
              console.log('📊 ASSIGNED DEFAULT AVATAR 📊', {
                userId: participant.userId,
                name: participant.name,
                defaultAvatar: participant.avatar
              });
            }
          });
        }
      }
    }
    
    if (isGoingParticipant) {
      setParticipantStatus("going");
      setInterestedCount(item.event.interestedUsers?.length || 0);
      return;
    }
    
    // Check if user is in interested list
    const isInterested = item.event.interestedUsers?.some(
      interestedUser => String(interestedUser.userId) === String(userId)
    );
    
    console.log('📊 USER INTERESTED STATUS CHECK 📊', {
      userId,
      isInterested,
      interestedUsers: item.event.interestedUsers?.length || 0,
      filteredInterestedUsers: item.event.interestedUsers?.filter(
        u => String(u.userId) === String(userId)
      )
    });
    
    if (isInterested) {
      setParticipantStatus("interested");
      setInterestedCount(item.event.interestedUsers?.length || 0);
      return;
    }
    
    // User is neither participant nor interested
    setParticipantStatus("none");
    setInterestedCount(item.event.interestedUsers?.length || 0);

  }, [user, item]);

  // Ensure all participants have proper name and avatar data
  useEffect(() => {
    // Some users might be missing names or showing as "Unknown participant"
    // Fix this by making sure all participants have name and avatar data
    if (Array.isArray(item.event.participants)) {
      let hasUpdated = false;
      
      item.event.participants.forEach(participant => {
        // Fix missing names
        if (!participant.name || participant.name === 'Unknown participant') {
          // If this is the current user, use their info
          if (user && (user.id === participant.userId || user._id === participant.userId)) {
            participant.name = user.name;
            participant.avatar = user.avatarUrl || null;
            hasUpdated = true;
            console.log('📊 FIXED PARTICIPANT INFO (CURRENT USER) 📊', {
              userId: participant.userId,
              newName: user.name,
              newAvatar: user.avatarUrl
            });
          }
        }
      });
      
      if (hasUpdated) {
        // Force re-render by creating a new array
        item.event.participants = [...item.event.participants];
      }
    }
  }, [item, user]);

  // After the component initialization, add a useEffect for refreshing participant data
  useEffect(() => {
    // Make sure we have participant data before trying to display them
    if (Array.isArray(item.event.participants)) {
      const hasIncompleteParticipant = item.event.participants.some(
        p => !p.name || !p.avatar
      );
      
      if (hasIncompleteParticipant) {
        console.log('📊 FEED CARD HAS INCOMPLETE PARTICIPANT DATA:', 
          item.event.participants.map(p => ({
            userId: p.userId,
            name: p.name,
            hasAvatar: !!p.avatar
          }))
        );
        
        // If any participant is missing avatar or name, add temporary values
        item.event.participants.forEach(participant => {
          if (!participant.name) {
            participant.name = "Loading...";
          }
          
          if (!participant.avatar) {
            // Generate a placeholder avatar based on userId for consistency
            participant.avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(participant.userId)}`;
          }
        });
      }
    }
  }, [item.event.participants]);

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

    // If user is already a participant, show leave confirmation dialog
    if (participantStatus === "going") {
      setShowLeaveDialog(true);
      return;
    }

    try {
      console.log('Attempting join/leave:', {
        currentStatus: participantStatus,
        userId,
        planId: item.id
      });

      const action = participantStatus === "none" ? joinPlan : leavePlan;
      const result = await action(item.id);

      if (result.success) {
        console.log('📊 PARTICIPANT ACTION RESULT 📊', {
          action: participantStatus === "none" ? "joinPlan" : "leavePlan",
          planId: item.id,
          success: result.success,
          newParticipantsCount: result.participants?.length || 0,
          participantsData: result.participants?.map(p => ({
            userId: p.userId,
            name: p.name,
            status: p.status
          })),
          newInterestedCount: result.interestedCount,
          openSpots: result.openSpots
        });
        
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

  const handleLeavePlan = async () => {
    if (!user) return;
    
    try {
      const result = await leavePlan(item.id);
      
      if (result.success) {
        // Remove the user from participants list
        if (Array.isArray(item.event.participants)) {
          const userId = user._id?.toString() || user.id?.toString();
          item.event.participants = item.event.participants.filter(
            p => String(p.userId) !== String(userId)
          );
        }
        
        // Update the participant status
        setParticipantStatus("none");
        
        console.log('📊 LEFT PLAN SUCCESSFULLY 📊', {
          planId: item.id,
          userId: user._id || user.id
        });
      }
      
      setShowLeaveDialog(false);
    } catch (error) {
      console.error("Error leaving plan:", error);
      setShowLeaveDialog(false);
    }
  };

  const getButtonDisplay = () => {
    if (participantStatus === "creator") {
      return null;
    }

    switch (participantStatus) {
      case "going":
        return (
          <button
            onClick={() => setShowLeaveDialog(true)}
            className="px-4 py-1.5 rounded-xl text-sm font-medium bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/30 transition-colors"
          >
            Going
          </button>
        );
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
    <>
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
            <ProfileLink userId={item.poster.id}>
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
            </ProfileLink>
            <div className="ml-3">
              <div className="flex items-center gap-2">
                <ProfileLink userId={item.poster.id}>
                  <span className="font-medium text-black dark:text-white hover:underline">
                    {item.poster.name}
                  </span>
                </ProfileLink>
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
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span>{formatDateTime(item.event.time)}</span>
              {item.event.location && (
                <>
                  <span>•</span>
                  <span>{getLocationName(item.event.location)}</span>
                </>
              )}
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
              creatorId={item.poster.id}
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

      {/* Leave Plan Confirmation Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="p-0">
          <DialogTitle>Leave Plan</DialogTitle>
          <div className="p-6">
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Are you sure you want to leave this plan? This will remove you as a participant.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLeaveDialog(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLeavePlan}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Leave Plan
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}