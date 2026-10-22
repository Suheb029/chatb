import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  _id: any;
  conversationId: string;
  contactId: string;
  sender: 'customer' | 'bot' | 'agent';
  text: string;
  messageType: 'text' | 'image' | 'document' | 'template' | 'system' | 'interactive' | 'button' | 'audio' | 'video' | 'location';
  mediaUrl?: string;
  fileName?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  metadata?: any;
}

const MessageSchema = new Schema<IMessage>(
  {
    _id: { type: String },
    conversationId: { type: String, required: true },
    contactId: { type: String, required: true },
    sender: { type: String, enum: ['customer', 'bot', 'agent'], required: true },
    text: { type: String, required: true },
    messageType: {
      type: String,
      enum: ['text', 'image', 'document', 'template', 'system', 'interactive', 'button', 'audio', 'video', 'location'],
      default: 'text',
    },
    mediaUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    status: { type: String, enum: ['sent', 'delivered', 'read', 'failed'], default: 'delivered' },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
