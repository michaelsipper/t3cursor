// models/Connection.ts

import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IConnection extends Document {
  requester: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

const ConnectionSchema = new Schema<IConnection>({
  requester: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Compound index to ensure unique connections and efficient queries
ConnectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });
// Index for status queries
ConnectionSchema.index({ status: 1 });
// Index for finding user's connections
ConnectionSchema.index({ requester: 1, status: 1 });
ConnectionSchema.index({ recipient: 1, status: 1 });

export const Connection = models.Connection || model<IConnection>('Connection', ConnectionSchema);