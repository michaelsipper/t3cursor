// components/shared/participants-display.tsx
'use client';
import Image from 'next/image';
import type { Participant as GlobalParticipant } from '@/lib/types';

interface ParticipantsDisplayProps {
  totalSpots: number;
  participants: GlobalParticipant[];
  remainingSpots: number;
  showNames?: boolean;
  openInvite?: boolean;
  maxDisplay?: number;
  posterName?: string;
}

export function ParticipantsDisplay({
  totalSpots,
  participants,
  remainingSpots,
  showNames = true,
  openInvite = false,
  maxDisplay = 5,
  posterName
}: ParticipantsDisplayProps) {
  if (openInvite) {
    return null;
  }

  const displayParticipants = participants.slice(0, maxDisplay);
  const hasMore = participants.length > maxDisplay;
  // Change 'accepted' to 'going' in the filter
  const acceptedParticipants = participants.filter(p => p.status === 'going');
  const firstAccepted = acceptedParticipants[0];

  const getDisplayText = () => {
    if (acceptedParticipants.length === 0) return '';
    const remaining = acceptedParticipants.length - 1;
    if (remaining === 0) return firstAccepted.name;
    return `${firstAccepted.name} +${remaining}${hasMore ? '...' : ` other${remaining !== 1 ? 's' : ''}`}`;
  };

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
          {/* Creator's bubble always first */}
          {posterName && (
            <div className="relative" title={posterName}>
              <div className="w-8 h-8 rounded-xl border-2 border-zinc-950 bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {posterName[0]}
                </span>
              </div>
            </div>
          )}

          {/* Other participants */}
          {displayParticipants.map((participant) => (
            participant.name !== posterName && (
              <div
                key={participant.id}
                className="relative"
                title={participant.name}
              >
                {participant.avatar ? (
                  <div className="w-8 h-8 relative">
                    <Image
                      src={participant.avatar}
                      alt={participant.name}
                      fill
                      className="rounded-xl border-2 border-zinc-950 object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl border-2 border-zinc-950 bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {participant.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            )
          ))}

          {/* Empty spots */}
          {Array.from({ length: Math.min(remainingSpots, maxDisplay - displayParticipants.length) }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="w-8 h-8 rounded-xl border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center"
            >
              {index === maxDisplay - displayParticipants.length - 1 && hasMore ? (
                <span className="text-zinc-400 text-xs">...</span>
              ) : (
                <span className="text-zinc-400 text-xs">+</span>
              )}
            </div>
          ))}
        </div>

        {showNames && acceptedParticipants.length > 0 && (
          <div className="text-sm text-zinc-300">
            {getDisplayText()}
          </div>
        )}
      </div>
    </div>
  );
}