// models/Notification.ts

import mongoose, { Schema, model, models, Document } from "mongoose";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  type: 'plan_interest' | 'friend_request' | 'like' | 'comment' | 'follow' | 'plan_accepted' | 'message';
  read: boolean;
  planId?: mongoose.Types.ObjectId;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['plan_interest', 'friend_request', 'like', 'comment', 'follow', 'plan_accepted', 'message'],
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  planId: {
    type: Schema.Types.ObjectId,
    ref: 'Plan'
  },
  message: String
}, {
  timestamps: true
});

// Indexes for efficient querying
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, type: 1 });

export const Notification = models.Notification || model<INotification>('Notification', NotificationSchema);