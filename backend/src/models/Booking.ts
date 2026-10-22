import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  _id: any;
  bookingReference: string; // e.g. "BK-84920"
  conversationId: string;
  contactId: string;
  customerName: string;
  customerContact: {
    phoneNumber: string;
    email?: string;
  };
  itemId: string;
  itemName: string;
  itemType: 'Service' | 'Package' | 'Plan' | 'Product';
  requirements: Record<string, any>; // answers to followUpQuestions
  preferredDateTime?: string;
  estimatedPrice: string;
  status: 'pending_review' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  confirmedAt?: Date;
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    _id: { type: String },
    bookingReference: { type: String, required: true, unique: true },
    conversationId: { type: String, required: true },
    contactId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerContact: {
      phoneNumber: { type: String, required: true },
      email: { type: String, default: '' },
    },
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    itemType: { type: String, default: 'Service' },
    requirements: { type: Schema.Types.Mixed, default: {} },
    preferredDateTime: { type: String, default: '' },
    estimatedPrice: { type: String, default: 'Quote on Request' },
    status: {
      type: String,
      enum: ['pending_review', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'confirmed',
    },
    confirmedAt: { type: Date, default: Date.now },
    internalNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Booking =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
