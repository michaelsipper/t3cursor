// app/(features)/inbox/friend-requests/friend-requests.tsx
"use client";

import { useState } from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FriendRequest {
  id: number;
  name: string;
  mutualFriends: number;
  time: string;
}

export default function FriendRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<FriendRequest[]>([
    {
      id: 1,
      name: "Alex Thompson",
      mutualFriends: 12,
      time: "2d"
    },
    {
      id: 2,
      name: "Sarah Wilson",
      mutualFriends: 8,
      time: "1w"
    },
    {
      id: 3,
      name: "Michael Chen",
      mutualFriends: 15,
      time: "2w"
    }
  ]);

  const handleAccept = (id: number) => {
    setRequests(prev => prev.filter(req => req.id !== id));
  };

  const handleReject = (id: number) => {
    setRequests(prev => prev.filter(req => req.id !== id));
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
        <div className="space-y-4">
          {requests.map(request => (
            <div 
              key={request.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white">
                  {request.name[0]}
                </div>
                <div>
                  <h3 className="font-medium dark:text-white">{request.name}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {request.mutualFriends} mutual friends • {request.time}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(request.id)}
                  className="p-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-80"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
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
      </main>
    </div>
  );
}