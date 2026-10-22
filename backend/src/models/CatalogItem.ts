import mongoose, { Document, Schema } from 'mongoose';

export interface IFollowUpQuestion {
  id: string;
  question: string;
  type: 'text' | 'options' | 'number';
  options?: string[];
  placeholder?: string;
  required: boolean;
}

export interface ICatalogItem extends Document {
  _id: any;
  name: string;
  description: string;
  image: string;
  category: string;
  itemType: 'Product' | 'Service' | 'Package' | 'Plan';
  price: number;
  priceType: 'fixed' | 'starting_at' | 'quote_required';
  duration?: string; // e.g. "2-3 weeks", "45 mins"
  availability: 'available' | 'in_stock' | 'limited' | 'by_appointment' | 'out_of_stock';
  requiresDateTime: boolean;
  requiresAddress: boolean;
  followUpQuestions: IFollowUpQuestion[];
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpQuestionSchema = new Schema<IFollowUpQuestion>(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    type: { type: String, enum: ['text', 'options', 'number'], default: 'text' },
    options: { type: [String], default: [] },
    placeholder: { type: String, default: '' },
    required: { type: Boolean, default: true },
  },
  { _id: false }
);

const CatalogItemSchema = new Schema<ICatalogItem>(
  {
    _id: { type: String },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    image: { type: String, default: '' },
    category: { type: String, required: true },
    itemType: {
      type: String,
      enum: ['Product', 'Service', 'Package', 'Plan'],
      default: 'Service',
    },
    price: { type: Number, default: 0 },
    priceType: {
      type: String,
      enum: ['fixed', 'starting_at', 'quote_required'],
      default: 'starting_at',
    },
    duration: { type: String, default: '' },
    availability: {
      type: String,
      enum: ['available', 'in_stock', 'limited', 'by_appointment', 'out_of_stock'],
      default: 'available',
    },
    requiresDateTime: { type: Boolean, default: false },
    requiresAddress: { type: Boolean, default: false },
    followUpQuestions: { type: [FollowUpQuestionSchema], default: [] },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const CatalogItem =
  mongoose.models.CatalogItem || mongoose.model<ICatalogItem>('CatalogItem', CatalogItemSchema);
