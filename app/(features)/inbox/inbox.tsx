// app/(features)/inbox/inbox.tsx
"use client";

import React, { useState } from 'react';
import { MessageCircle, UserPlus, ArrowLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '@/components/shared/AppContext';
import { useRouter } from 'next/navigation';

interface RequestSection {
  id: number;
  type: 'friend' | 'interested';
  count: number;
  title: string;
  subtitle: string;
  path: string;
}

interface Notification {
  id: number;
  type: 'interested' | 'like' | 'comment' | 'follow' | 'tag';
  user: {
    name: string;
    id?: number;
  };
  planTitle?: string;
  action?: string;
  target?: string;
  time: string;
  feedItemId?: number;
}

interface NotificationGroup {
  title: string;
  items: Notification[];
}

const RequestRow: React.FC<{ section: RequestSection; onClick: () => void }> = ({ section, onClick }) => (
  <div 
    onClick={onClick}
    className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
  >
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <UserPlus className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
      </div>
      <div>
        <h3 className="font-semibold dark:text-white">{section.title}</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{section.subtitle}</p>
      </div>
    </div>
    <ChevronRight className="w-5 h-5 text-zinc-400" />
  </div>
);

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => (
  <div className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900">
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white">
        {notification.user.name[0]}
      </div>
      <div className="flex-1">
        <p className="text-sm dark:text-zinc-100">
          <span className="font-semibold">{notification.user.name}</span>
          <span className="text-zinc-600 dark:text-zinc-400"> {notification.action || `liked your ${notification.target}`}</span>
        </p>
        <span className="text-xs text-zinc-500">{notification.time}</span>
      </div>
    </div>
  </div>
);

export default function Inbox() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const { interestedItems } = useAppContext();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'like',
      user: { name: 'Sarah Chen' },
      target: 'post',
      time: '2m ago'
    },
    {
      id: 2,
      type: 'follow',
      user: { name: 'Alex Kumar' },
      action: 'started following you',
      time: '15m ago'
    },
    {
      id: 3,
      type: 'comment',
      user: { name: 'Maria Garcia' },
      action: 'commented on your post',
      target: 'Beach Volleyball',
      time: '2d ago'
    }
  ]);

  const requestSections: RequestSection[] = [
    {
      id: 1,
      type: 'friend',
      count: 5,
      title: 'Friend requests',
      subtitle: 'Approve or decline requests',
      path: '/inbox/friend-requests'
    },
    {
      id: 2,
      type: 'interested',
      count: 3,
      title: 'Interested in your plans',
      subtitle: 'Accept or decline plan requests',
      path: '/inbox/interested'
    }
  ];

  const tabs = ["All", "Your Friends", "Comments", "Follows"];

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'your friends') return notification.type === 'follow';
    if (activeTab === 'comments') return notification.type === 'comment';
    if (activeTab === 'follows') return notification.type === 'follow';
    return true;
  });

  const groupedNotifications: NotificationGroup[] = [
    {
      title: 'Today',
      items: filteredNotifications.filter(n => n.time.includes('m ago') || n.time.includes('h ago')),
    },
    {
      title: 'This Week',
      items: filteredNotifications.filter(n => n.time.includes('d')),
    },
    {
      title: 'This Month',
      items: filteredNotifications.filter(n => n.time.includes('w')),
    }
  ].filter(group => group.items.length > 0);

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
                Notifications
              </h1>
            </div>
            <button 
              onClick={() => router.push('/inbox/messages')}
              className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-3 mt-4 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                  ${activeTab === tab.toLowerCase()
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main>
        {/* Request Sections */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          {requestSections.map(section => (
            <RequestRow 
              key={section.id} 
              section={section}
              onClick={() => router.push(section.path)}
            />
          ))}
        </div>

        {/* Notifications */}
        <div className="pb-20">
          {groupedNotifications.map((group, idx) => (
            <div key={idx}>
              <h2 className="px-4 py-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50">
                {group.title}
              </h2>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {group.items.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            </div>
          ))}
          {groupedNotifications.length === 0 && (
            <div className="py-8 text-center text-zinc-500 dark:text-zinc-400">
              No notifications
            </div>
          )}
        </div>
      </main>
    </div>
  );
}