// components/shared/profile-header.tsx

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";

export function ProfileHeader() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
            Profile
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/settings')}
              className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <Settings className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}