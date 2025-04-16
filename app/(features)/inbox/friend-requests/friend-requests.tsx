// app/(features)/inbox/friend-requests/friend-requests.tsx
"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

interface FriendRequest {
  _id: string;
  userId: string;
  name: string;
  avatar: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export default function FriendRequests() {
  const router = useRouter();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<{[key: string]: boolean}>({});

  // Fetch friend requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users/friends/request/get', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch friend requests');
        }

        const data = await response.json();
        setRequests(data.requests || []);
      } catch (error) {
        console.error('Error fetching friend requests:', error);
        showToast('Failed to load friend requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleResponse = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      setResponding(prev => ({ ...prev, [requestId]: true }));
      
      const response = await fetch('/api/users/friends/request/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ requestId, action })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} friend request`);
      }

      // Update the UI to remove the request
      setRequests(prev => prev.filter(req => req._id !== requestId));
      showToast(`Friend request ${action === 'accept' ? 'accepted' : 'rejected'}`);
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error);
      showToast(`Failed to ${action} friend request`);
    } finally {
      setResponding(prev => ({ ...prev, [requestId]: false }));
    }
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-white dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="text-black dark:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-black dark:text-white">
              Friend Requests
            </h1>
          </div>
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(request => (
              <div 
                key={request._id}
                className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white">
                    {request.avatar ? (
                      <img src={request.avatar} alt={request.name} className="w-full h-full object-cover" />
                    ) : (
                      request.name[0]
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium dark:text-white">{request.name}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Wants to connect with you
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResponse(request._id, 'accept')}
                    disabled={responding[request._id]}
                    className="p-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-80 disabled:opacity-50"
                  >
                    {responding[request._id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleResponse(request._id, 'reject')}
                    disabled={responding[request._id]}
                    className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                No friend requests
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}