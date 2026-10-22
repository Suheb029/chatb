import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaign extends Document {
  _id: any;
  name: string;
  templateId: string;
  targetTags: string[];
  status: 'draft' | 'scheduled' | 'running' | 'completed';
  totalAudience: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    _id: { type: String },
    name: { type: String, required: true },
    templateId: { type: String, required: true },
    targetTags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'scheduled', 'running', 'completed'], default: 'completed' },
    totalAudience: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    readCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    scheduledAt: { type: Date },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Campaign = mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
