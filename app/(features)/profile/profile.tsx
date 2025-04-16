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
import type { ProfileData } from "@/lib/types";
import { PageContainer } from "@/components/shared/page-container";

export default function Profile() {
  const { showToast } = useToast();
  const { interestedItems, userPlans, fetchUserPlans } = usePlan();
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

  // Fetch user plans when component mounts
  useEffect(() => {
    console.log('[DEBUG] Profile component mounted, fetching user plans');
    fetchUserPlans();
  }, [fetchUserPlans]);

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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="p-4">
        <Alert message={error || "Profile not found"} />
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        {/* Profile Info */}
        <ProfileInfo
          profileData={profileData}
          isEditing={isEditing}
          onEdit={handleEdit}
          onFileUpload={handleFileUpload}
          uploadLoading={uploadLoading}
          onUpdateProfile={updateProfile}
        />

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4">
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
              <PlansView plans={userPlans} />
            )}

            {activeTab === "your-interests" && (
              <InterestsView interestedItems={interestedItems} />
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}