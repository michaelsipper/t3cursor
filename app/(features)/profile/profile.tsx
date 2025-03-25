// app/(features)/profile/profile.tsx
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Alert } from "@/components/ui/alert";
import { useAppContext } from "@/contexts/AppContext";
import { useProfile } from "@/contexts/ProfileContext";
import { usePlan } from "@/contexts/PlanContext";
import { ProfileInfo } from "./components/profile-info";
import { PhotosPrompts } from "./components/photos-prompts";
import { PlansView } from "./components/plans-view";
import { InterestsView } from "./components/interests-view";
import { Loader2 } from "lucide-react";
import type { FeedItem } from "@/lib/types";

export default function Profile() {
  const { showToast } = useToast();
  const { interestedItems } = usePlan();
  const {
    profileData,
    loading,
    error,
    isEditing,
    setIsEditing,
    updateProfile,
    uploadFile,
    refreshProfile,
    updateBlurb,
    editPrompt,
    removeBlurb,
    addBlurb,
    cleanupPrompts,
  } = useProfile();

  const [activeTab, setActiveTab] = useState<"photos" | "your-plans" | "your-interests">("photos");
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState<{
    type: "avatar" | "banner" | "photo";
    id?: string;
  } | null>(null);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [userPlans, setUserPlans] = useState<FeedItem[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    if (activeTab === 'your-plans' && profileData?._id) {
      const fetchUserPlans = async () => {
        setLoadingPlans(true);
        try {
          const response = await fetch('/api/plans/user', { 
            credentials: 'include' 
          });
          if (!response.ok) throw new Error('Failed to fetch plans');
          const { plans } = await response.json();
          setUserPlans(plans);
        } catch (error) {
          console.error('Error fetching plans:', error);
          showToast('Failed to load plans');
        } finally {
          setLoadingPlans(false);
        }
      };
      fetchUserPlans();
    }
  }, [activeTab, profileData?._id]);

  const handleFileUpload = async (
    type: "avatar" | "banner" | "photo",
    file: File,
    photoId?: string
  ) => {
    try {
      setUploadLoading({ type, id: photoId });
      await uploadFile(file, type, photoId);
      showToast("Upload successful!");
    } catch (error) {
      console.error("Upload error:", error);
      showToast("Failed to upload file");
    } finally {
      setUploadLoading(null);
    }
  };

  const handleEdit = async () => {
    if (isEditing) {
      try {
        setIsEditing(false);
      } catch (error) {
        showToast("Failed to update profile");
      }
    } else {
      setIsEditing(true);
    }
  };

  const handlePromptAction = async (
    promptId: string | null,
    newPrompt: string
  ) => {
    try {
      if (promptId) {
        await editPrompt(promptId, newPrompt);
      } else {
        await addBlurb(newPrompt);
      }
    } catch (error) {
      console.error("Failed to handle prompt:", error);
      showToast("Failed to update prompt");
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center bg-white dark:bg-zinc-950">
        <Alert message={error || "Profile not found"} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-lg mx-auto">
        <ProfileInfo
          profileData={profileData}
          isEditing={isEditing}
          onEdit={handleEdit}
          onFileUpload={handleFileUpload}
          uploadLoading={uploadLoading}
          onUpdateProfile={updateProfile}
        />

        {/* Tabs */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 mt-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("photos")}
              className={`
                px-1 py-4 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === "photos"
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }
              `}
            >
              Photos & Prompts
            </button>
            <button
              onClick={() => setActiveTab("your-plans")}
              className={`
                px-1 py-4 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === "your-plans"
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }
              `}
            >
              Your Plans
            </button>
            <button
              onClick={() => setActiveTab("your-interests")}
              className={`
                px-1 py-4 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === "your-interests"
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }
              `}
            >
              Your Interests
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4">
          {activeTab === "photos" && (
            <PhotosPrompts
              profileData={profileData}
              isEditing={isEditing}
              uploadLoading={uploadLoading}
              showPromptModal={showPromptModal}
              editingPromptId={editingPromptId}
              onFileUpload={handleFileUpload}
              onUpdateBlurb={updateBlurb}
              onRemoveBlurb={removeBlurb}
              onAddBlurb={addBlurb}
              onPromptAction={handlePromptAction}
              setShowPromptModal={setShowPromptModal}
              setEditingPromptId={setEditingPromptId}
            />
          )}

          {activeTab === "your-plans" && (
            <PlansView
              plans={userPlans}
              loading={loadingPlans}
            />
          )}

          {activeTab === "your-interests" && (
            <InterestsView interestedItems={interestedItems} />
          )}
        </div>
      </div>
    </div>
  );
}