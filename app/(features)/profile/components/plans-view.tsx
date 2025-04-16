// app/(features)/profile/components/plans-view.tsx
import { useState } from 'react';
import { usePlanActions } from '@/contexts/PlanActionsContext';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FeedItem, InterestedUser } from '@/lib/types';
import { Check, X, MapPin, Calendar, CheckCircle, XCircle, User as UserIcon, CheckCheck as CheckIcon } from 'lucide-react';
import type { Location } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileLink } from '@/components/shared/profile-link';
import { motion, AnimatePresence } from 'framer-motion';

interface InterestedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: FeedItem;
  onAccept: (userId: string) => void;
  onReject: (userId: string) => void;
}

function InterestedUsersModal({ isOpen, onClose, plan, onAccept, onReject }: InterestedUsersModalProps) {
  // Initialize statuses based on the plan's current state
  const [userStatuses, setUserStatuses] = useState<Record<string, 'pending' | 'accepted' | 'rejected'>>(() => {
    const initialStatuses: Record<string, 'pending' | 'accepted' | 'rejected'> = {};
    
    // Set initial statuses based on the plan's existing participants and interested users
    plan.event.interestedUsers?.forEach(user => {
      // If a user is already in participants list, they were previously accepted
      const isAlreadyParticipant = plan.event.participants.some(p => p.userId === user.userId);
      initialStatuses[user.userId] = isAlreadyParticipant ? 'accepted' : 'pending';
    });
    
    return initialStatuses;
  });
  
  const handleAccept = (userId: string) => {
    // Toggle between accepted and pending
    const newStatus = userStatuses[userId] === 'accepted' ? 'pending' : 'accepted';
    setUserStatuses(prev => ({ ...prev, [userId]: newStatus }));
    
    if (newStatus === 'accepted') {
      onAccept(userId);
    }
  };
  
  const handleReject = (userId: string) => {
    setUserStatuses(prev => ({ ...prev, [userId]: 'rejected' }));
    
    // Remove user from the interested users list after animation completes
    setTimeout(() => {
      onReject(userId);
      
      // Update the plan object to remove the rejected user from interestedUsers
      const updatedInterestedUsers = plan.event.interestedUsers?.filter(
        user => user.userId !== userId
      ) || [];
      plan.event.interestedUsers = updatedInterestedUsers;
    }, 300);
  };
  
  // Filter out users that have been rejected for the display
  const visibleUsers = plan.event.interestedUsers?.filter(
    user => userStatuses[user.userId] !== 'rejected'
  ) || [];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
        <DialogTitle className="sticky top-0 z-10 bg-white dark:bg-zinc-900 shadow-sm p-4">
          {plan.event.title}
        </DialogTitle>
        <ScrollArea className="max-h-[60vh] p-4">
          <div className="space-y-3">
            <AnimatePresence>
              {visibleUsers.map((user) => {
                const status = userStatuses[user.userId] || 'pending';
                
                return (
                  <motion.div
                    key={user.userId}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ 
                      opacity: 1,
                      backgroundColor: status === 'accepted' 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : undefined,
                      transition: { duration: 0.2 }
                    }}
                    exit={{ 
                      opacity: 0, 
                      x: 100,
                      transition: { duration: 0.2 }
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      status === 'accepted'
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20'
                        : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800'
                    }`}
                  >
                    <ProfileLink userId={user.userId} className="flex-1">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <div className="w-10 h-10 relative rounded-xl overflow-hidden">
                            <img 
                              src={user.avatar} 
                              alt={user.name || 'User'} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white">
                            {user.name && user.name.length > 0 
                              ? user.name.charAt(0).toUpperCase() 
                              : <UserIcon className="w-5 h-5" />}
                          </div>
                        )}
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{user.name || 'Anonymous User'}</p>
                      </div>
                    </ProfileLink>
                    
                    <div className="flex gap-2 ml-3">
                      <motion.button 
                        onClick={() => handleAccept(user.userId)} 
                        whileTap={{ scale: 0.92 }}
                        className={`p-2 rounded-xl transition-all duration-200 ${
                          status === 'accepted' 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {status === 'accepted' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                      </motion.button>
                      
                      <motion.button 
                        onClick={() => handleReject(user.userId)}
                        whileTap={{ scale: 0.92 }}
                        className="p-2 rounded-xl bg-zinc-200 hover:bg-red-500 hover:text-white dark:bg-zinc-700 dark:hover:bg-red-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {(!plan.event.interestedUsers || plan.event.interestedUsers.length === 0) && (
              <div className="text-center py-8 px-4">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">No one has shown interest yet</p>
                <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">When someone is interested, they'll appear here</p>
              </div>
            )}
            
            {plan.event.interestedUsers?.length > 0 && visibleUsers.length === 0 && (
              <div className="text-center py-8 px-4">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">All caught up!</p>
                <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">You've handled all interested users</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).replace(',', ' •');
};

export function PlansView({ plans }: { plans: FeedItem[] }) {
  const [selectedPlan, setSelectedPlan] = useState<FeedItem | null>(null);
  const { acceptInterested, rejectInterested } = usePlanActions();
  const { user } = useAuth();

  console.log("[DEBUG] PlansView received plans:", plans);

  const handleAccept = async (userId: string) => {
    if (!selectedPlan) return;
    await acceptInterested(selectedPlan.id, userId);
  };

  const handleReject = async (userId: string) => {
    if (!selectedPlan) return;
    await rejectInterested(selectedPlan.id, userId);
  };

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
        No plans yet
      </div>
    );
  }

  const isCreator = (plan: FeedItem) => {
    return plan.creator.id === user?.id;
  };

  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        isCreator(plan) ? (
          // Creator View
          <div key={plan.id} className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="bg-gradient-to-r from-indigo-500 to-sky-500 p-4">
              <h3 className="text-xl font-bold text-white">{plan.event.title}</h3>
              <div className="flex items-center gap-2 text-white/80 mt-2">
                <MapPin className="w-4 h-4" />
                <span>{typeof plan.event.location === 'string' ? plan.event.location : plan.event.location.name}</span>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">
                    {plan.event.participants.length}/{plan.event.totalSpots}
                  </div>
                  <div className="text-sm text-zinc-500">Going</div>
                  
                  {/* Profile Pictures of Participants */}
                  {plan.event.participants.length > 0 && (
                    <div className="flex -space-x-2 mt-2">
                      {plan.event.participants.slice(0, 5).map((participant) => (
                        <ProfileLink key={participant.userId} userId={participant.userId}>
                          <div className="relative" title={participant.name}>
                            {participant.avatar ? (
                              <div className="w-8 h-8 relative">
                                <img
                                  src={participant.avatar}
                                  alt={participant.name}
                                  className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center">
                                <span className="text-xs font-medium text-white">
                                  {participant.name && participant.name.length > 0 ? participant.name.charAt(0) : <UserIcon className="w-4 h-4" />}
                                </span>
                              </div>
                            )}
                          </div>
                        </ProfileLink>
                      ))}
                      
                      {plan.event.participants.length > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-200">
                            +{plan.event.participants.length - 5}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setSelectedPlan(plan)}
                  className="text-center relative group"
                >
                  <div className="text-2xl font-bold">
                    {plan.event.interestedUsers?.length || 0}
                    {plan.event.interestedUsers?.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">!</span>
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-500">Interested</div>
                  
                  {plan.event.interestedUsers?.length > 0 && (
                    <div className="mt-2 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to manage
                    </div>
                  )}
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-700 dark:text-zinc-300">{formatDateTime(plan.event.time)}</span>
                </div>
                {plan.event.description && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {plan.event.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Attendee View
          <div key={plan.id} className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="w-full bg-emerald-500 p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold text-white">{plan.event.title}</h3>
                <div className="bg-white/20 px-3 py-0.5 rounded-full">
                  <span className="text-sm text-white">Confirmed</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{typeof plan.event.location === 'string' ? 
                  plan.event.location : 
                  plan.event.location.name
                }</span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center gap-3">
                <ProfileLink userId={plan.poster.id}>
                  {plan.poster.avatarUrl ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden relative">
                      <img 
                        src={plan.poster.avatarUrl} 
                        alt={plan.poster.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {plan.poster.name && plan.poster.name.length > 0 ? plan.poster.name.charAt(0) : <UserIcon className="w-5 h-5" />}
                      </span>
                    </div>
                  )}
                </ProfileLink>
                <div className="flex-1">
                  <ProfileLink 
                    userId={plan.poster.id}
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
                  >
                    {plan.poster.name}
                  </ProfileLink>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Creator</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {formatDateTime(plan.event.time)}
                </span>
              </div>
              
              {/* Other participants */}
              {plan.event.participants.length > 1 && (
                <div className="mt-4">
                  <div className="text-xs font-medium text-zinc-500 mb-2">Other participants</div>
                  <div className="flex -space-x-2">
                    {plan.event.participants
                      .filter(p => p.userId !== plan.poster.id) // Filter out creator
                      .slice(0, 5)
                      .map((participant) => (
                        <ProfileLink key={participant.userId} userId={participant.userId}>
                          <div className="relative" title={participant.name}>
                            {participant.avatar ? (
                              <div className="w-8 h-8 relative">
                                <img
                                  src={participant.avatar}
                                  alt={participant.name}
                                  className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center">
                                <span className="text-xs font-medium text-white">
                                  {participant.name && participant.name.length > 0 ? participant.name.charAt(0) : <UserIcon className="w-4 h-4" />}
                                </span>
                              </div>
                            )}
                          </div>
                        </ProfileLink>
                      ))}
                    
                    {plan.event.participants.length > 6 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-200">
                          +{plan.event.participants.length - 6}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      ))}

      {selectedPlan && (
        <InterestedUsersModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          plan={selectedPlan}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}
    </div>
  );
}