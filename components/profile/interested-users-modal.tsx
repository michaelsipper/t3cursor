// components/profile/interested-users-modal.tsx
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check, X } from "lucide-react";
import type { InterestedUser } from "@/lib/types";

interface InterestedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  interestedUsers: InterestedUser[];
  onAccept: (userId: string) => void;
  onReject: (userId: string) => void;
}

export function InterestedUsersModal({
  isOpen,
  onClose,
  interestedUsers,
  onAccept,
  onReject
}: InterestedUsersModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Interested Users</h3>
          {interestedUsers.map(user => (
            <div key={user.userId} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white">
                    {user.name[0]}
                  </div>
                )}
                <span className="font-medium">{user.name}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onAccept(user.userId)} className="p-2 rounded-lg bg-black dark:bg-white text-white dark:text-black">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => onReject(user.userId)} className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}