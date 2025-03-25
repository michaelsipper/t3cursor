// footprint.tsx
"use client";
import React, { useState } from "react";
import { useAppContext } from "@/components/shared/AppContext";
import {
  MapPin,
  Eye,
  Sparkles,
  Share,
  ArrowRight,
  Plus,
  X,
  ScrollText,
  Footprints,
  Compass,
} from "lucide-react";
import type { FeedItem, CustomPlaylist } from "@/lib/types";

interface CreatePlaylistModalProps {
  onClose: () => void;
  onCreate: (playlist: Omit<CustomPlaylist, "id">) => void;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      description: description.trim(),
      items: [],
    });
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 bottom-4 top-auto z-50 sm:relative sm:inset-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg mx-auto overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                New Collection
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Collection name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400"
                />
              </div>
              <div>
                <textarea
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 min-h-[100px]"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-400 to-sky-400 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Create Collection
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

interface CollectionCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  description: string;
  isActive: boolean;
  onClick: () => void;
  gradient: string;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  title,
  count,
  icon,
  description,
  isActive,
  onClick,
  gradient,
}) => (
  <button
    onClick={onClick}
    className={`
      w-full p-4 rounded-xl text-left
      transition-all duration-300 ease-out
      relative overflow-hidden group
      hover:scale-[1.02] active:scale-[0.98]
      ${
        isActive
          ? "bg-gradient-to-br " + gradient + " ring-1 ring-white/20"
          : "hover:bg-zinc-100 dark:hover:bg-zinc-900 bg-zinc-50 dark:bg-zinc-900/50"
      }
    `}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={
              isActive ? "text-white" : "text-zinc-900 dark:text-white"
            }
          >
            {icon}
          </div>
          <h3
            className={`font-medium ${
              isActive ? "text-white" : "text-zinc-900 dark:text-white"
            }`}
          >
            {title}
          </h3>
        </div>
        <span
          className={`text-sm ${
            isActive ? "text-white/70" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {count} {count === 1 ? "plan" : "plans"}
        </span>
      </div>
      <p
        className={`text-sm ${
          isActive ? "text-white/70" : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {description}
      </p>
    </div>
    <ArrowRight
      className={`
      absolute right-4 bottom-4 w-5 h-5
      transition-all duration-300
      ${
        isActive
          ? "opacity-100 translate-x-0 text-white/70"
          : "opacity-0 -translate-x-2 text-zinc-400"
      }
      group-hover:opacity-100 group-hover:translate-x-0
    `}
    />
  </button>
);

const CreateCollectionCard: React.FC<{ onClick: () => void }> = ({
  onClick,
}) => (
  <button
    onClick={onClick}
    className="w-full p-4 rounded-xl text-left
      transition-all duration-300 ease-out relative
      border-2 border-dashed border-zinc-300 dark:border-zinc-700
      hover:border-indigo-400 dark:hover:border-sky-400
      group"
  >
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 
        flex items-center justify-center
        group-hover:bg-indigo-100 dark:group-hover:bg-sky-900/30
        transition-colors"
      >
        <Plus
          className="w-5 h-5 text-zinc-500 dark:text-zinc-400
          group-hover:text-indigo-500 dark:group-hover:text-sky-400"
        />
      </div>
      <div>
        <h3 className="font-medium text-zinc-900 dark:text-white">
          Create Collection
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Start a new collection of plans
        </p>
      </div>
    </div>
  </button>
);

const FeedItemCard: React.FC<{ item: FeedItem }> = ({ item }) => (
  <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300">
    <div className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white">
          {item.poster.name[0]}
        </div>
        <div>
          <h3 className="font-medium text-zinc-900 dark:text-white line-clamp-1">
            {item.event?.title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {item.event?.time}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <MapPin className="w-4 h-4" />
        <span className="line-clamp-1">{item.event?.location}</span>
      </div>
    </div>

    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-sky-400/0 via-sky-400/50 to-sky-400/0 transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
  </div>
);

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  gradient: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  gradient,
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
    <div
      className={`w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
    >
      {icon}
    </div>
    <h3 className="font-medium text-zinc-900 dark:text-white mb-1">{title}</h3>
    <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-[15rem]">
      {message}
    </p>
  </div>
);

type TabType = "been" | "interested" | "bucketList" | string;

const Footprint: React.FC = () => {
  const { interestedItems, customPlaylists, addCustomPlaylist } =
    useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>("interested");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Default collections
  const defaultCollections = [
    {
      id: "interested" as TabType,
      title: "Interested In",
      count: interestedItems.length,
      icon: <Eye className="w-5 h-5" />,
      description: "Plans Michael clicked join on",
      gradient: "from-indigo-500/20 to-sky-500/20",
      emptyState: {
        icon: <Eye className="w-8 h-8 text-indigo-400" />,
        title: "No Interested Plans Yet",
        message: "Click join on plans in the feed to save them here ✨",
        gradient: "from-indigo-400/10 to-sky-400/10",
      },
    },
    {
      id: "been" as TabType,
      title: "Past Adventures",
      count: 0,
      icon: <Footprints className="w-5 h-5" />,
      description: "Plans Michael previously participated in",
      gradient: "from-pink-500/20 to-rose-500/20",
      emptyState: {
        icon: <Footprints className="w-8 h-8 text-rose-400" />,
        title: "No Past Adventures",
        message: "Your completed plans will show up here ✨",
        gradient: "from-pink-400/10 to-rose-400/10",
      },
    },
    {
      id: "bucketList" as TabType,
      title: "Bucket List",
      count: 0,
      icon: <Compass className="w-5 h-5" />,
      description: "Things Michael wants to do",
      gradient: "from-amber-500/20 to-orange-500/20",
      emptyState: {
        icon: <Compass className="w-8 h-8 text-amber-400" />,
        title: "Bucket List Empty",
        message: "Save your dream plans here ✨",
        gradient: "from-amber-400/10 to-orange-400/10",
      },
    },
  ];

  // All collections (default + custom)
  const allCollections = [
    ...defaultCollections,
    ...customPlaylists.map((playlist) => ({
      id: playlist.id.toString(),
      title: playlist.title,
      count: playlist.items.length,
      icon: <ScrollText className="w-5 h-5" />,
      description: playlist.description,
      gradient: "from-violet-500/20 to-purple-500/20",
      items: playlist.items,
      emptyState: {
        icon: <ScrollText className="w-8 h-8 text-purple-400" />,
        title: "Empty Collection",
        message: "Add some plans to this collection ✨",
        gradient: "from-violet-400/10 to-purple-400/10",
      },
    })),
  ];

  const activeCollection = allCollections.find(
    (c) => c.id.toString() === activeTab.toString()
  );

  const renderContent = () => {
    if (activeTab === "interested" && interestedItems.length === 0) {
      return <EmptyState {...defaultCollections[0].emptyState} />;
    }

    if (activeTab === "been") {
      return <EmptyState {...defaultCollections[1].emptyState} />;
    }

    if (activeTab === "bucketList") {
      return <EmptyState {...defaultCollections[2].emptyState} />;
    }

    const customPlaylist = customPlaylists.find(
      (p) => p.id.toString() === activeTab
    );
    if (customPlaylist && customPlaylist.items.length === 0) {
      return (
        <EmptyState
          icon={<ScrollText className="w-8 h-8 text-purple-400" />}
          title="Empty Collection"
          message="Add some plans to this collection ✨"
          gradient="from-violet-400/10 to-purple-400/10"
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        {activeTab === "interested" &&
          interestedItems.map((item) => (
            <FeedItemCard key={item.id} item={item} />
          ))}
        {customPlaylist?.items.map((item) => (
          <FeedItemCard key={item.id} item={item} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
              Your Public Board
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              
            </p>
          </div>
          <button className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors hover:scale-105 active:scale-95">
            <Share className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          {allCollections.map((collection) => (
            <CollectionCard
              key={collection.id}
              title={collection.title}
              count={collection.count}
              icon={collection.icon}
              description={collection.description}
              isActive={activeTab === collection.id}
              onClick={() => setActiveTab(collection.id)}
              gradient={collection.gradient}
            />
          ))}
          <CreateCollectionCard onClick={() => setShowCreateModal(true)} />
        </div>

        {/* Content */}
        {renderContent()}

        {/* Create Modal */}
        {showCreateModal && (
          <CreatePlaylistModal
            onClose={() => setShowCreateModal(false)}
            onCreate={addCustomPlaylist}
          />
        )}
      </div>
    </div>
  );
};

export default Footprint;
