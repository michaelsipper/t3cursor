import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Calendar, Clock, Users, MessageCircle, Share2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FeedItem } from '@/lib/types';
import { usePlanActions } from '@/contexts/PlanActionsContext';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';

interface InterestsViewProps {
  interestedItems: FeedItem[];
}

const formatDateTime = (dateString?: string | number) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).replace(',', ' •');
};

export function InterestsView({ interestedItems }: InterestsViewProps) {
  const { confirmAttendance, getParticipantStatus, refreshPlanStatus } = usePlanActions();
  const { showToast } = useToast();
  const { user } = useAuth();
  const refreshedRef = useRef(new Set<string>());
  const [dismissedPlans, setDismissedPlans] = useState(new Set<string>());

  const getStatusStyles = useCallback((planId: string, currentPlan: FeedItem) => {
    if (!user) return 'border-zinc-200 dark:border-zinc-800';
    
    const userId = user._id?.toString() || user.id?.toString();
    
    // First check if user is in participants list
    const isParticipant = currentPlan.event.participants.some(
      participant => String(participant.userId) === String(userId)
    );
  
    if (isParticipant) {
      return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
    
    const status = getParticipantStatus(planId, userId);
  
    switch (status) {
      case 'accepted':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'rejected':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20 opacity-60';
      case 'confirmed':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-zinc-200 dark:border-zinc-800';
    }
  }, [user, getParticipantStatus]);

  const getStatusMessage = useCallback((planId: string, currentPlan: FeedItem) => {
    if (!user) return '';
    
    const userId = user._id?.toString() || user.id?.toString();
    
    // First check if user is in participants list
    const isParticipant = currentPlan.event.participants.some(
      participant => String(participant.userId) === String(userId)
    );
  
    if (isParticipant) {
      return 'You are confirmed for this plan! See details below.';
    }
    
    const status = getParticipantStatus(planId, userId);
  
    switch (status) {
      case 'accepted':
        return 'You have been accepted! Click to confirm.';
      case 'rejected':
        return 'Sorry, this plan is full or the host has declined.';
      case 'confirmed':
        return 'You are confirmed for this plan! See details below.';
      default:
        return 'Waiting for host response...';
    }
  }, [user, getParticipantStatus]);

  const handleConfirmAttendance = async (planId: string) => {
    try {
      await confirmAttendance(planId);
      await refreshPlanStatus(planId);
      showToast('Successfully confirmed attendance!');
    } catch (error) {
      console.error('Confirm attendance error:', error);
      showToast('Failed to confirm attendance');
    }
  };

  const handleDismissRejected = (planId: string) => {
    setDismissedPlans(prev => {
      const next = new Set(prev);
      next.add(planId);
      return next;
    });
  };

  useEffect(() => {
    const refreshNewPlans = async () => {
      for (const item of interestedItems) {
        if (!refreshedRef.current.has(item.id)) {
          await refreshPlanStatus(item.id);
          refreshedRef.current.add(item.id);
        }
      }
    };
    refreshNewPlans();

    return () => {
      refreshedRef.current.forEach(id => {
        if (!interestedItems.find(item => item.id === id)) {
          refreshedRef.current.delete(id);
        }
      });
    };
  }, [interestedItems, refreshPlanStatus]);

  const renderPlanDetails = (plan: FeedItem, status: string | undefined) => {
    // Now check participant AND confirmed status
    const userId = user?._id?.toString() || user?.id?.toString();
    const isParticipant = userId && plan.event.participants.some(
      participant => String(participant.userId) === String(userId)
    );

    // Show extended details if status is confirmed OR if user is a participant
    const showExtendedDetails = status === 'confirmed' || isParticipant;

    return (
      <div className="p-4 space-y-4">
        {/* Host section */}
        {plan.event.host && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white">
              {plan.event.host.name[0]}
            </div>
            <div>
              <p className="font-medium dark:text-white">{plan.event.host.name}</p>
              <p className="text-sm text-zinc-500">Host</p>
            </div>
          </div>
        )}

        {/* Basic Info Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Calendar className="w-4 h-4" />
            <span>{formatDateTime(plan.event.time)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Users className="w-4 h-4" />
            <span>
              {plan.event.participants.length}/{plan.event.totalSpots} going • {plan.event.openSpots} spots left
            </span>
          </div>
          {plan.event.startTime && (
            <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
              <Clock className="w-4 h-4" />
              <span>
                Starts {new Date(plan.event.startTime).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Description Section */}
        {plan.event.description && (
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {plan.event.description}
          </p>
        )}

        {/* Status Message Section */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <p className={`text-sm ${
            status === 'accepted' ? 'text-green-600 dark:text-green-400' :
            status === 'rejected' ? 'text-red-600 dark:text-red-400' :
            status === 'confirmed' ? 'text-blue-600 dark:text-blue-400' :
            'text-zinc-600 dark:text-zinc-400'
          }`}>
            {getStatusMessage(plan.id, plan)}
          </p>
        </div>

        {/* Extended Details for Confirmed or Participant Plans */}
        {showExtendedDetails && (
          <div className="space-y-4 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-zinc-900 dark:text-white">Plan Details</h4>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 space-y-2">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Location Details</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {typeof plan.event.location === 'string' ? plan.event.location : plan.event.location.name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Other Participants</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.event.participants.map((participant, index) => (
                      <span key={index} className="text-sm text-zinc-700 dark:text-zinc-300">
                        {participant.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2">
              <button className="flex-1 py-2 px-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <MessageCircle className="w-4 h-4" />
                Message Host
              </button>
              <button className="flex-1 py-2 px-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <Share2 className="w-4 h-4" />
                Share Plan
              </button>
            </div>
          </div>
        )}

        {/* Confirm Button (only for accepted status) */}
        {status === 'accepted' && (
          <button 
            onClick={() => handleConfirmAttendance(plan.id)}
            className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirm Going
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {interestedItems.map((plan) => {
          const status = getParticipantStatus(plan.id, user?.id || '');
          if (dismissedPlans.has(plan.id)) return null;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border ${getStatusStyles(plan.id, plan)} relative`}>
                {status === 'rejected' && !dismissedPlans.has(plan.id) && (
                  <motion.div
                    className="absolute inset-0 bg-black/5 backdrop-blur-[1px] flex items-center justify-center cursor-pointer z-10"
                    onClick={() => handleDismissRejected(plan.id)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <X className="w-12 h-12 text-red-500/70" />
                  </motion.div>
                )}

                <div className="bg-gradient-to-r from-indigo-500 to-sky-500 p-4">
                  <h3 className="text-xl font-bold text-white">{plan.event.title}</h3>
                  <div className="flex items-center gap-2 text-white/80 mt-2">
                    <MapPin className="w-4 h-4" />
                    <span>{typeof plan.event.location === 'string' ? plan.event.location : plan.event.location.name}</span>
                  </div>
                </div>

                {renderPlanDetails(plan, status)}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {interestedItems.length === 0 && (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          No interested plans yet
        </div>
      )}
    </div>
  );
}
