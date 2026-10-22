import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  value?: string;
}

export interface IMessageTemplate extends Document {
  _id: any;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  headerType: 'NONE' | 'TEXT' | 'IMAGE' | 'DOCUMENT';
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttons: ITemplateButton[];
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  metaTemplateId?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateButtonSchema = new Schema<ITemplateButton>(
  {
    type: { type: String, enum: ['QUICK_REPLY', 'URL', 'PHONE_NUMBER'], required: true },
    text: { type: String, required: true },
    value: { type: String, default: '' },
  },
  { _id: false }
);

const MessageTemplateSchema = new Schema<IMessageTemplate>(
  {
    _id: { type: String },
    name: { type: String, required: true, trim: true, unique: true },
    category: { type: String, enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'], default: 'UTILITY' },
    language: { type: String, default: 'en_US' },
    headerType: { type: String, enum: ['NONE', 'TEXT', 'IMAGE', 'DOCUMENT'], default: 'NONE' },
    headerText: { type: String, default: '' },
    bodyText: { type: String, required: true },
    footerText: { type: String, default: '' },
    buttons: { type: [TemplateButtonSchema], default: [] },
    status: { type: String, enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
    metaTemplateId: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

export const MessageTemplate = mongoose.models.MessageTemplate || mongoose.model<IMessageTemplate>('MessageTemplate', MessageTemplateSchema);
