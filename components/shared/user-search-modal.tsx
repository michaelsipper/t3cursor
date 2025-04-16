import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Search, Loader2, UserPlus, Check, MapPin } from "lucide-react";
import { ProfileLink } from "@/components/shared/profile-link";
import { useToast } from "@/components/ui/use-toast";
import { useDebounce } from "@/hooks/useDebounce";

interface User {
  id: string;
  name: string;
  age?: number;
  avatarUrl: string | null;
  location?: string;
}

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSearchModal({ isOpen, onClose }: UserSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingFriend, setAddingFriend] = useState<{[key: string]: boolean}>({});
  const [friends, setFriends] = useState<Set<string>>(new Set());
  const { showToast } = useToast();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const activeRequest = useRef<string | null>(null);
  const mounted = useRef(false);
  const previousQuery = useRef<string>("");

  // Set up the mounted ref when component mounts/unmounts
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Clear results when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setUsers([]);
      setAddingFriend({});
      activeRequest.current = null;
      previousQuery.current = "";
    }
  }, [isOpen]);

  // Memoize the search function to prevent recreation on each render
  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) return;
    
    // Skip if this exact query is already in progress
    if (activeRequest.current === query) return;
    
    // Skip if the query hasn't actually changed
    if (previousQuery.current === query) return;
    
    // Update the previous query ref
    previousQuery.current = query;
    
    // Mark this query as the active request
    activeRequest.current = query;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      });

      // Skip updating state if the query has changed or component unmounted
      if (activeRequest.current !== query || !mounted.current) return;

      if (!response.ok) {
        throw new Error("Failed to search users");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      // Only show error if this is still the active request
      if (activeRequest.current === query && mounted.current) {
        console.error("Error searching users:", error);
        showToast("Failed to search users");
      }
    } finally {
      // Only update loading state if this is still the active request
      if (activeRequest.current === query && mounted.current) {
        setLoading(false);
        activeRequest.current = null;
      }
    }
  }, [showToast]);

  // Search users when query changes
  useEffect(() => {
    // Reset loading and clear results if query is too short
    if (!isOpen || !debouncedSearchQuery || debouncedSearchQuery.length < 2) {
      if (loading) {
        setLoading(false);
      }
      if (debouncedSearchQuery.length < 2 && users.length > 0) {
        setUsers([]);
      }
      return;
    }
    
    // Only perform a search if the query has actually changed
    if (previousQuery.current !== debouncedSearchQuery) {
      // Start search after a small delay to prevent flashing loading state
      const timeoutId = setTimeout(() => {
        searchUsers(debouncedSearchQuery);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [debouncedSearchQuery, searchUsers, isOpen, loading, users.length]);

  // Handle adding a friend
  const handleAddFriend = async (userId: string) => {
    if (friends.has(userId)) return;
    
    try {
      setAddingFriend(prev => ({ ...prev, [userId]: true }));
      
      const response = await fetch('/api/users/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ friendId: userId })
      });

      if (!mounted.current) return;

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send friend request');
      }

      // Add to local friends set to track sent requests
      setFriends(prev => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });

      showToast("Friend request sent!");
    } catch (error) {
      if (mounted.current) {
        console.error('Error sending friend request:', error);
        showToast(error instanceof Error ? error.message : 'Failed to send friend request');
      }
    } finally {
      if (mounted.current) {
        setAddingFriend(prev => ({ ...prev, [userId]: false }));
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 max-h-[80vh] flex flex-col">
        <div className="sticky top-0 z-10 bg-white dark:bg-zinc-950 p-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold dark:text-white">Search People</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or location..."
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-grow">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : debouncedSearchQuery.length < 2 ? (
            <div className="p-6 text-center text-zinc-500 dark:text-zinc-400">
              <p>Enter at least 2 characters to search</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 dark:text-zinc-400">
              <p>No users found</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {users.map((user) => (
                <li key={user.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <ProfileLink userId={user.id}>
                      <div className="flex items-center space-x-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
                              {user.name[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-medium text-black dark:text-white">
                              {user.name}
                            </h3>
                            {user.age && (
                              <span className="ml-1 text-zinc-400 dark:text-zinc-500">, {user.age}</span>
                            )}
                          </div>
                          
                          {user.location && (
                            <div className="flex items-center text-xs text-zinc-500 mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span>{user.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </ProfileLink>

                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => !friends.has(user.id) && handleAddFriend(user.id)}
                        disabled={addingFriend[user.id] || friends.has(user.id)}
                        className={`flex items-center justify-center h-8 w-8 rounded-full transition-colors 
                          ${friends.has(user.id) 
                            ? 'bg-blue-400 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'}`
                        }
                        title={friends.has(user.id) ? "Request sent" : "Send friend request"}
                      >
                        {addingFriend[user.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : friends.has(user.id) ? (
                          <UserPlus className="w-4 h-4" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 