// app/(features)/feed/feed.tsx
"use client";

import { useState } from 'react';
import { Search, Menu } from 'lucide-react';
import { FeedCard } from '@/components/shared/feed-card';
import { ThemeMenu } from '@/components/shared/theme-menu';
import { usePlan } from '@/contexts/PlanContext';

type TimeFilter = "all" | "now" | "later";
type ConnectionType = "friends" | "mutuals" | "community";

export function Feed() {
  const {
    feedItems,
    loading,
    error,
    visibility,
    setVisibility,
    timeFilter,
    setTimeFilter,
    searchQuery,
    setSearchQuery,
    toggleInterest,
    deletePlan,
    repostPlan,
    fetchPlans,
    interestedItems,
  } = usePlan();

  const [showSearch, setShowSearch] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [repostedItems, setRepostedItems] = useState<Set<string>>(new Set());

  const tabs: ConnectionType[] = ["friends", "mutuals", "community"];

  const handleInterestToggle = async (itemId: string) => {
    await toggleInterest(itemId);
  };

  const toggleRepost = (itemId: string) => {
    setRepostedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleTabChange = (tab: ConnectionType) => {
    setVisibility(tab);
    fetchPlans({ visibility: tab, timeFilter, search: searchQuery });
  };

  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
    fetchPlans({ visibility, timeFilter: filter, search: searchQuery });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchPlans({ visibility, timeFilter, search: query });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <header className="sticky top-0 z-10">
        <div className="relative bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-lg mx-auto px-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between py-4">
              <button onClick={() => setShowSearch(!showSearch)}>
                <Search className="w-5 h-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors" />
              </button>
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
                Tap'dIn
              </h1>
              <button onClick={() => setMenuOpen(true)}>
                <Menu className="w-5 h-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors" />
              </button>
            </div>

            {/* Search Bar */}
            <div
              className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${showSearch ? "max-h-16 opacity-100 mb-4" : "max-h-0 opacity-0"}
              `}
            >
              <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center px-3">
                <Search className="w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search plans, people, places..."
                  className="w-full px-3 py-2 bg-transparent text-zinc-900 dark:text-white text-sm placeholder:text-zinc-500 focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 pb-4">
              {/* Connection Type Scroll */}
              <div className="flex gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`
                      px-4 py-1.5 rounded-lg text-sm font-medium flex-1
                      transition-colors duration-200
                      ${
                        visibility === tab
                          ? "bg-black dark:bg-white text-white dark:text-black"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }
                    `}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Time Filter Pills */}
              <div className="flex justify-end">
                <div className="inline-flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
                  {["all", "now", "later"].map((time) => (
                    <button
                      key={time}
                      onClick={() => handleTimeFilterChange(time as TimeFilter)}
                      className={`
                        px-4 py-1.5 rounded-lg text-sm font-medium
                        transition-colors duration-200
                        ${
                          timeFilter === time
                            ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        }
                      `}
                    >
                      {time.charAt(0).toUpperCase() + time.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Loading plans...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400">{error}</p>
              <button
                onClick={() =>
                  fetchPlans({ visibility, timeFilter, search: searchQuery })
                }
                className="mt-4 px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : feedItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-500 dark:text-zinc-400">
                {searchQuery
                  ? "No plans found matching your search"
                  : "No plans available right now"}
              </p>
            </div>
          ) : (
            feedItems.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
                onInterestToggle={() => handleInterestToggle(item.id)}
                onRepostToggle={() => toggleRepost(item.id)}
                onDelete={() => deletePlan(item.id)}
                isInterested={interestedItems.some(
                  (interestedItem) => interestedItem.id === item.id
                )}
                isReposted={repostedItems.has(item.id)}
              />
            ))
          )}
        </div>
      </main>

      <ThemeMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}