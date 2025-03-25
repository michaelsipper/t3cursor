// app/(features)/profile/components/plans-view.tsx
import { useState } from 'react';
import { usePlanActions } from '@/components/shared/PlanActionsContext';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FeedItem } from '@/lib/types';
import { Check, X, MapPin, Calendar } from 'lucide-react';
import type { Location } from '@/lib/types';

interface InterestedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: FeedItem;
  onAccept: (userId: string) => void;
  onReject: (userId: string) => void;
}

function InterestedUsersModal({ isOpen, onClose, plan, onAccept, onReject }: InterestedUsersModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <ScrollArea className="max-h-[80vh]">
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">{plan.event.title}</h2>
            <div className="space-y-3">
              {plan.event.interestedUsers?.map((user) => (
                <div key={user.userId} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white">
                        {user.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-zinc-500">wants to join</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onAccept(user.userId)} className="p-2 rounded-lg bg-green-500 text-white">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => onReject(user.userId)} className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function PlansView({ plans }: { plans: FeedItem[] }) {
  const [selectedPlan, setSelectedPlan] = useState<FeedItem | null>(null);
  const { acceptInterested, rejectInterested } = usePlanActions();

  const handleAccept = async (userId: string) => {
    if (!selectedPlan) return;
    await acceptInterested(selectedPlan.id, userId);
  };

  const handleReject = async (userId: string) => {
    if (!selectedPlan) return;
    await rejectInterested(selectedPlan.id, userId);
  };

  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        <div key={plan.id} className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden">
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
              </div>
              <button
                onClick={() => setSelectedPlan(plan)}
                className="text-center relative"
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
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{plan.event.time}</span>
              </div>
              {plan.event.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {plan.event.description}
                </p>
              )}
            </div>
          </div>
        </div>
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