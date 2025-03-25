// app/(features)/inbox/messages/messages.tsx
"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/shared/AuthContext';

interface Message {
  id: string;
  content: string;
  contentType: string;
  sender: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

interface Conversation {
  id: string;
  type: 'individual' | 'group';
  name?: string;
  participants: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
  }>;
  lastMessage?: {
    content: string;
    sender: string;
    createdAt: string;
  };
  updatedAt: string;
}

export default function Messages() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredConversations(
        conversations.filter(conv => 
          conv.participants.some(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          (conv.lastMessage?.content || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/messages/conversations', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations);
    } catch (error) {
      console.error('Fetch conversations error:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (conversation.type === 'individual') {
      return conversation.participants.find(p => p.id !== user?.id);
    }
    return null;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen max-w-lg mx-auto bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen max-w-lg mx-auto bg-white dark:bg-zinc-950 p-4">
        <div className="text-center text-red-500 dark:text-red-400">
          {error}
          <button
            onClick={fetchConversations}
            className="mt-4 px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-white dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.back()}
                className="text-black dark:text-white"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold text-black dark:text-white">
                Messages
              </h1>
            </div>
            <button className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search messages"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {filteredConversations.map(conversation => {
            const otherParticipant = getOtherParticipant(conversation);
            return (
              <div 
                key={conversation.id}
                className="flex items-center gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                onClick={() => router.push(`/inbox/messages/${conversation.id}`)}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white">
                  {otherParticipant?.avatarUrl ? (
                    <img 
                      src={otherParticipant.avatarUrl} 
                      alt={otherParticipant.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    otherParticipant?.name[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium dark:text-white truncate">
                      {conversation.type === 'individual' 
                        ? otherParticipant?.name 
                        : conversation.name}
                    </h3>
                    <span className="text-xs text-zinc-500">
                      {formatTime(conversation.updatedAt)}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${
                    conversation.lastMessage 
                      ? "text-zinc-900 dark:text-zinc-100 font-medium" 
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}>
                    {conversation.lastMessage?.content || "No messages yet"}
                  </p>
                </div>
              </div>
            );
          })}
          
          {filteredConversations.length === 0 && (
            <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
              {searchQuery ? "No conversations found" : "No messages yet"}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}