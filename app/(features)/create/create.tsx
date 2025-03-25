// app/(features)/create/create.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Upload,
  Link,
  Loader2,
  X,
  Eye,
  Users,
  Timer,
  UserMinus,
  UserPlus,
  Globe,
  UserCircle2,
  Users2,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import type { FeedItem, EventLocation } from "@/lib/types";
import { FeedCard } from "@/components/shared/feed-card";
import { format } from "date-fns";
import { usePlan } from "@/contexts/PlanContext";

type PlanType = "scheduled" | "live" | "upload";
type Visibility = "friends" | "mutuals" | "community";

interface FormData {
  title: string;
  description: string;
  location: EventLocation;
  datetime?: string;
  attendeeCount?: number;
  duration?: number;
  hasAttendeeLimit: boolean;
  visibility: Visibility;
}

interface UploadData {
  media?: File;
  eventURL?: string;
  processedData?: {
    title: string;
    description: string;
    location: EventLocation;
    datetime?: string;
  };
}

interface FormErrors {
  [key: string]: string;
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function Create() {
  const router = useRouter();
  const { createPlan, processUpload } = usePlan();
  const { showToast } = useToast();

  // Form States
  const [planType, setPlanType] = useState<PlanType>("scheduled");
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    location: { name: "" },
    hasAttendeeLimit: true,
    visibility: "friends",
  });
  const [uploadData, setUploadData] = useState<UploadData>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploadProcessed, setIsUploadProcessed] = useState(false);

  const visibilityOptions = [
    {
      value: "friends" as const,
      label: "Friends",
      icon: UserCircle2,
      description: "Only your friends can see this",
    },
    {
      value: "mutuals" as const,
      label: "Mutuals",
      icon: Users2,
      description: "Friends and mutual connections",
    },
    {
      value: "community" as const,
      label: "Community",
      icon: Globe,
      description: "Anyone can see this",
    },
  ];

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return format(date, "EEEE, MMMM d 'at' h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  const getPosterConnection = (
    visibility: Visibility
  ): "1st" | "2nd" | "3rd" => {
    switch (visibility) {
      case "friends":
        return "1st";
      case "mutuals":
        return "2nd";
      case "community":
        return "3rd";
    }
  };

  const generatePreviewData = (): FeedItem => {
    let totalSpots: number = 0;

    if (formData.hasAttendeeLimit) {
      totalSpots = formData.attendeeCount || 0;
    } else {
      totalSpots = 999;
    }

    return {
      id: Date.now(),
      type: planType === "live" ? "realtime" : "scheduled",
      poster: {
        name: "You",
        connection: getPosterConnection(formData.visibility),
      },
      event: {
        title: formData.title,
        description: formData.description,
        location: formData.location.name,
        time: formatDateTime(formData.datetime),
        startTime: planType === "live" ? Date.now() : undefined,
        duration: planType === "live" ? Number(formData.duration) : undefined,
        currentInterested: 0,
        openInvite: !formData.hasAttendeeLimit,
        totalSpots,
        participants: [],
      },
    };
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.location.name) {
      newErrors.location = "Location is required";
    }

    switch (planType) {
      case "scheduled":
        if (!formData.datetime) {
          newErrors.datetime = "Date and time are required";
        }
        if (
          formData.hasAttendeeLimit &&
          (!formData.attendeeCount || formData.attendeeCount < 1)
        ) {
          newErrors.attendeeCount = "Number of attendees must be at least 1";
        }
        break;
      case "live":
        if (!formData.duration || formData.duration < 1) {
          newErrors.duration = "Duration is required";
        }
        break;
      case "upload":
        if (!isUploadProcessed) {
          newErrors.upload = "Please process an image or URL first";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlanTypeChange = (type: PlanType) => {
    setPlanType(type);
    setFormData({
      title: "",
      description: "",
      location: { name: "" },
      hasAttendeeLimit: true,
      visibility: "friends",
    });
    setUploadData({});
    setIsUploadProcessed(false);
    setPreview(null);
    setErrors({});
  };

  const handleUploadProcess = async (
    type: "url" | "image",
    value: string | File
  ) => {
    try {
      setIsProcessing(true);
      setErrors({});
  
      const processedData = await processUpload(value, type);
  
      if (processedData) {
        setUploadData((prev) => ({
          ...prev,
          processedData: {
            title: processedData.title,
            description: processedData.description,
            location: processedData.location,
            datetime: processedData.datetime
          },
          [type === "url" ? "eventURL" : "media"]: value,
        }));
  
        setFormData((prev) => ({
          ...prev,
          title: processedData.title || "",
          description: processedData.description || "",
          location: processedData.location || { name: "" },
          datetime: processedData.datetime,
          hasAttendeeLimit: true,
        }));
  
        setIsUploadProcessed(true);
        showToast("Upload processed successfully!");
      }
    } catch (error) {
      showToast("Failed to process upload");
      setErrors({ upload: "Failed to process upload. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsProcessing(true);

      const planData = {
        type: planType === "live" ? "realtime" : "scheduled",
        event: {
          title: formData.title,
          description: formData.description || "",
          location: {
            name: formData.location.name,
            coordinates: formData.location.coordinates,
          },
          time: formData.datetime,
          startTime: planType === "live" ? Date.now() : undefined,
          duration: planType === "live" ? Number(formData.duration) : undefined,
          totalSpots: formData.hasAttendeeLimit
            ? formData.attendeeCount || 0
            : 999,
          openInvite: !formData.hasAttendeeLimit,
          participants: [],
        },
        visibility: formData.visibility,
        media: uploadData.media
          ? {
              url: preview,
              processedData: uploadData.processedData,
            }
          : undefined,
      };

      await createPlan(planData);
      showToast("Plan created successfully!");
      router.push("/feed");
    } catch (error) {
      console.error("Error creating plan:", error);
      showToast("Failed to create plan");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderVisibilitySelector = () => (
    <div className="space-y-4 my-6">
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Who can see this?
      </h3>
      <div className="space-y-2">
        {visibilityOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, visibility: option.value }))
              }
              className={`
                w-full flex items-center gap-3 p-3 rounded-lg transition-colors
                ${
                  formData.visibility === option.value
                    ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-500"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent"
                }
              `}
            >
              <Icon
                className={`w-5 h-5 ${
                  formData.visibility === option.value
                    ? "text-blue-500"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              />
              <div className="flex-1 text-left">
                <p
                  className={`font-medium ${
                    formData.visibility === option.value
                      ? "text-blue-500"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {option.label}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderParticipantControl = () => {
    if (planType === "live") return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Participant Limit
          </span>
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                hasAttendeeLimit: !prev.hasAttendeeLimit,
              }))
            }
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            {formData.hasAttendeeLimit ? (
              <>
                <UserMinus className="w-4 h-4" />
                <span className="text-sm">Remove Limit</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span className="text-sm">Add Limit</span>
              </>
            )}
          </button>
        </div>

        {formData.hasAttendeeLimit && (
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <input
              type="number"
              placeholder="Number of attendees needed"
              className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-black dark:text-white"
              value={formData.attendeeCount || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  attendeeCount: parseInt(e.target.value),
                }))
              }
            />
          </div>
        )}
      </div>
    );
  };

  const renderForm = () => {
    if (planType === "upload" && !isUploadProcessed) {
      return (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              <input
                type="url"
                placeholder="Event URL"
                className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-black dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400"
                value={uploadData.eventURL || ""}
                onChange={(e) =>
                  setUploadData((prev) => ({
                    ...prev,
                    eventURL: e.target.value,
                  }))
                }
              />
              <button
                type="button"
                onClick={() =>
                  uploadData.eventURL &&
                  handleUploadProcess("url", uploadData.eventURL)
                }
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                disabled={!uploadData.eventURL}
              >
                Process URL
              </button>
            </div>

            <div className="relative">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                <input
                  type="file"
                  accept="image/*"
                  className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-zinc-600 dark:text-zinc-400"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    handleUploadProcess("image", e.target.files[0])
                  }
                />
              </div>

              {preview && (
                <div className="mt-4 relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setPreview(null);
                      setUploadData((prev) => ({ ...prev, media: undefined }));
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          {isProcessing && (
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Processing upload...
              </span>
            </div>
          )}

          {errors.upload && <Alert message={errors.upload} />}
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Common Fields */}
          <input
            type="text"
            placeholder="Title"
            className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-black dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
          />

          <textarea
            placeholder="Description (optional)"
            className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg min-h-[100px] text-black dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
          />

          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <input
              type="text"
              placeholder="Location"
              className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-black dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400"
              value={formData.location.name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  location: { ...prev.location, name: e.target.value },
                }))
              }
            />
          </div>

          {/* Type-specific Fields */}
          {planType === "scheduled" && (
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              <input
                type="datetime-local"
                className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-black dark:text-white"
                value={formData.datetime || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, datetime: e.target.value }))
                }
              />
            </div>
          )}

          {planType === "live" && (
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              <input
                type="number"
                placeholder="Duration (in hours)"
                className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-black dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400"
                value={formData.duration || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    duration: parseInt(e.target.value),
                  }))
                }
              />
            </div>
          )}

          {/* Participant Control */}
          {(planType === "scheduled" ||
            (planType === "upload" && isUploadProcessed)) &&
            renderParticipantControl()}

          {/* Visibility Selector */}
          {renderVisibilitySelector()}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full px-4 py-3 bg-gradient-to-r from-indigo-400 to-sky-400 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Posting...</span>
            </div>
          ) : (
            "Post Plan"
          )}
        </button>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
            Create a Plan
          </h1>
          {(planType !== "upload" || isUploadProcessed) && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm">Preview</span>
            </button>
          )}
        </div>

        {/* Plan Type Selection */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={() => handlePlanTypeChange("scheduled")}
            className={`p-3 rounded-xl border transition-colors ${
              planType === "scheduled"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-zinc-200 dark:border-zinc-800 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
            }`}
          >
            <Calendar
              className={`w-6 h-6 mx-auto ${
                planType === "scheduled"
                  ? "text-blue-500"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            />
            <span
              className={`text-xs mt-1 block text-center font-medium ${
                planType === "scheduled"
                  ? "text-blue-500"
                  : "text-zinc-600 dark:text-zinc-300"
              }`}
            >
              Scheduled
            </span>
          </button>

          <button
            onClick={() => handlePlanTypeChange("live")}
            className={`p-3 rounded-xl border transition-colors ${
              planType === "live"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-zinc-200 dark:border-zinc-800 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
            }`}
          >
            <Clock
              className={`w-6 h-6 mx-auto ${
                planType === "live"
                  ? "text-blue-500"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            />
            <span
              className={`text-xs mt-1 block text-center font-medium ${
                planType === "live"
                  ? "text-blue-500"
                  : "text-zinc-600 dark:text-zinc-300"
              }`}
            >
              Live
            </span>
          </button>

          <button
            onClick={() => handlePlanTypeChange("upload")}
            className={`p-3 rounded-xl border transition-colors ${
              planType === "upload"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-zinc-200 dark:border-zinc-800 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
            }`}
          >
            <Upload
              className={`w-6 h-6 mx-auto ${
                planType === "upload"
                  ? "text-blue-500"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            />
            <span
              className={`text-xs mt-1 block text-center font-medium ${
                planType === "upload"
                  ? "text-blue-500"
                  : "text-zinc-600 dark:text-zinc-300"
              }`}
            >
              Upload
            </span>
          </button>
        </div>

        {/* Preview Card */}
        {showPreview && (
          <div className="mb-6">
            <FeedCard
              item={generatePreviewData()}
              onInterestToggle={() => {}}
              onRepostToggle={() => {}}
              onDelete={() => {}}
              isInterested={false}
              isReposted={false}
            />
          </div>
        )}

        {/* Form */}
        {renderForm()}
      </div>
    </div>
  );
}
