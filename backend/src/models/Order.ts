import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  _id: any;
  orderReference: string; // e.g. "ORD-73912"
  conversationId: string;
  contactId: string;
  customerName: string;
  customerContact: {
    phoneNumber: string;
    email?: string;
  };
  itemId: string;
  itemName: string;
  itemType: 'Product' | 'Package' | 'Plan';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  fulfilmentDetails: {
    deliveryAddress?: string;
    city?: string;
    notes?: string;
  };
  status: 'pending_payment' | 'confirmed' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    _id: { type: String },
    orderReference: { type: String, required: true, unique: true },
    conversationId: { type: String, required: true },
    contactId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerContact: {
      phoneNumber: { type: String, required: true },
      email: { type: String, default: '' },
    },
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    itemType: { type: String, default: 'Product' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    currency: { type: String, default: '₹' },
    fulfilmentDetails: {
      deliveryAddress: { type: String, default: '' },
      city: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'],
      default: 'confirmed',
    },
    confirmedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Order =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
