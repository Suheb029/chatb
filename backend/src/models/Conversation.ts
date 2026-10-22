import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  _id: any;
  contactId: string;
  status: 'open' | 'pending' | 'resolved';
  assignedAgent: string;
  lastMessageText: string;
  lastMessageTimestamp: Date;
  unreadCount: number;
  internalNotes: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    _id: { type: String },
    contactId: { type: String, required: true },
    status: { type: String, enum: ['open', 'pending', 'resolved'], default: 'open' },
    assignedAgent: { type: String, default: 'Chatbot' },
    lastMessageText: { type: String, default: '' },
    lastMessageTimestamp: { type: Date, default: Date.now },
    unreadCount: { type: Number, default: 0 },
    internalNotes: { type: String, default: '' },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
