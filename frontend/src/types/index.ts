export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent';
  avatar?: string;
}

export interface Contact {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  tags: string[];
  status: 'active' | 'archived' | 'blocked';
  notes?: string;
  avatar?: string;
  lastInteractionAt: string;
  unreadCount: number;
  assignedAgent?: string;
}

export interface Conversation {
  _id: string;
  contactId: string | Contact;
  status: 'open' | 'pending' | 'resolved';
  assignedAgent: string;
  lastMessageText: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  internalNotes: string;
  tags: string[];
  contact?: Contact;
}

export interface Message {
  _id: string;
  conversationId: string;
  contactId: string;
  sender: 'customer' | 'bot' | 'agent';
  text: string;
  messageType: 'text' | 'image' | 'document' | 'template' | 'system';
  mediaUrl?: string;
  fileName?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  metadata?: {
    matchedRule?: string;
    waMessageId?: string;
    templateName?: string;
    isSimulated?: boolean;
    agentName?: string;
    action?: string;
    options?: string[];
    state?: string;
    referenceNumber?: string;
  };
}

export interface AutoReplyRule {
  _id: string;
  name: string;
  keywords: string[];
  matchType: 'contains' | 'exact' | 'starts_with' | 'regex';
  responseMessage: string;
  isActive: boolean;
  priority: number;
  triggerCount: number;
  category: string;
  actionType: 'reply' | 'handoff' | 'send_media';
  mediaUrl?: string;
  createdAt?: string;
}

export interface Faq {
  _id: string;
  question: string;
  answer: string;
  category: 'General' | 'Pricing' | 'Products' | 'Shipping' | 'Refunds' | 'Support';
  isActive: boolean;
  order: number;
  triggerCount: number;
  createdAt?: string;
}

export interface BotSettings {
  _id?: string;
  isEnabled: boolean;
  botName: string;
  welcomeMessage: string;
  fallbackMessage: string;
  businessHoursEnabled: boolean;
  businessHours: {
    start: string;
    end: string;
    timezone: string;
    workDays: number[];
  };
  afterHoursMessage: string;
  handoffEnabled: boolean;
  handoffKeywords: string[];
  handoffMessage: string;
  confidenceThreshold: number;
  responseDelaySeconds: number;
}

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  value?: string;
}

export interface MessageTemplate {
  _id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  headerType: 'NONE' | 'TEXT' | 'IMAGE' | 'DOCUMENT';
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttons: TemplateButton[];
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  metaTemplateId?: string;
  rejectionReason?: string;
  createdAt?: string;
}

export interface Campaign {
  _id: string;
  name: string;
  templateId: string;
  targetTags: string[];
  status: 'draft' | 'scheduled' | 'running' | 'completed';
  totalAudience: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt?: string;
}

export interface ApiSettings {
  mode: 'demo' | 'live';
  wabaId: string;
  phoneNumberId: string;
  accessTokenMasked: string;
  hasAccessToken: boolean;
  webhookVerifyToken: string;
  webhookCallbackUrl: string;
  isConnected: boolean;
  lastTestedAt?: string;
  metaVersion: string;
  providerStatus: {
    name: string;
    mode: 'demo' | 'live';
    isReady: boolean;
    description: string;
  };
}

export interface DashboardStats {
  totalConversations: number;
  messagesReceived: number;
  messagesSent: number;
  activeContacts: number;
  automatedReplies: number;
  chatbotResponseRate: number;
  avgResponseTime: string;
  resolutionRate: string;
}

export interface DashboardOverview {
  isDemo: boolean;
  stats: DashboardStats;
  charts: {
    dailyVolume: Array<{ day: string; incoming: number; outgoing: number; automated: number }>;
    replyDistribution: Array<{ name: string; value: number; color: string }>;
    statusCounts: { open: number; pending: number; resolved: number };
    categories: Array<{ name: string; count: number; percentage: number }>;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    type: 'bot' | 'agent' | 'faq' | 'campaign';
  }>;
}

export interface BusinessMenuOption {
  id: string;
  label: string;
  action: string;
  enabled: boolean;
}

export interface BusinessConfiguration {
  _id?: string;
  businessName: string;
  businessType: 'Services' | 'Products' | 'Hybrid';
  tagline: string;
  welcomeMessage: string;
  menuOptions: BusinessMenuOption[];
  currency: string;
  appointmentSettings: {
    enabled: boolean;
    slotDurationMinutes: number;
    availableDays: string[];
    availableHours: string;
    advanceBookingDays: number;
  };
  contactInfo: {
    phone: string;
    email: string;
    address: string;
    supportHours: string;
  };
  updatedAt?: string;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  key: string;
  type: 'text' | 'options' | 'number';
  options?: string[];
  required: boolean;
}

export interface CatalogItem {
  _id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  price: number;
  pricingType: 'fixed' | 'starting_at' | 'quote_required';
  estimatedDuration?: string;
  itemType: 'product' | 'service' | 'package' | 'plan';
  isActive: boolean;
  requiresFulfilmentAddress?: boolean;
  followUpQuestions?: FollowUpQuestion[];
  createdAt?: string;
}

export interface Booking {
  _id: string;
  bookingReference: string;
  conversationId: string;
  contactId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId?: string;
  serviceName: string;
  itemType: 'service' | 'package' | 'plan';
  customerRequirements: Record<string, string>;
  preferredDateTime?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  price: number;
  currency: string;
  notes?: string;
  confirmedAt?: string;
  createdAt: string;
}

export interface Order {
  _id: string;
  orderReference: string;
  conversationId: string;
  contactId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  fulfilmentAddress?: string;
  customerNotes?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  confirmedAt?: string;
  createdAt: string;
}

export interface ConversationSession {
  _id?: string;
  conversationId: string;
  contactId: string;
  state: string;
  selectedItemId?: string;
  selectedItemType?: 'product' | 'service' | 'package' | 'plan';
  customerDraft: {
    customerName?: string;
    contactPhone?: string;
    customerEmail?: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    serviceRequirements?: Record<string, string>;
    preferredDateTime?: string;
    fulfilmentAddress?: string;
    notes?: string;
  };
  currentQuestionIndex: number;
  isHandoffActive: boolean;
  history: string[];
}

