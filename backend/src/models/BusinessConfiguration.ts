import mongoose, { Document, Schema } from 'mongoose';

export interface IMenuOption {
  id: string;
  label: string;
  action: string;
  description?: string;
  isEnabled: boolean;
  order: number;
}

export interface IBusinessConfiguration extends Document {
  _id: any;
  businessName: string;
  businessType: 'Services' | 'Products' | 'Hybrid';
  tagline: string;
  currency: string;
  welcomeGreeting: string;
  welcomePrompt: string;
  menuOptions: IMenuOption[];
  contactInfo: {
    phone: string;
    email: string;
    address: string;
    website: string;
  };
  appointmentSlots: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MenuOptionSchema = new Schema<IMenuOption>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    action: { type: String, required: true },
    description: { type: String, default: '' },
    isEnabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const BusinessConfigurationSchema = new Schema<IBusinessConfiguration>(
  {
    _id: { type: String, default: 'biz_config_default' },
    businessName: { type: String, default: 'Apex Innovations & Tech Labs' },
    businessType: { type: String, enum: ['Services', 'Products', 'Hybrid'], default: 'Hybrid' },
    tagline: { type: String, default: 'Premier Enterprise IT Services & Hardware Solutions' },
    currency: { type: String, default: '₹' },
    welcomeGreeting: {
      type: String,
      default: 'Hello! 👋 Welcome to Apex Innovations & Tech Labs.',
    },
    welcomePrompt: {
      type: String,
      default: 'How can we help you today? Please choose from the options below:',
    },
    menuOptions: {
      type: [MenuOptionSchema],
      default: [
        { id: 'opt_1', label: 'Our Services', action: 'VIEW_SERVICES', description: 'Explore bespoke digital & technical services', isEnabled: true, order: 1 },
        { id: 'opt_2', label: 'View Catalog', action: 'VIEW_CATALOG', description: 'Browse all products, packages and plans', isEnabled: true, order: 2 },
        { id: 'opt_3', label: 'Book an Appointment', action: 'BOOK_APPOINTMENT', description: 'Schedule a discovery consultation call', isEnabled: true, order: 3 },
        { id: 'opt_4', label: 'Product/Service Enquiry', action: 'ENQUIRY', description: 'Ask questions about custom specifications', isEnabled: true, order: 4 },
        { id: 'opt_5', label: 'Track My Booking', action: 'TRACK_BOOKING', description: 'Check status of your order or booking reference', isEnabled: true, order: 5 },
        { id: 'opt_6', label: 'Talk to an Agent', action: 'TALK_TO_AGENT', description: 'Connect with a live customer specialist', isEnabled: true, order: 6 },
      ],
    },
    contactInfo: {
      phone: { type: String, default: '+91 98765 43210' },
      email: { type: String, default: 'support@apexinnovations.in' },
      address: { type: String, default: 'Cyber Hub Tech Park, Sector 43, Gurugram, India' },
      website: { type: String, default: 'https://apexinnovations.in' },
    },
    appointmentSlots: {
      type: [String],
      default: ['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'],
    },
  },
  { timestamps: true }
);

export const BusinessConfiguration =
  mongoose.models.BusinessConfiguration ||
  mongoose.model<IBusinessConfiguration>('BusinessConfiguration', BusinessConfigurationSchema);
