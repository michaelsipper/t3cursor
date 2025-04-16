// app/(features)/profile/components/profile-info.tsx

import { useState } from "react";
import { Camera, MapPin, Shield, Check, Edit3, Activity } from "lucide-react";
import { Loader2 } from "lucide-react";
import { DEFAULT_STATUS_OPTIONS } from "@/lib/constants";
import type { ProfileData } from "@/lib/types";
import { FriendsModal } from "./friends-modal";

interface ProfileInfoProps {
  profileData: ProfileData;
  isEditing: boolean;
  onEdit: () => void;
  onFileUpload: (type: "avatar" | "banner" | "photo", file: File, photoId?: string) => Promise<void>;
  uploadLoading: {
    type: "avatar" | "banner" | "photo";
    id?: string;
  } | null;
  onUpdateProfile: (updates: Partial<ProfileData>) => Promise<void>;
}

export function ProfileInfo({
  profileData,
  isEditing,
  onEdit,
  onFileUpload,
  uploadLoading,
  onUpdateProfile,
}: ProfileInfoProps) {
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  return (
    <>
      <div className="w-full bg-white dark:bg-zinc-950">
        <div className="max-w-lg mx-auto relative">
          {/* Banner Section */}
          <div
            className="relative h-32 bg-gradient-to-r from-indigo-400 to-sky-400 bg-cover bg-center rounded-none sm:rounded-b-2xl overflow-hidden"
            style={
              profileData.bannerUrl
                ? { backgroundImage: `url(${profileData.bannerUrl})` }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
            {isEditing && (
              <div className="absolute bottom-4 right-4 z-10">
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onFileUpload("banner", file);
                    }}
                  />
                  <div className="w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors flex items-center justify-center">
                    {uploadLoading?.type === "banner" ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        <div className="relative -mt-16">
          {/* Profile Picture Section */}
          <div className="flex gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-32 h-32 rounded-2xl ring-4 ring-white dark:ring-zinc-950 bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center overflow-hidden">
                {profileData.avatarUrl ? (
                  <img
                    src={profileData.avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {profileData.name[0]}
                  </span>
                )}
              </div>

              <button
                onClick={onEdit}
                className="absolute -top-2 -right-2 p-2 rounded-full bg-white dark:bg-zinc-900 shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {isEditing ? (
                  <Check className="w-4 h-4 text-blue-500" />
                ) : (
                  <Edit3 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                )}
              </button>

              {isEditing && (
                <label className="absolute bottom-2 right-2 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onFileUpload("avatar", file);
                    }}
                  />
                  <div className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                    {uploadLoading?.type === "avatar" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </div>
                </label>
              )}
            </div>

            {/* Profile Info Section */}
            <div className="flex-1 pt-20">
              <div className="inline-flex items-center gap-2 max-w-full">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => onUpdateProfile({ name: e.target.value })}
                      className="text-xl font-bold bg-transparent dark:text-white focus:outline-none max-w-[200px]"
                    />
                    <span className="text-zinc-400 dark:text-zinc-500">,</span>
                    <input
                      type="number"
                      value={profileData.age}
                      onChange={(e) =>
                        onUpdateProfile({ age: parseInt(e.target.value) })
                      }
                      className="w-16 text-lg bg-transparent dark:text-zinc-300 focus:outline-none"
                    />
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold dark:text-white">
                      {profileData.name}
                    </h2>
                    <span className="text-zinc-400 dark:text-zinc-500">,</span>
                    <span className="text-lg dark:text-zinc-300">
                      {profileData.age}
                    </span>
                  </>
                )}
                <Shield className="w-5 h-5 text-blue-500" />
              </div>

              <div className="flex items-center gap-1.5 text-zinc-500 mt-2">
                <MapPin className="w-4 h-4" />
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) =>
                      onUpdateProfile({ location: e.target.value })
                    }
                    className="text-sm bg-transparent focus:outline-none max-w-[200px]"
                  />
                ) : (
                  <span className="text-sm">{profileData.location}</span>
                )}
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-6">
            {isEditing ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => onUpdateProfile({ bio: e.target.value })}
                placeholder="Add a bio..."
                className="w-full text-sm bg-transparent dark:text-zinc-100 focus:outline-none resize-none min-h-[60px] max-h-[120px]"
              />
            ) : (
              <p className="text-sm dark:text-zinc-100">{profileData.bio}</p>
            )}
          </div>

          {/* Stats Section */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <button 
                  onClick={() => setShowFriendsModal(true)}
                  className="text-lg font-semibold dark:text-zinc-100 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  {profileData.stats.friendCount}
                </button>
                <div className="text-sm text-zinc-500">Friends</div>
              </div>

              <div>
                <div className="text-lg font-semibold text-emerald-500">
                  {profileData.stats.flakeScore}%
                </div>
                <div className="text-sm text-zinc-500">Reliable</div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <Activity className="w-4 h-4 text-emerald-500" />
              {isEditing ? (
                <select
                  value={profileData.stats.status}
                  onChange={(e) =>
                    onUpdateProfile({
                      stats: { ...profileData.stats, status: e.target.value },
                    })
                  }
                  className="text-sm bg-transparent dark:text-zinc-100 border-none focus:ring-0 cursor-pointer"
                >
                  {DEFAULT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm font-medium dark:text-zinc-100">
                  {profileData.stats.status}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Friends Modal */}
      <FriendsModal 
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        friends={profileData.friends || []}
      />
    </>
  );
}