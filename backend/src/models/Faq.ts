import mongoose, { Document, Schema } from 'mongoose';

export interface IFaq extends Document {
  _id: any;
  question: string;
  answer: string;
  category: 'General' | 'Pricing' | 'Products' | 'Shipping' | 'Refunds' | 'Support';
  isActive: boolean;
  order: number;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const FaqSchema = new Schema<IFaq>(
  {
    _id: { type: String },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    category: {
      type: String,
      enum: ['General', 'Pricing', 'Products', 'Shipping', 'Refunds', 'Support'],
      default: 'General',
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    triggerCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Faq = mongoose.models.Faq || mongoose.model<IFaq>('Faq', FaqSchema);
