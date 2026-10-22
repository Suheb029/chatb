import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
  _id: any;
  name: string;
  phoneNumber: string;
  email?: string;
  tags: string[];
  status: 'active' | 'archived' | 'blocked';
  notes?: string;
  avatar?: string;
  lastInteractionAt: Date;
  unreadCount: number;
  assignedAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    _id: { type: String },
    name: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, default: '' },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'archived', 'blocked'], default: 'active' },
    notes: { type: String, default: '' },
    avatar: { type: String, default: '' },
    lastInteractionAt: { type: Date, default: Date.now },
    unreadCount: { type: Number, default: 0 },
    assignedAgent: { type: String, default: 'Bot' },
  },
  { timestamps: true }
);

export const Contact = mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);
