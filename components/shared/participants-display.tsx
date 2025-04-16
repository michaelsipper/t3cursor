// components/shared/participants-display.tsx
'use client';
import { useEffect } from 'react';
import Image from 'next/image';
import type { Participant as GlobalParticipant } from '@/lib/types';
import { ProfileLink } from '@/components/shared/profile-link';
import { User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ParticipantsDisplayProps {
  totalSpots: number;
  participants: GlobalParticipant[];
  remainingSpots: number;
  showNames?: boolean;
  openInvite?: boolean;
  maxDisplay?: number;
  posterName?: string;
  creatorId?: string;
}

export function ParticipantsDisplay({
  totalSpots,
  participants = [],
  remainingSpots,
  showNames = true,
  openInvite = false,
  maxDisplay = 5,
  posterName,
  creatorId
}: ParticipantsDisplayProps) {
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id?.toString();

  if (openInvite) {
    return null;
  }

  // Enhanced debug logging
  useEffect(() => {
    console.log('🧩 PARTICIPANTS DEBUG 🧩');
    console.log('ParticipantsDisplay props:', {
      posterName,
      creatorId,
      totalSpots,
      remainingSpots,
      participantsCount: participants?.length || 0,
      currentUserId
    });
    
    console.log('Raw participants data:', 
      Array.isArray(participants) 
        ? participants.map(p => ({
            id: p.id,
            userId: p.userId,
            name: p.name,
            status: p.status,
            avatar: p.avatar ? 'has avatar' : 'no avatar'
          }))
        : 'Not an array'
    );
  }, [participants, posterName, creatorId, totalSpots, remainingSpots, currentUserId]);

  // Ensure participants is always an array
  const safeParticipants = Array.isArray(participants) ? participants : [];
  
  // Find the creator participant if they're in the participants list
  const creator = safeParticipants.find(p => p && p.status === 'creator');
  
  // Get the creator's userId (from participants if available, otherwise use creatorId)
  const creatorUserId = creator?.userId || creatorId || '';
  
  // Log all participants and their statuses for debugging
  console.log('🧩 ALL PARTICIPANTS 🧩', 
    safeParticipants.map(p => ({
      userId: p.userId,
      name: p.name,
      status: p.status,
      isCreator: p.userId === creatorUserId,
      isCurrentUser: p.userId === currentUserId,
      avatar: p.avatar ? 'has avatar' : 'no avatar'
    }))
  );
  
  // Filter to include any participants that aren't the creator (regardless of status)
  // This ensures we display all non-creator participants
  const nonCreatorParticipants = safeParticipants.filter(p => 
    p && p.userId && p.userId !== creatorUserId
  );
  
  console.log('🧩 FILTERED PARTICIPANTS 🧩', { 
    creatorUserId, 
    creatorName: creator?.name || posterName,
    creatorFound: !!creator,
    totalParticipants: safeParticipants.length,
    nonCreatorParticipantsCount: nonCreatorParticipants.length,
    nonCreatorParticipants: nonCreatorParticipants.map(p => ({
      name: p.name,
      status: p.status,
      userId: p.userId,
      isCurrentUser: p.userId === currentUserId
    }))
  });
  
  // Take only up to maxDisplay for participants (but maxDisplay should be no larger than totalSpots)
  const participantsToDisplay = nonCreatorParticipants.slice(0, Math.min(maxDisplay, totalSpots));
  
  // Calculate how many empty spots to show
  const emptySquaresToShow = Math.min(
    totalSpots - participantsToDisplay.length,  // Show remaining spots up to totalSpots
    maxDisplay - participantsToDisplay.length   // Don't exceed maxDisplay
  );
  
  // Calculate if there are more participants than we can display
  const hasMore = nonCreatorParticipants.length > participantsToDisplay.length;
  
  // For display purposes, find participants other than the current user
  const otherParticipants = participantsToDisplay.filter(p => p.userId !== currentUserId);
  const currentUserIsParticipant = participantsToDisplay.some(p => p.userId === currentUserId);
  const firstOtherParticipant = otherParticipants[0];

  const getDisplayText = () => {
    if (participantsToDisplay.length === 0) return '';
    
    // If the current user is the only participant
    if (participantsToDisplay.length === 1 && currentUserIsParticipant) {
      return 'You are going';
    }
    
    // If there are no other participants besides the current user
    if (otherParticipants.length === 0 && currentUserIsParticipant) {
      return 'You are going';
    }
    
    // Count of other participants (excluding the first one we'll name)
    const otherCount = otherParticipants.length - 1;
    const totalCount = currentUserIsParticipant ? otherParticipants.length + 1 : otherParticipants.length;
    
    // If first other participant has no name or is "Unknown participant"
    if (!firstOtherParticipant || !firstOtherParticipant.name || firstOtherParticipant.name === 'Unknown participant') {
      return currentUserIsParticipant 
        ? `You and ${totalCount > 1 ? `${totalCount-1} other${totalCount-1 !== 1 ? 's' : ''}` : '1 other'}`
        : `${totalCount} participant${totalCount !== 1 ? 's' : ''}`;
    }
    
    // When current user is participating and there's one other person
    if (currentUserIsParticipant && otherParticipants.length === 1) {
      return `You and ${firstOtherParticipant.name}`;
    }
    
    // When current user is participating and there are multiple other people
    if (currentUserIsParticipant && otherParticipants.length > 1) {
      return `You, ${firstOtherParticipant.name}${otherCount > 0 ? ` +${otherCount} other${otherCount !== 1 ? 's' : ''}` : ''}`;
    }
    
    // When current user is not participating
    if (otherCount === 0) return firstOtherParticipant.name;
    return `${firstOtherParticipant.name} +${otherCount}${hasMore ? '...' : ` other${otherCount !== 1 ? 's' : ''}`}`;
  };

  // Log rendered participant information
  useEffect(() => {
    console.log('🧩 PARTICIPANTS RENDER INFO 🧩', {
      creatorDisplayed: false, // Creator should never be displayed in participants
      participantsDisplayed: participantsToDisplay.length,
      emptySquaresDisplayed: emptySquaresToShow,
      displayText: getDisplayText(),
      totalDisplayedSquares: participantsToDisplay.length + emptySquaresToShow,
      totalSpots,
      currentUserIsParticipant
    });
  }, [participantsToDisplay.length, emptySquaresToShow, totalSpots, maxDisplay, currentUserIsParticipant]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm text-zinc-300">Participants</h4>
        <span className="text-sm text-zinc-400">
          {remainingSpots} spot{remainingSpots !== 1 ? 's' : ''} left
        </span>
      </div>

      <div className="flex items-center">
        <div className="flex -space-x-2 mr-3">
          {/* Show non-creator participants first */}
          {participantsToDisplay
            .filter(participant => participant && participant.userId)
            .map((participant) => (
              <ProfileLink key={participant.userId} userId={participant.userId}>
                <div
                  className="relative"
                  title={participant.name || 'Participant'}
                >
                  {participant.avatar ? (
                    <div className="w-8 h-8 relative">
                      <Image
                        src={participant.avatar}
                        alt={participant.name || 'Participant'}
                        fill
                        className="rounded-xl border-2 border-zinc-950 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl border-2 border-zinc-950 bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {participant.name && participant.name.length > 0 ? participant.name.charAt(0) : <UserIcon className="w-4 h-4" />}
                      </span>
                    </div>
                  )}
                </div>
              </ProfileLink>
            ))}

          {/* Empty spots */}
          {Array.from({ length: emptySquaresToShow }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="w-8 h-8 rounded-xl border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center"
            >
              {index === emptySquaresToShow - 1 && hasMore ? (
                <span className="text-zinc-400 text-xs">...</span>
              ) : (
                <span className="text-zinc-400 text-xs">+</span>
              )}
            </div>
          ))}
        </div>

        {showNames && participantsToDisplay.length > 0 && (
          <div className="text-sm text-zinc-300">
            {getDisplayText()}
          </div>
        )}
      </div>
    </div>
  );
}