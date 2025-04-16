import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, UserMinus, Loader2, AlertCircle, Search } from "lucide-react";
import { ProfileLink } from "@/components/shared/profile-link";
import { useToast } from "@/components/ui/use-toast";

interface Friend {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  userId?: string; // Optional userId to fetch friends for
}

export function FriendsModal({ isOpen, onClose, friends: initialFriends, userId }: FriendsModalProps) {
  const [friends, setFriends] = useState<Friend[]>(initialFriends);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>(initialFriends);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [removingFriend, setRemovingFriend] = useState<{[key: string]: boolean}>({});
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const { showToast } = useToast();

  // Fetch friends if we don't have any
  useEffect(() => {
    if (isOpen && initialFriends.length === 0 && !loading) {
      const fetchFriends = async () => {
        try {
          setLoading(true);
          const params = new URLSearchParams();
          if (userId) {
            params.append('userId', userId);
          }
          
          const response = await fetch(`/api/users/friends/get?${params.toString()}`, {
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch friends');
          }
          
          const data = await response.json();
          setFriends(data.friends || []);
          setFilteredFriends(data.friends || []);
        } catch (error) {
          console.error('Error fetching friends:', error);
          showToast("Failed to load friends");
        } finally {
          setLoading(false);
        }
      };
      
      fetchFriends();
    } else {
      // Update local state when the prop changes
      setFriends(initialFriends);
      setFilteredFriends(initialFriends);
    }
  }, [isOpen, initialFriends, userId, loading, showToast]);

  // Filter friends based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFriends(friends);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = friends.filter(friend => 
      friend.name.toLowerCase().includes(lowerQuery)
    );
    setFilteredFriends(filtered);
  }, [searchQuery, friends]);

  // Handle confirming remove
  const handleConfirmRemove = (friendId: string) => {
    if (confirmRemove === friendId) {
      // If already confirming, proceed with removal
      handleRemoveFriend(friendId);
    } else {
      // Start confirmation
      setConfirmRemove(friendId);
      
      // Auto-clear confirmation after 3 seconds
      setTimeout(() => {
        setConfirmRemove(null);
      }, 3000);
    }
  };

  // Handle removing a friend
  const handleRemoveFriend = async (friendId: string) => {
    try {
      setRemovingFriend(prev => ({ ...prev, [friendId]: true }));
      setConfirmRemove(null);
      
      const response = await fetch('/api/users/friends/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ friendId })
      });

      if (!response.ok) {
        throw new Error('Failed to remove connection');
      }

      // Update UI to remove the friend
      const updatedFriends = friends.filter(friend => friend.id !== friendId);
      setFriends(updatedFriends);
      setFilteredFriends(updatedFriends);
      showToast("Connection removed");
    } catch (error) {
      console.error('Error removing friend:', error);
      showToast("Failed to remove connection");
    } finally {
      setRemovingFriend(prev => ({ ...prev, [friendId]: false }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 h-dvh max-h-dvh flex flex-col rounded-none md:rounded-md md:max-h-[80vh] md:h-auto">
        <div className="sticky top-0 z-10 bg-white dark:bg-zinc-950 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold dark:text-white">Friends</h1>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>
          
          {/* Search bar */}
          <div className="relative mb-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-4 w-4 text-zinc-400 hover:text-zinc-600" />
              </button>
            )}
          </div>
        </div>
        
        <div className="overflow-y-auto flex-grow bg-white dark:bg-zinc-950">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 dark:text-zinc-400">
              {searchQuery ? (
                <>
                  <p>No friends match your search</p>
                  <p className="text-sm mt-2">Try a different name</p>
                </>
              ) : (
                <>
                  <p>No friends yet</p>
                  <p className="text-sm mt-2">Connect with others to grow your network</p>
                </>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredFriends.map((friend) => (
                <li key={friend.id} className="px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <ProfileLink userId={friend.id}>
                      <div className="flex items-center space-x-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white">
                          {friend.avatarUrl ? (
                            <img
                              src={friend.avatarUrl}
                              alt={friend.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-medium">
                              {friend.name[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-black dark:text-white">
                            {friend.name}
                          </h3>
                        </div>
                      </div>
                    </ProfileLink>
                    
                    <button 
                      onClick={() => handleConfirmRemove(friend.id)}
                      disabled={removingFriend[friend.id]}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        confirmRemove === friend.id 
                          ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                      title={confirmRemove === friend.id ? "Click again to confirm" : "Remove connection"}
                    >
                      {removingFriend[friend.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : confirmRemove === friend.id ? (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span>Confirm</span>
                        </>
                      ) : (
                        <span>Remove</span>
                      )}
                    </button>
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