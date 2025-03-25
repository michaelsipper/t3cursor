// app/(features)/inbox/messages/[id]/conversation.tsx

"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Image, Loader2 } from 'lucide-react';
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

interface Participant {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface ConversationDetails {
  id: string;
  type: 'individual' | 'group';
  name?: string;
  participants: Participant[];
}

export default function Conversation() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const [messagesRes, conversationRes] = await Promise.all([
        fetch(`/api/messages?conversationId=${id}`, {
          credentials: 'include'
        }),
        fetch(`/api/messages/conversations`, {
          credentials: 'include'
        })
      ]);

      if (!messagesRes.ok || !conversationRes.ok) {
        throw new Error('Failed to fetch conversation data');
      }

      const { messages: newMessages } = await messagesRes.json();
      const { conversations } = await conversationRes.json();
      
      const currentConversation = conversations.find((c: any) => c.id === id);
      if (currentConversation) {
        setConversation(currentConversation);
      }

      // Messages will now come in correct chronological order from the API
      setMessages(newMessages);
      setLoading(false);
    } catch (error) {
      console.error('Fetch messages error:', error);
      setError('Failed to load messages');
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: id,
          content: newMessage,
          contentType: 'text'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Send message error:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOtherParticipant = () => {
    if (!conversation || !user) return null;
    return conversation.participants.find(p => p.id !== user.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 bg-white dark:bg-zinc-950">
        <div className="text-center text-red-500 dark:text-red-400">
          {error}
          <button
            onClick={fetchMessages}
            className="mt-4 px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="text-black dark:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white">
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
              <div>
                <h1 className="font-medium text-black dark:text-white">
                  {conversation?.type === 'individual' 
                    ? otherParticipant?.name 
                    : conversation?.name}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                message.sender.id === user?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white'
              }`}
            >
              <p>{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.sender.id === user?.id
                  ? 'text-blue-100'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}>
                {formatTime(message.createdAt)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form 
        onSubmit={handleSend}
        className="border-t border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-2"
      >
        <button
          type="button"
          className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <Image className="w-6 h-6" />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2 text-black dark:text-white placeholder:text-zinc-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="p-2 text-blue-500 hover:text-blue-600 disabled:text-zinc-400 disabled:cursor-not-allowed"
        >
          {sending ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Send className="w-6 h-6" />
          )}
        </button>
      </form>
    </div>
  );
}