// components/shared/theme-menu.tsx
"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  X,
  RefreshCw,
  Settings,
  LogOut,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface ThemeMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl max-w-sm w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-black dark:text-white">
            Delete Account
          </h3>
        </div>

        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Are you sure you want to delete your account? This action cannot be
          undone and all your data will be permanently deleted.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Yes, delete account
          </button>
        </div>
      </div>
    </div>
  );
};

export function ThemeMenu({ isOpen, onClose }: ThemeMenuProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { resetToInitialFeed } = useAppContext();
  const { logout, deleteAccount } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      onClose();
      setShowDeleteConfirm(false);
      router.push("/login");
    } catch (error) {
      console.error("Delete account error:", error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40
          transition-opacity duration-300
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
      />

      {/* Menu */}
      <div
        className={`
          fixed top-0 right-0 bottom-0 w-72
          bg-white dark:bg-zinc-900 
          border-l border-zinc-200 dark:border-zinc-800
          z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-medium text-black dark:text-white">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Appearance Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Appearance
            </h3>

            {/* Theme Options */}
            <div className="space-y-2">
              <button
                onClick={() => setTheme("light")}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg
                  ${
                    theme === "light"
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }
                `}
              >
                <Sun className="w-5 h-5" />
                <span className="text-sm font-medium">Light</span>
              </button>

              <button
                onClick={() => setTheme("dark")}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg
                  ${
                    theme === "dark"
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }
                `}
              >
                <Moon className="w-5 h-5" />
                <span className="text-sm font-medium">Dark</span>
              </button>
            </div>
          </div>

          {/* Account Section */}
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
              Account
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Log Out</span>
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-sm font-medium">Delete Account</span>
              </button>
            </div>
          </div>

          {/* Developer Tools */}
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
              Developer Tools
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  resetToInitialFeed();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="text-sm font-medium">Reset Feed</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
      />
    </>
  );
}
