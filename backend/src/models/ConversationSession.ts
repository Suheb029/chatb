import mongoose, { Document, Schema } from 'mongoose';

export type ConversationState =
  | 'MAIN_MENU'
  | 'SELECTING_CATEGORY'
  | 'VIEWING_CATALOG'
  | 'SELECTING_ITEM'
  | 'COLLECTING_REQUIREMENTS'
  | 'COLLECTING_CUSTOMER_NAME'
  | 'COLLECTING_CONTACT_DETAILS'
  | 'COLLECTING_DATE_TIME'
  | 'COLLECTING_ADDRESS_IF_REQUIRED'
  | 'REVIEWING_REQUEST'
  | 'AWAITING_CONFIRMATION'
  | 'BOOKING_CONFIRMED'
  | 'ORDER_CONFIRMED'
  | 'TRACKING_INPUT'
  | 'HUMAN_HANDOFF';

export interface IConversationSession extends Document {
  _id: any;
  conversationId: string;
  contactId: string;
  state: ConversationState;
  draftType: 'booking' | 'order' | 'enquiry' | 'none';
  selectedCategory?: string;
  selectedItemId?: string;
  selectedItemName?: string;
  currentQuestionIndex: number;
  collectedAnswers: Record<string, any>;
  quantity: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  preferredDateTime?: string;
  fulfilmentAddress?: string;
  historyStates: ConversationState[];
  isHandoffActive: boolean;
  activeReference?: string;
  lastInteractionAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSessionSchema = new Schema<IConversationSession>(
  {
    _id: { type: String },
    conversationId: { type: String, required: true, unique: true },
    contactId: { type: String, required: true },
    state: { type: String, default: 'MAIN_MENU' },
    draftType: { type: String, enum: ['booking', 'order', 'enquiry', 'none'], default: 'none' },
    selectedCategory: { type: String, default: '' },
    selectedItemId: { type: String, default: '' },
    selectedItemName: { type: String, default: '' },
    currentQuestionIndex: { type: Number, default: 0 },
    collectedAnswers: { type: Schema.Types.Mixed, default: {} },
    quantity: { type: Number, default: 1 },
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    preferredDateTime: { type: String, default: '' },
    fulfilmentAddress: { type: String, default: '' },
    historyStates: { type: [String], default: [] },
    isHandoffActive: { type: Boolean, default: false },
    activeReference: { type: String, default: '' },
    lastInteractionAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ConversationSession =
  mongoose.models.ConversationSession ||
  mongoose.model<IConversationSession>('ConversationSession', ConversationSessionSchema);
