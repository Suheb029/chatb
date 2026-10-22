import mongoose, { Document, Schema } from 'mongoose';

export interface IAutoReplyRule extends Document {
  _id: any;
  name: string;
  keywords: string[];
  matchType: 'contains' | 'exact' | 'starts_with' | 'regex';
  responseMessage: string;
  isActive: boolean;
  priority: number;
  triggerCount: number;
  category: string;
  actionType: 'reply' | 'handoff' | 'send_media';
  mediaUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AutoReplyRuleSchema = new Schema<IAutoReplyRule>(
  {
    _id: { type: String },
    name: { type: String, required: true },
    keywords: { type: [String], required: true },
    matchType: { type: String, enum: ['contains', 'exact', 'starts_with', 'regex'], default: 'contains' },
    responseMessage: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    triggerCount: { type: Number, default: 0 },
    category: { type: String, default: 'General' },
    actionType: { type: String, enum: ['reply', 'handoff', 'send_media'], default: 'reply' },
    mediaUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const AutoReplyRule = mongoose.models.AutoReplyRule || mongoose.model<IAutoReplyRule>('AutoReplyRule', AutoReplyRuleSchema);
