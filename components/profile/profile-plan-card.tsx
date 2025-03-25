// components/profile/profile-plan-card.tsx
import { useState } from 'react';
import { MapPin, Clock, Eye, Heart, MessageCircle, Share2, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FeedCard } from '@/components/shared/feed-card';
import type { FeedItem, Location } from '@/lib/types';

interface ProfilePlanCardProps {
  plan: FeedItem;
  variant: 'your-plan' | 'your-interest';
}

const getLocationName = (location: string | Location): string => {
  if (typeof location === "string") {
    return location;
  }
  return location.name;
};

export function ProfilePlanCard({ plan, variant }: ProfilePlanCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showInterestedModal, setShowInterestedModal] = useState(false);
  const hasNewInterested = true;

  return (
    <div className="flex-shrink-0 w-[300px] rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
      <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 p-4">
        <button
          onClick={() => setShowPreview(true)}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Eye className="w-5 h-5 text-white" />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-2">{plan.event.title}</h2>
        <div className="flex items-center gap-2 text-white/80">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{getLocationName(plan.event.location)}</span>
        </div>
      </div>

      <div className="p-4 space-y-6 border border-zinc-200 dark:border-zinc-800">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
              {plan.event.participants.length}/{plan.event.totalSpots}
            </div>
            <div className="text-sm text-zinc-500">Going</div>
          </div>
          
          <button 
            onClick={() => setShowInterestedModal(true)}
            className="text-center relative"
          >
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
              {plan.event.interestedUsers?.length || 0}
              {hasNewInterested && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white">!</span>
                </div>
              )}
            </div>
            <div className="text-sm text-zinc-500">Interested</div>
          </button>
        </div>

        <div className="flex justify-between">
          <div className="text-center">
            <Heart className="w-7 h-7 mx-auto mb-1 text-zinc-400" />
            <span className="block text-sm text-zinc-600">45</span>
          </div>
          <div className="text-center">
            <MessageCircle className="w-7 h-7 mx-auto mb-1 text-zinc-400" />
            <span className="block text-sm text-zinc-600">8</span>
          </div>
          <div className="text-center">
            <Share2 className="w-7 h-7 mx-auto mb-1 text-zinc-400" />
            <span className="block text-sm text-zinc-600">10</span>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-2 text-zinc-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {formatDistanceToNow(new Date(plan.event.time || plan.event.startTime || ''))}
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {plan.event.description}
          </p>
        </div>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-[425px] p-0">
          <ScrollArea className="max-h-[80vh]">
            <div className="p-6">
              <FeedCard
                item={plan}
                onInterestToggle={() => {}}
                onRepostToggle={() => {}}
                onDelete={() => {}}
                isInterested={false}
                isReposted={false}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showInterestedModal} onOpenChange={setShowInterestedModal}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Interested in Your Plans</h3>
            <button onClick={() => setShowInterestedModal(false)}>Peek</button>
          </div>
          
          {(plan.event.interestedUsers || []).map(user => (
            <div key={user.userId} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                )}
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-zinc-500">wants to join • 5m ago</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-blue-500 text-white">
                  <Check className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}