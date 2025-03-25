// models/User.ts
import mongoose, { Schema, model, models, Document } from "mongoose";
import { MAX_PHOTOS, MAX_PROMPTS, DEFAULT_STATUS_OPTIONS } from '@/lib/constants';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  age?: number;
  location?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  photos: Array<{
    _id: mongoose.Types.ObjectId;
    url: string | null;
    publicId: string | null;
    order: number;
    region: string;
  }>;
  prompts: Array<{
    _id: mongoose.Types.ObjectId;
    prompt: string;
    response: string;
  }>;
  reliabilityScore: number;
  friends: mongoose.Types.ObjectId[];
  emailVerified: boolean;
  phoneVerified: boolean;
  phoneNumber?: string;
  universityEmail?: string;
  university?: string;
  status: typeof DEFAULT_STATUS_OPTIONS[number];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  age: { type: Number },
  location: { type: String },
  bio: { type: String, default: "" },
  avatarUrl: { type: String },
  bannerUrl: { type: String },
  photos: {
    type: [{
      _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      order: { type: Number, required: true },
      region: { type: String, required: true }
    }],
    default: () => Array.from({ length: MAX_PHOTOS }, (_, i) => ({
      _id: new mongoose.Types.ObjectId(),
      url: null,
      publicId: null,
      order: i,
      region: i === 0 ? 'main' : i <= 2 ? 'secondary' : 'tertiary'
    })),
    validate: [
      (val: any[]) => val.length <= MAX_PHOTOS,
      `Photos cannot exceed ${MAX_PHOTOS}`
    ]
  },
  prompts: {
    type: [{
      _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      prompt: { type: String, default: "" },
      response: { type: String, default: "" }
    }],
    default: [],
    validate: [
      (val: any[]) => val.length <= MAX_PROMPTS,
      `Prompts cannot exceed ${MAX_PROMPTS}`
    ]
  },
  reliabilityScore: { 
    type: Number, 
    default: 100,
    min: 0,
    max: 100
  },
  friends: [{ 
    type: Schema.Types.ObjectId, 
    ref: "User" 
  }],
  emailVerified: { 
    type: Boolean, 
    default: false 
  },
  phoneVerified: { 
    type: Boolean, 
    default: false 
  },
  phoneNumber: String,
  universityEmail: String,
  university: String,
  status: { 
    type: String, 
    enum: DEFAULT_STATUS_OPTIONS,
    default: "Down to hangout"
  }
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Add indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ university: 1 });

// Pre-save middleware for validation and cleanup
UserSchema.pre('save', function(next) {
  const user = this;
  
  // Initialize photos if empty
  if (!user.photos?.length) {
    user.photos = Array.from({ length: MAX_PHOTOS }, (_, i) => ({
      _id: new mongoose.Types.ObjectId(),
      url: null,
      publicId: null,
      order: i,
      region: i === 0 ? 'main' : i <= 2 ? 'secondary' : 'tertiary'
    }));
  }

  // Ensure prompts don't exceed MAX_PROMPTS
  if (user.prompts?.length > MAX_PROMPTS) {
    user.prompts = user.prompts.slice(0, MAX_PROMPTS);
  }

  next();
});

const User = models.User || model<IUser>("User", UserSchema);
export default User;