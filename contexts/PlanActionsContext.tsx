"use client";

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';

type ParticipantStatus = 'pending' | 'accepted' | 'rejected' | 'confirmed';

interface StatusEntry {
  status: ParticipantStatus;
  userId: string;
}

interface PlanActionsContextType {
  acceptInterested: (planId: string, userId: string) => Promise<void>;
  rejectInterested: (planId: string, userId: string) => Promise<void>;
  confirmAttendance: (planId: string) => Promise<void>;
  getParticipantStatus: (planId: string, userId: string) => ParticipantStatus | undefined;
  refreshPlanStatus: (planId: string) => Promise<void>;
}

const PlanActionsContext = createContext<PlanActionsContextType | undefined>(undefined);

export function PlanActionsProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { fetchPlans } = usePlan();
  const [participantStatuses, setParticipantStatuses] = useState<Map<string, StatusEntry>>(new Map());

  // Clear state when auth changes
  useEffect(() => {
    if (!user) {
      setParticipantStatuses(new Map());
    }
  }, [user]);

  const getParticipantStatus = useCallback((planId: string, userId: string) => {
    const key = `${planId}-${userId}`;
    const status = participantStatuses.get(key);
    return status?.status;
  }, [participantStatuses]);

  const updateParticipantStatus = useCallback(async (planId: string, userId: string, status: ParticipantStatus) => {
    setParticipantStatuses(prev => {
      const newMap = new Map(prev);
      const key = `${planId}-${userId}`;
      newMap.set(key, { status, userId });
      return newMap;
    });
  }, []);

  const refreshPlanStatus = useCallback(async (planId: string) => {
    try {
      const response = await fetch(`/api/plans/participants/status?planId=${planId}`, {
        credentials: 'include'
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch plan status');
      }
  
      const data = await response.json();
      
      setParticipantStatuses(prev => {
        const newStatuses = new Map(prev);
        
        // First, clear any existing status for this plan
        Array.from(newStatuses.keys()).forEach(key => {
          if (key.startsWith(`${planId}-`)) {
            newStatuses.delete(key);
          }
        });
  
        // Set status for interested users
        if (data.interestedUsers) {
          data.interestedUsers.forEach((user: any) => {
            const key = `${planId}-${user.userId}`;
            newStatuses.set(key, { 
              status: user.status || 'pending', 
              userId: user.userId 
            });
          });
        }
  
        // Set confirmed status for participants
        if (data.participants) {
          data.participants.forEach((participant: any) => {
            const key = `${planId}-${participant.userId}`;
            newStatuses.set(key, { 
              status: 'confirmed', 
              userId: participant.userId 
            });
          });
        }
  
        return newStatuses;
      });
    } catch (error) {
      console.error('Error refreshing plan status:', error);
      throw error;
    }
  }, []);

  const acceptInterested = useCallback(async (planId: string, userId: string) => {
    try {
      const response = await fetch('/api/plans/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId, targetUserId: userId, action: 'accept' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept user');
      }
      
      await updateParticipantStatus(planId, userId, 'accepted');
      showToast('User accepted successfully');
    } catch (error) {
      console.error('Accept user error:', error);
      showToast('Failed to accept user');
      throw error;
    }
  }, [showToast, updateParticipantStatus]);

  const rejectInterested = useCallback(async (planId: string, userId: string) => {
    try {
      const response = await fetch('/api/plans/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId, targetUserId: userId, action: 'reject' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject user');
      }
      
      await updateParticipantStatus(planId, userId, 'rejected');
      showToast('User rejected successfully');
    } catch (error) {
      console.error('Reject user error:', error);
      showToast('Failed to reject user');
      throw error;
    }
  }, [showToast, updateParticipantStatus]);

  const confirmAttendance = useCallback(async (planId: string) => {
    try {
      const response = await fetch('/api/plans/participants/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm attendance');
      }
      
      const data = await response.json();
      
      // Update local status to confirmed
      if (user) {
        const userId = user._id?.toString() || user.id?.toString();
        setParticipantStatuses(prev => {
          const newMap = new Map(prev);
          const key = `${planId}-${userId}`;
          newMap.set(key, { status: 'confirmed', userId });
          return newMap;
        });

        // Refresh both interested items and user plans
        await fetchPlans();
        await refreshPlanStatus(planId);
      }
  
      showToast('Successfully confirmed attendance!');
      return data;
    } catch (error) {
      console.error('Confirm attendance error:', error);
      throw error;
    }
  }, [user, fetchPlans, refreshPlanStatus, showToast]);

  const contextValue: PlanActionsContextType = {
    acceptInterested,
    rejectInterested,
    confirmAttendance,
    getParticipantStatus,
    refreshPlanStatus
  };

  return (
    <PlanActionsContext.Provider value={contextValue}>
      <div key={user?.id || 'no-user'}>
        {children}
      </div>
    </PlanActionsContext.Provider>
  );
}

export function usePlanActions() {
  const context = useContext(PlanActionsContext);
  if (!context) {
    throw new Error("usePlanActions must be used within a PlanActionsProvider");
  }
  return context;
}
