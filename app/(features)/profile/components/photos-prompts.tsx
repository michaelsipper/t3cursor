// app/(features)/profile/components/photos-prompts.tsx

import { useState } from 'react';
import { Camera, Plus, PlusCircle, X } from "lucide-react";
import { Loader2 } from "lucide-react";
import { MAX_PROMPTS } from "@/lib/constants";
import type { ProfileData } from "@/lib/types";

interface PhotosPromptsProps {
  profileData: ProfileData;
  isEditing: boolean;
  uploadLoading: {
    type: "avatar" | "banner" | "photo";
    id?: string;
  } | null;
  showPromptModal: boolean;
  editingPromptId: string | null;
  onFileUpload: (type: "avatar" | "banner" | "photo", file: File, photoId?: string) => Promise<void>;
  onUpdateBlurb: (id: string, response: string) => Promise<void>;
  onRemoveBlurb: (id: string) => Promise<void>;
  onAddBlurb: (prompt: string) => Promise<void>;
  onPromptAction: (promptId: string | null, newPrompt: string) => Promise<void>;
  setShowPromptModal: (show: boolean) => void;
  setEditingPromptId: (id: string | null) => void;
}

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (prompt: string) => void;
  editingPromptId: string | null;
}

const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  editingPromptId,
}) => {
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const defaultPrompts = [
    "A perfect night looks like...",
    "Best spontaneous decision...",
    "You'll find me...",
    "My go-to adventure is...",
    "Best local spot...",
    "Next on my list...",
    "My signature move...",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {editingPromptId ? "Change Prompt" : "Add a Prompt"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {defaultPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                onAdd(prompt);
                onClose();
              }}
              className="w-full text-left px-4 py-3 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm"
            >
              {prompt}
            </button>
          ))}
        </div>

        {showCustomInput ? (
          <div className="space-y-4">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Type your custom prompt..."
              className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCustomInput(false)}
                className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (customPrompt.trim()) {
                    onAdd(customPrompt);
                    onClose();
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
                disabled={!customPrompt.trim()}
              >
                {editingPromptId ? "Update Prompt" : "Add Custom Prompt"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomInput(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-blue-500 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 rounded-xl transition-colors text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Create Custom Prompt
          </button>
        )}
      </div>
    </div>
  );
};

export function PhotosPrompts({
  profileData,
  isEditing,
  uploadLoading,
  showPromptModal,
  editingPromptId,
  onFileUpload,
  onUpdateBlurb,
  onRemoveBlurb,
  onAddBlurb,
  onPromptAction,
  setShowPromptModal,
  setEditingPromptId,
}: PhotosPromptsProps) {
  return (
    <div className="space-y-8 py-6">
      {profileData.photos.map((photo, index) => (
        <div key={photo._id} className="space-y-4">
          <div
            className={`relative rounded-2xl overflow-hidden ${
              index === 0 ? "aspect-[2/1]" : "aspect-square"
            } bg-zinc-100 dark:bg-zinc-900`}
          >
            {photo.url ? (
              <img
                src={photo.url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-zinc-400" />
              </div>
            )}
            {isEditing && (
              <label className="absolute inset-0 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    onFileUpload(
                      "photo",
                      e.target.files[0],
                      photo._id
                    )
                  }
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors group">
                  {uploadLoading?.type === "photo" &&
                  uploadLoading.id === photo._id ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </label>
            )}
          </div>

          {index < profileData.prompts.length && index < MAX_PROMPTS && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium dark:text-zinc-100">
                  {profileData.prompts[index].prompt}
                </h3>
                {isEditing && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingPromptId(profileData.prompts[index]._id);
                        setShowPromptModal(true);
                      }}
                      className="text-sm text-blue-500 hover:text-blue-600"
                    >
                      Change prompt
                    </button>
                    <button
                      onClick={() => onRemoveBlurb(profileData.prompts[index]._id)}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={profileData.prompts[index].response}
                  onChange={(e) => onUpdateBlurb(profileData.prompts[index]._id, e.target.value)}
                  className="w-full text-sm bg-transparent dark:text-zinc-300 focus:outline-none resize-none"
                />
              ) : (
                <p className="text-sm dark:text-zinc-300">
                  {profileData.prompts[index].response}
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      {isEditing && profileData.prompts.length < MAX_PROMPTS && (
        <button
          onClick={() => {
            setEditingPromptId(null);
            setShowPromptModal(true);
          }}
          className="w-full p-4 text-sm font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          + Add another prompt
        </button>
      )}

      {showPromptModal && (
        <PromptModal
          isOpen={showPromptModal}
          onClose={() => {
            setShowPromptModal(false);
            setEditingPromptId(null);
          }}
          onAdd={(prompt) => onPromptAction(editingPromptId, prompt)}
          editingPromptId={editingPromptId}
        />
      )}
    </div>
  );
}