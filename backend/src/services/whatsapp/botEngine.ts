import { AutoReplyRule } from '../../models/AutoReplyRule.js';
import { BotSettings } from '../../models/BotSettings.js';
import { Faq } from '../../models/Faq.js';
import { BusinessConfiguration } from '../../models/BusinessConfiguration.js';
import { CatalogItem, ICatalogItem } from '../../models/CatalogItem.js';
import { Booking } from '../../models/Booking.js';
import { Order } from '../../models/Order.js';
import { ConversationSession, IConversationSession, ConversationState } from '../../models/ConversationSession.js';
import { Conversation } from '../../models/Conversation.js';
import { isDbConnected } from '../../config/db.js';
import { memoryStore } from '../store.js';

export interface IBotDecision {
  action: 'reply' | 'handoff' | 'after_hours' | 'fallback' | 'none';
  responseText?: string;
  matchedRuleName?: string;
  ruleCategory?: string;
  mediaUrl?: string;
  reason?: string;
  state?: ConversationState;
  referenceNumber?: string;
  options?: any[];
}

export interface IConversationContext {
  conversationId: string;
  contactId?: string;
  contactName?: string;
  contactPhone?: string;
}

export class BotEngine {
  /**
   * Helper to check if current time is within business hours
   */
  public static isWithinBusinessHours(hoursConfig: {
    start: string;
    end: string;
    timezone: string;
    workDays: number[];
  }): boolean {
    const now = new Date();
    const currentDay = now.getDay() === 0 ? 7 : now.getDay();
    if (!hoursConfig.workDays.includes(currentDay)) {
      return false;
    }

    const [startH, startM] = hoursConfig.start.split(':').map(Number);
    const [endH, endM] = hoursConfig.end.split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  /**
   * Helper to fetch or initialize a conversation session
   */
  public static async getSession(context: IConversationContext): Promise<IConversationSession | any> {
    const { conversationId, contactId, contactName, contactPhone } = context;

    let session: any = null;
    if (isDbConnected) {
      try {
        session = await ConversationSession.findOne({ conversationId });
      } catch (e) {
        console.warn('[BotEngine] DB session fetch error, checking memoryStore');
      }
    }

    if (!session) {
      session = memoryStore.data.conversationSessions?.find(
        (s: any) => s.conversationId === conversationId
      );
    }

    if (!session) {
      const newSessionData = {
        _id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        conversationId,
        contactId: contactId || 'cnt_unknown',
        state: 'MAIN_MENU' as ConversationState,
        draftType: 'none',
        selectedCategory: '',
        selectedItemId: '',
        selectedItemName: '',
        currentQuestionIndex: 0,
        collectedAnswers: {},
        quantity: 1,
        customerName: contactName || 'Customer',
        customerPhone: contactPhone || '',
        customerEmail: '',
        preferredDateTime: '',
        fulfilmentAddress: '',
        historyStates: [],
        isHandoffActive: false,
        activeReference: '',
        lastInteractionAt: new Date(),
      };

      if (isDbConnected) {
        try {
          session = await ConversationSession.create(newSessionData);
        } catch (e) {
          session = newSessionData;
        }
      } else {
        session = newSessionData;
      }

      if (!memoryStore.data.conversationSessions) {
        memoryStore.data.conversationSessions = [];
      }
      memoryStore.data.conversationSessions.push(session);
    }

    return session;
  }

  /**
   * Helper to update and persist a session
   */
  public static async saveSession(session: any): Promise<void> {
    session.lastInteractionAt = new Date();

    if (isDbConnected && session._id) {
      try {
        await ConversationSession.findOneAndUpdate(
          { conversationId: session.conversationId },
          session,
          { upsert: true }
        );
      } catch (e) {
        console.warn('[BotEngine] Error updating session in MongoDB');
      }
    }

    const idx = memoryStore.data.conversationSessions?.findIndex(
      (s: any) => s.conversationId === session.conversationId
    );
    if (idx !== undefined && idx !== -1) {
      memoryStore.data.conversationSessions[idx] = { ...session };
    } else {
      if (!memoryStore.data.conversationSessions) memoryStore.data.conversationSessions = [];
      memoryStore.data.conversationSessions.push({ ...session });
    }
  }

  /**
   * Helper to fetch active business configuration
   */
  public static async getBusinessConfig(): Promise<any> {
    let config = null;
    if (isDbConnected) {
      try {
        config = await BusinessConfiguration.findOne();
      } catch (e) {}
    }
    if (!config) {
      config = memoryStore.data.businessConfig;
    }
    return config || {
      businessName: 'Apex Innovations & Tech Labs',
      businessType: 'Hybrid',
      currency: '₹',
      welcomeGreeting: 'Hello! 👋 Welcome to Apex Innovations & Tech Labs.',
      welcomePrompt: 'How can we help you today? Please choose from the options below:',
      menuOptions: [
        { id: 'opt_1', label: 'Our Services', action: 'VIEW_SERVICES', isEnabled: true },
        { id: 'opt_2', label: 'View Catalog', action: 'VIEW_CATALOG', isEnabled: true },
        { id: 'opt_3', label: 'Book an Appointment', action: 'BOOK_APPOINTMENT', isEnabled: true },
        { id: 'opt_4', label: 'Product/Service Enquiry', action: 'ENQUIRY', isEnabled: true },
        { id: 'opt_5', label: 'Track My Booking', action: 'TRACK_BOOKING', isEnabled: true },
        { id: 'opt_6', label: 'Talk to an Agent', action: 'TALK_TO_AGENT', isEnabled: true },
      ],
      appointmentSlots: ['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'],
    };
  }

  /**
   * Helper to fetch catalog items
   */
  public static async getCatalogItems(itemTypeFilter?: string): Promise<any[]> {
    let items: any[] = [];
    if (isDbConnected) {
      try {
        const filter: any = { isActive: true };
        if (itemTypeFilter) filter.itemType = itemTypeFilter;
        items = await CatalogItem.find(filter).sort({ order: 1, createdAt: 1 });
      } catch (e) {}
    }
    if (!items || items.length === 0) {
      items = (memoryStore.data.catalogItems || []).filter((i: any) => i.isActive !== false);
      if (itemTypeFilter) {
        items = items.filter((i: any) => i.itemType === itemTypeFilter);
      }
    }
    return items;
  }

  /**
   * Helper to format the Welcome Menu
   */
  public static buildWelcomeMenu(bizConfig: any): string {
    const greeting = bizConfig.welcomeGreeting || `Hello! 👋 Welcome to ${bizConfig.businessName}.`;
    const prompt = bizConfig.welcomePrompt || 'How can we help you today? Please choose an option:';

    const enabledOptions = (bizConfig.menuOptions || []).filter((o: any) => o.isEnabled !== false);
    const optionsText = enabledOptions
      .map((opt: any, idx: number) => {
        const icons = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
        const icon = icons[idx] || `${idx + 1}.`;
        const desc = opt.description ? `\n   _${opt.description}_` : '';
        return `${icon} *${opt.label}*${desc}`;
      })
      .join('\n\n');

    return `${greeting}\n\n${prompt}\n\n${optionsText}\n\n💡 _Reply with the number (e.g. 1) or option name. Type *MENU* anytime, *BACK* to return, or *AGENT* to speak with a human._`;
  }

  /**
   * Helper to generate human handoff response
   */
  public static async triggerHandoff(
    session: any,
    context: IConversationContext,
    reason = 'Customer requested human agent'
  ): Promise<IBotDecision> {
    session.isHandoffActive = true;
    session.state = 'HUMAN_HANDOFF';
    await this.saveSession(session);

    // Update conversation status to pending so human agent inbox highlights it
    if (isDbConnected && context.conversationId) {
      try {
        await Conversation.findByIdAndUpdate(context.conversationId, {
          status: 'pending',
          assignedAgent: 'Unassigned Agent Queue',
        });
      } catch (e) {}
    }

    const conv = memoryStore.data.conversations?.find((c: any) => c._id === context.conversationId);
    if (conv) {
      conv.status = 'pending';
      conv.assignedAgent = 'Unassigned Agent Queue';
    }

    return {
      action: 'handoff',
      responseText:
        '👤 *Connecting you with a Human Support Specialist...*\n\nYour conversation has been routed to our team inbox. A live specialist will join this chat momentarily.\n\n_Automated bot replies are paused. Type *MENU* anytime to resume automated assistance._',
      reason,
      state: 'HUMAN_HANDOFF',
    };
  }

  /**
   * Core Stateful Message Evaluator
   */
  public static async evaluateMessage(
    incomingText: string,
    context: IConversationContext = { conversationId: 'sim_conv_default' },
    interactiveData?: { interactiveId?: string; interactiveTitle?: string }
  ): Promise<IBotDecision> {
    const rawText = incomingText.trim();
    const text = rawText.toLowerCase();
    const interactiveId = (interactiveData?.interactiveId || '').trim().toLowerCase();
    const interactiveTitle = (interactiveData?.interactiveTitle || '').trim().toLowerCase();

    if (!text && !interactiveId) {
      return { action: 'none', reason: 'Empty text' };
    }

    // 1. Fetch Session and Configurations
    const session = await this.getSession(context);
    const bizConfig = await this.getBusinessConfig();

    let botSettings = null;
    if (isDbConnected) {
      try {
        botSettings = await BotSettings.findOne();
      } catch (e) {}
    }
    if (!botSettings) botSettings = memoryStore.data.botSettings;

    // Check if bot is disabled globally
    if (botSettings && !botSettings.isEnabled) {
      return { action: 'none', reason: 'Bot is disabled globally' };
    }

    // 2. Human Handoff Active Check
    // If handoff is currently active, bot remains silent so agent can converse,
    // UNLESS the customer explicitly types 'menu' or 'start' to resume the bot!
    if (session.isHandoffActive) {
      if (['menu', 'start', '0', 'bot', 'resume'].includes(text) || interactiveId === 'opt_menu') {
        session.isHandoffActive = false;
        session.state = 'MAIN_MENU';
        await this.saveSession(session);
        return {
          action: 'reply',
          responseText: `🤖 *Bot Automation Resumed!*\n\n${this.buildWelcomeMenu(bizConfig)}`,
          reason: 'Customer resumed automated bot from handoff',
          state: 'MAIN_MENU',
        };
      } else {
        return {
          action: 'none',
          reason: 'Human handoff active; automated replies paused',
        };
      }
    }

    // 3. Universal Global Commands (Accessible from ANY state)
    // 3.1 Handoff Command
    const handoffTriggers = [
      'agent',
      'human',
      'support',
      'representative',
      'talk to agent',
      'speak to agent',
      'speak to person',
      'helpdesk',
      'operator',
      '6',
      'opt_6',
    ];
    if (
      (session.state === 'MAIN_MENU' && (text === '6' || text === 'opt_6' || interactiveId === 'opt_6')) ||
      interactiveId === 'opt_6' ||
      handoffTriggers.some((kw) => text === kw || text === `6. talk to an agent` || text === 'talk to an agent')
    ) {
      return await this.triggerHandoff(session, context);
    }

    // 3.2 Cancel Command
    if (text === 'cancel') {
      session.state = 'MAIN_MENU';
      session.draftType = 'none';
      session.collectedAnswers = {};
      session.selectedItemId = '';
      session.selectedItemName = '';
      session.historyStates = [];
      await this.saveSession(session);

      return {
        action: 'reply',
        responseText: `🚫 *Draft Cancelled.*\n\nYour pending request has been discarded.\n\n${this.buildWelcomeMenu(bizConfig)}`,
        reason: 'User cancelled current draft',
        state: 'MAIN_MENU',
      };
    }

    // 3.3 Menu / Start / Greeting Command
    const menuTriggers = ['menu', 'start', '0', 'hi', 'hello', 'hey', 'hii', 'namaste', 'hola'];
    if (menuTriggers.includes(text) && session.state === 'MAIN_MENU') {
      return {
        action: 'reply',
        responseText: this.buildWelcomeMenu(bizConfig),
        reason: 'Welcome Menu Trigger',
        state: 'MAIN_MENU',
      };
    } else if (text === 'menu' || text === '0') {
      session.state = 'MAIN_MENU';
      session.historyStates.push(session.state);
      await this.saveSession(session);
      return {
        action: 'reply',
        responseText: this.buildWelcomeMenu(bizConfig),
        reason: 'Return to Main Menu',
        state: 'MAIN_MENU',
      };
    }

    // 3.4 Help Command
    if (text === 'help' || text === '?') {
      return {
        action: 'reply',
        responseText:
          '💡 *WhatBot Assistant Help:*\n\n' +
          '• Type *MENU* anytime to view the main welcome options.\n' +
          '• Type *SERVICES* to view available digital and technical services.\n' +
          '• Type *CATALOG* to view all products, packages, and plans.\n' +
          '• Type *TRACK* to check a booking or order reference.\n' +
          '• Type *BACK* to return to the previous step.\n' +
          '• Type *CANCEL* to discard your current booking draft.\n' +
          '• Type *AGENT* to connect directly with a human specialist.',
        reason: 'Help Command',
      };
    }

    // 3.5 Back Command
    if (text === 'back') {
      if (session.historyStates && session.historyStates.length > 0) {
        const prevState = session.historyStates.pop() || 'MAIN_MENU';
        session.state = prevState;
        await this.saveSession(session);
        return {
          action: 'reply',
          responseText: `↩️ *Returning to previous step...*\n\nType *MENU* for main options or continue where you left off.`,
          state: prevState,
        };
      } else {
        session.state = 'MAIN_MENU';
        await this.saveSession(session);
        return {
          action: 'reply',
          responseText: this.buildWelcomeMenu(bizConfig),
          state: 'MAIN_MENU',
        };
      }
    }

    // -------------------------------------------------------------
    // 4. STATE MACHINE PROCESSING
    // -------------------------------------------------------------

    // STATE: MAIN_MENU
    if (session.state === 'MAIN_MENU') {
      // Option 1: Our Services
      if (
        text === '1' ||
        text === 'opt_1' ||
        interactiveId === 'opt_1' ||
        text.includes('our services') ||
        text === 'services' ||
        text === 'service'
      ) {
        const services = await this.getCatalogItems('Service');
        session.historyStates.push('MAIN_MENU');
        session.state = 'VIEWING_CATALOG';
        session.selectedCategory = 'Service';
        await this.saveSession(session);

        if (services.length === 0) {
          return {
            action: 'reply',
            responseText: '🛠️ *Our Services:*\n\nNo active services configured at the moment. Please type *AGENT* to enquire.',
          };
        }

        const listText = services
          .map((srv, idx) => {
            const priceLabel =
              srv.priceType === 'quote_required'
                ? 'Quote on Request'
                : srv.priceType === 'starting_at'
                ? `Starting at ${bizConfig.currency}${srv.price.toLocaleString()}`
                : `${bizConfig.currency}${srv.price.toLocaleString()}`;
            const dur = srv.duration ? ` • ⏱️ ${srv.duration}` : '';
            return `${idx + 1}️⃣ *${srv.name}*\n   _${srv.description}_\n   💰 ${priceLabel}${dur}`;
          })
          .join('\n\n');

        return {
          action: 'reply',
          responseText:
            `🛠️ *Available Professional Services:*\n\n${listText}\n\n` +
            `👉 *Reply with the Service Number (e.g. 1)* or *Service Name* to begin booking. Type *MENU* to return.`,
          state: 'VIEWING_CATALOG',
        };
      }

      // Option 2: View Catalog
      if (
        text === '2' ||
        text === 'opt_2' ||
        interactiveId === 'opt_2' ||
        text.includes('catalog') ||
        text.includes('view catalog') ||
        text.includes('products')
      ) {
        const allItems = await this.getCatalogItems();
        session.historyStates.push('MAIN_MENU');
        session.state = 'VIEWING_CATALOG';
        session.selectedCategory = 'All';
        await this.saveSession(session);

        const listText = allItems
          .map((item, idx) => {
            const badge = `[${item.itemType}]`;
            const priceLabel =
              item.priceType === 'quote_required'
                ? 'Quote on Request'
                : item.priceType === 'starting_at'
                ? `Starting at ${bizConfig.currency}${item.price.toLocaleString()}`
                : `${bizConfig.currency}${item.price.toLocaleString()}`;
            return `${idx + 1}️⃣ ${badge} *${item.name}*\n   _${item.description}_\n   💰 ${priceLabel} (${item.availability.replace('_', ' ')})`;
          })
          .join('\n\n');

        return {
          action: 'reply',
          responseText:
            `📦 *${bizConfig.businessName} Offerings Catalog:*\n\n${listText}\n\n` +
            `👉 *Reply with the Item Number (e.g. 1, 2)* or *Item Name* to enquire, book, or order.`,
          state: 'VIEWING_CATALOG',
        };
      }

      // Option 3: Book an Appointment
      if (
        text === '3' ||
        text === 'opt_3' ||
        interactiveId === 'opt_3' ||
        text.includes('appointment') ||
        text.includes('book an appointment') ||
        text === 'book'
      ) {
        const services = await this.getCatalogItems('Service');
        session.historyStates.push('MAIN_MENU');
        session.state = 'VIEWING_CATALOG';
        session.selectedCategory = 'Appointment';
        await this.saveSession(session);

        const listText = services
          .map((srv, idx) => `${idx + 1}️⃣ *${srv.name}* (${bizConfig.currency}${srv.price})`)
          .join('\n');

        return {
          action: 'reply',
          responseText:
            `📅 *Schedule an Appointment / Consultation:*\n\nWhich service or consultation would you like to book?\n\n${listText}\n\n` +
            `👉 Reply with the number to select your appointment type.`,
          state: 'VIEWING_CATALOG',
        };
      }

      // Option 4: Product/Service Enquiry
      if (
        text === '4' ||
        text === 'opt_4' ||
        interactiveId === 'opt_4' ||
        text.includes('enquiry') ||
        text.includes('inquiry')
      ) {
        session.historyStates.push('MAIN_MENU');
        session.state = 'SELECTING_ITEM';
        session.draftType = 'enquiry';
        await this.saveSession(session);

        return {
          action: 'reply',
          responseText:
            `💬 *Product & Service Enquiry:*\n\nPlease type the name of the service or product you are interested in, or describe your custom project requirements in a message:`,
          state: 'SELECTING_ITEM',
        };
      }

      // Option 5: Track My Booking / Order
      if (
        text === '5' ||
        text === 'opt_5' ||
        interactiveId === 'opt_5' ||
        text.includes('track') ||
        text.includes('booking status') ||
        text.includes('order status')
      ) {
        session.historyStates.push('MAIN_MENU');
        session.state = 'TRACKING_INPUT';
        await this.saveSession(session);

        return {
          action: 'reply',
          responseText:
            '🔍 *Track Booking or Order:*\n\nPlease enter your reference number (e.g. *BK-89214* or *ORD-73912*):',
          state: 'TRACKING_INPUT',
        };
      }
    }

    // STATE: TRACKING_INPUT
    if (session.state === 'TRACKING_INPUT' || text.startsWith('bk-') || text.startsWith('ord-')) {
      const refQuery = rawText.toUpperCase().trim();

      // Check Bookings
      let booking: any = null;
      if (isDbConnected) {
        try {
          booking = await Booking.findOne({ bookingReference: refQuery });
        } catch (e) {}
      }
      if (!booking) {
        booking = (memoryStore.data.bookings || []).find(
          (b: any) => b.bookingReference === refQuery
        );
      }

      if (booking) {
        session.state = 'MAIN_MENU';
        await this.saveSession(session);

        const answersList = Object.entries(booking.requirements || {})
          .map(([q, a]) => `• _${q}_: *${a}*`)
          .join('\n');

        return {
          action: 'reply',
          responseText:
            `🔍 *Booking Found: ${booking.bookingReference}*\n\n` +
            `📌 *Service:* ${booking.itemName}\n` +
            `🟢 *Status:* ${booking.status.toUpperCase()}\n` +
            `👤 *Customer:* ${booking.customerName}\n` +
            (booking.preferredDateTime ? `📅 *Preferred Date/Time:* ${booking.preferredDateTime}\n` : '') +
            (answersList ? `\n📝 *Logged Requirements:*\n${answersList}\n` : '') +
            `\n_Type MENU to return to options or AGENT to speak with a human._`,
          state: 'MAIN_MENU',
          referenceNumber: booking.bookingReference,
        };
      }

      // Check Orders
      let order: any = null;
      if (isDbConnected) {
        try {
          order = await Order.findOne({ orderReference: refQuery });
        } catch (e) {}
      }
      if (!order) {
        order = (memoryStore.data.orders || []).find(
          (o: any) => o.orderReference === refQuery
        );
      }

      if (order) {
        session.state = 'MAIN_MENU';
        await this.saveSession(session);

        return {
          action: 'reply',
          responseText:
            `🔍 *Order Found: ${order.orderReference}*\n\n` +
            `📦 *Item:* ${order.itemName} (Qty: ${order.quantity})\n` +
            `💰 *Total Amount:* ${order.currency}${order.totalPrice.toLocaleString()}\n` +
            `🟢 *Status:* ${order.status.toUpperCase()}\n` +
            (order.fulfilmentDetails?.deliveryAddress ? `📍 *Destination:* ${order.fulfilmentDetails.deliveryAddress}\n` : '') +
            `\n_Type MENU to return to options or AGENT to speak with support._`,
          state: 'MAIN_MENU',
          referenceNumber: order.orderReference,
        };
      }

      return {
        action: 'reply',
        responseText:
          `❌ *Reference not found:* "${refQuery}"\n\nPlease double check your booking or order ID (e.g. *BK-89214* or *ORD-73912*), or type *AGENT* for assistance.`,
        state: 'TRACKING_INPUT',
      };
    }

    // STATE: VIEWING_CATALOG or SELECTING_ITEM
    if (session.state === 'VIEWING_CATALOG' || session.state === 'SELECTING_ITEM') {
      const allItems = await this.getCatalogItems(
        session.selectedCategory === 'Service' ? 'Service' : undefined
      );

      // Check if user selected by index number (e.g. "1", "2")
      const numSelection = parseInt(text, 10);
      let selectedItem: any = null;

      if (!isNaN(numSelection) && numSelection >= 1 && numSelection <= allItems.length) {
        selectedItem = allItems[numSelection - 1];
      } else {
        // Try matching by interactive ID or title if provided
        if (interactiveId || interactiveTitle) {
          selectedItem = allItems.find(
            (i: any) =>
              i._id?.toString() === interactiveId ||
              (i.sku && i.sku.toLowerCase() === interactiveId) ||
              (interactiveTitle && i.name.toLowerCase() === interactiveTitle) ||
              (interactiveId && i.name.toLowerCase() === interactiveId)
          );
        }

        // Try fuzzy and word-level matching item name
        if (!selectedItem) {
          selectedItem = allItems.find((i: any) => {
            const itemLower = i.name.toLowerCase();
            if (itemLower.includes(text) || text.includes(itemLower)) return true;
            const queryWords = text.split(/\s+/).filter((w: string) => w.length > 2);
            if (queryWords.length > 0 && queryWords.every((w: string) => itemLower.includes(w))) {
              return true;
            }
            return false;
          });
        }
      }

      if (selectedItem) {
        session.selectedItemId = selectedItem._id;
        session.selectedItemName = selectedItem.name;
        session.historyStates.push(session.state);
        session.collectedAnswers = {};
        session.currentQuestionIndex = 0;

        const isProduct = selectedItem.itemType === 'Product';

        if (isProduct) {
          session.draftType = 'order';
          session.state = 'COLLECTING_REQUIREMENTS';
          await this.saveSession(session);

          const priceLabel = `${bizConfig.currency}${selectedItem.price.toLocaleString()}`;
          return {
            action: 'reply',
            responseText:
              `📦 *Selected: ${selectedItem.name}*\n\n` +
              `${selectedItem.description}\n\n` +
              `💰 *Price:* ${priceLabel} per unit • _Status: ${selectedItem.availability.replace('_', ' ')}_\n\n` +
              `👉 *How many units would you like to order?* (Please enter a number, e.g. 1, 2, 5):`,
            state: 'COLLECTING_REQUIREMENTS',
          };
        } else {
          // Service, Package, or Plan -> Booking Flow
          session.draftType = 'booking';
          const questions = selectedItem.followUpQuestions || [];

          if (questions.length > 0) {
            session.state = 'COLLECTING_REQUIREMENTS';
            session.currentQuestionIndex = 0;
            await this.saveSession(session);

            const q1 = questions[0];
            const optionsText = q1.options && q1.options.length > 0
              ? `\n\nOptions:\n${q1.options.map((o: string, idx: number) => `• ${o}`).join('\n')}`
              : '';

            return {
              action: 'reply',
              responseText:
                `🛠️ *Selected: ${selectedItem.name}*\n\n` +
                `${selectedItem.description}\n\n` +
                `Let's collect a few details to tailor this service for you.\n\n` +
                `*Question 1 of ${questions.length}:*\n` +
                `👉 *${q1.question}*${optionsText}`,
              state: 'COLLECTING_REQUIREMENTS',
            };
          } else if (selectedItem.requiresDateTime) {
            session.state = 'COLLECTING_DATE_TIME';
            await this.saveSession(session);

            const slotsText = (bizConfig.appointmentSlots || [])
              .map((s: string) => `• ${s}`)
              .join('\n');

            return {
              action: 'reply',
              responseText:
                `📅 *Appointment Scheduling:*\n\n` +
                `When would you like to schedule this session? Available daily slots:\n${slotsText}\n\n` +
                `👉 Reply with your preferred date and time (e.g. *Tomorrow at 2:00 PM* or *Next Monday 11:30 AM*):`,
              state: 'COLLECTING_DATE_TIME',
            };
          } else {
            // No questions or dates required, proceed directly to confirmation
            session.state = 'AWAITING_CONFIRMATION';
            await this.saveSession(session);

            return {
              action: 'reply',
              responseText:
                `📋 *Booking Request Summary:*\n----------------------------------------\n` +
                `📌 *Service:* ${selectedItem.name}\n` +
                `💰 *Price:* ${bizConfig.currency}${selectedItem.price.toLocaleString()}\n` +
                `👤 *Customer:* ${session.customerName} (${session.customerPhone || 'WhatsApp'})\n` +
                `----------------------------------------\n` +
                `Would you like to confirm this booking request?\n` +
                `Reply *YES* to confirm or *CANCEL* to discard.`,
              state: 'AWAITING_CONFIRMATION',
            };
          }
        }
      }
    }

    // STATE: COLLECTING_REQUIREMENTS (Follow-Up Questions or Quantity)
    if (session.state === 'COLLECTING_REQUIREMENTS') {
      const allItems = await this.getCatalogItems();
      const currentItem = allItems.find((i: any) => i._id === session.selectedItemId) || {
        name: session.selectedItemName,
        itemType: session.draftType === 'order' ? 'Product' : 'Service',
        followUpQuestions: [],
      };

      if (session.draftType === 'order') {
        // If we haven't stored quantity yet, current answer is quantity
        if (!session.quantity || session.quantity === 1) {
          const qty = parseInt(text, 10);
          session.quantity = isNaN(qty) || qty <= 0 ? 1 : qty;
        }

        const questions = currentItem.followUpQuestions || [];
        if (session.currentQuestionIndex < questions.length) {
          const prevQ = questions[session.currentQuestionIndex];
          session.collectedAnswers[prevQ.question] = rawText;
          session.currentQuestionIndex++;
        }

        // More questions?
        if (session.currentQuestionIndex < questions.length) {
          const nextQ = questions[session.currentQuestionIndex];
          await this.saveSession(session);

          const optionsText = nextQ.options && nextQ.options.length > 0
            ? `\n\nOptions:\n${nextQ.options.map((o: string) => `• ${o}`).join('\n')}`
            : '';

          return {
            action: 'reply',
            responseText: `*Question ${session.currentQuestionIndex + 1} of ${questions.length}:*\n👉 *${nextQ.question}*${optionsText}`,
            state: 'COLLECTING_REQUIREMENTS',
          };
        }

        // Questions done for product: check if requires address
        if (currentItem.requiresAddress) {
          session.state = 'COLLECTING_ADDRESS_IF_REQUIRED';
          await this.saveSession(session);

          return {
            action: 'reply',
            responseText:
              `📍 *Delivery Address Required:*\n\n` +
              `Please enter your complete shipping/delivery address, city, and postal code:`,
            state: 'COLLECTING_ADDRESS_IF_REQUIRED',
          };
        } else {
          session.state = 'AWAITING_CONFIRMATION';
          await this.saveSession(session);

          const totalPrice = (currentItem.price || 0) * (session.quantity || 1);
          return {
            action: 'reply',
            responseText:
              `🛒 *Order Summary:*\n----------------------------------------\n` +
              `📦 *Product:* ${currentItem.name}\n` +
              `🔢 *Quantity:* ${session.quantity} unit(s)\n` +
              `💵 *Unit Price:* ${bizConfig.currency}${(currentItem.price || 0).toLocaleString()}\n` +
              `💰 *Total Amount:* ${bizConfig.currency}${totalPrice.toLocaleString()}\n` +
              `👤 *Customer:* ${session.customerName} (${session.customerPhone || 'WhatsApp'})\n` +
              `----------------------------------------\n` +
              `Would you like to place this order?\n` +
              `Reply *YES* to confirm or *CANCEL* to discard.`,
            state: 'AWAITING_CONFIRMATION',
          };
        }
      } else {
        // Service / Plan Booking Flow
        const questions = currentItem.followUpQuestions || [];

        // Save answer to the current question
        if (session.currentQuestionIndex < questions.length) {
          const currentQ = questions[session.currentQuestionIndex];
          session.collectedAnswers[currentQ.question] = rawText;
          session.currentQuestionIndex++;
        }

        // Any more follow-up questions remaining?
        if (session.currentQuestionIndex < questions.length) {
          const nextQ = questions[session.currentQuestionIndex];
          await this.saveSession(session);

          const optionsText = nextQ.options && nextQ.options.length > 0
            ? `\n\nOptions:\n${nextQ.options.map((o: string) => `• ${o}`).join('\n')}`
            : '';

          return {
            action: 'reply',
            responseText: `*Question ${session.currentQuestionIndex + 1} of ${questions.length}:*\n👉 *${nextQ.question}*${optionsText}`,
            state: 'COLLECTING_REQUIREMENTS',
          };
        }

        // All follow-up questions answered!
        if (currentItem.requiresDateTime) {
          session.state = 'COLLECTING_DATE_TIME';
          await this.saveSession(session);

          const slotsText = (bizConfig.appointmentSlots || [])
            .map((s: string) => `• ${s}`)
            .join('\n');

          return {
            action: 'reply',
            responseText:
              `📅 *Preferred Appointment Slot:*\n\n` +
              `Available consultation slots:\n${slotsText}\n\n` +
              `👉 What day or time works best for you? (e.g. *Tomorrow 2 PM* or *Next Tuesday*):`,
            state: 'COLLECTING_DATE_TIME',
          };
        } else {
          session.state = 'AWAITING_CONFIRMATION';
          await this.saveSession(session);

          const priceLabel =
            currentItem.priceType === 'quote_required'
              ? 'Quote on Request'
              : currentItem.priceType === 'starting_at'
              ? `Starting at ${bizConfig.currency}${currentItem.price.toLocaleString()}`
              : `${bizConfig.currency}${currentItem.price.toLocaleString()}`;

          const answersList = Object.entries(session.collectedAnswers || {})
            .map(([q, a]) => `• *${q}*: ${a}`)
            .join('\n');

          return {
            action: 'reply',
            responseText:
              `📋 *Booking Request Summary:*\n----------------------------------------\n` +
              `📌 *Service:* ${currentItem.name}\n` +
              `💰 *Price:* ${priceLabel}\n` +
              (currentItem.duration ? `⏱️ *Estimated Duration:* ${currentItem.duration}\n` : '') +
              `\n📝 *Your Specifications:*\n${answersList}\n` +
              `\n👤 *Client:* ${session.customerName} (${session.customerPhone || 'WhatsApp'})\n` +
              `----------------------------------------\n` +
              `Would you like to confirm this booking request?\n` +
              `👉 Reply *YES* to confirm or *CANCEL* to discard.`,
            state: 'AWAITING_CONFIRMATION',
          };
        }
      }
    }

    // STATE: COLLECTING_DATE_TIME
    if (session.state === 'COLLECTING_DATE_TIME') {
      session.preferredDateTime = rawText;
      session.state = 'AWAITING_CONFIRMATION';
      await this.saveSession(session);

      const allItems = await this.getCatalogItems();
      const currentItem = allItems.find((i: any) => i._id === session.selectedItemId) || {
        name: session.selectedItemName,
        price: 3500,
        priceType: 'fixed',
      };

      const priceLabel =
        currentItem.priceType === 'quote_required'
          ? 'Quote on Request'
          : `${bizConfig.currency}${currentItem.price.toLocaleString()}`;

      const answersList = Object.entries(session.collectedAnswers || {})
        .map(([q, a]) => `• *${q}*: ${a}`)
        .join('\n');

      return {
        action: 'reply',
        responseText:
          `📋 *Consultation Booking Summary:*\n----------------------------------------\n` +
          `📌 *Item:* ${currentItem.name}\n` +
          `📅 *Preferred Slot:* ${session.preferredDateTime}\n` +
          `💰 *Fee:* ${priceLabel}\n` +
          (answersList ? `📝 *Topic/Notes:*\n${answersList}\n` : '') +
          `👤 *Attendee:* ${session.customerName} (${session.customerPhone || 'WhatsApp'})\n` +
          `----------------------------------------\n` +
          `Would you like to confirm this appointment?\n` +
          `👉 Reply *YES* to confirm or *CANCEL* to discard.`,
        state: 'AWAITING_CONFIRMATION',
      };
    }

    // STATE: COLLECTING_ADDRESS_IF_REQUIRED
    if (session.state === 'COLLECTING_ADDRESS_IF_REQUIRED') {
      session.fulfilmentAddress = rawText;
      session.state = 'AWAITING_CONFIRMATION';
      await this.saveSession(session);

      const allItems = await this.getCatalogItems();
      const currentItem = allItems.find((i: any) => i._id === session.selectedItemId) || {
        name: session.selectedItemName,
        price: 12500,
      };

      const totalPrice = (currentItem.price || 0) * (session.quantity || 1);

      return {
        action: 'reply',
        responseText:
          `🛒 *Order Summary:*\n----------------------------------------\n` +
          `📦 *Product:* ${currentItem.name}\n` +
          `🔢 *Quantity:* ${session.quantity} unit(s)\n` +
          `💵 *Unit Price:* ${bizConfig.currency}${(currentItem.price || 0).toLocaleString()}\n` +
          `💰 *Total Amount:* ${bizConfig.currency}${totalPrice.toLocaleString()}\n` +
          `📍 *Delivery Address:* ${session.fulfilmentAddress}\n` +
          `👤 *Customer:* ${session.customerName} (${session.customerPhone || 'WhatsApp'})\n` +
          `----------------------------------------\n` +
          `Would you like to place this order?\n` +
          `👉 Reply *YES* to confirm or *CANCEL* to discard.`,
        state: 'AWAITING_CONFIRMATION',
      };
    }

    // STATE: AWAITING_CONFIRMATION
    if (session.state === 'AWAITING_CONFIRMATION') {
      const isPositive = ['yes', 'y', 'confirm', '1', 'ok', 'sure', 'place order', 'book'].includes(text);
      const isNegative = ['no', 'n', 'cancel', 'discard', 'stop'].includes(text);

      if (isPositive) {
        const allItems = await this.getCatalogItems();
        const currentItem = allItems.find((i: any) => i._id === session.selectedItemId) || {
          _id: session.selectedItemId,
          name: session.selectedItemName,
          itemType: session.draftType === 'order' ? 'Product' : 'Service',
          price: 20000,
        };

        if (session.draftType === 'order') {
          // Finalize Product Order
          const refNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
          const unitPrice = currentItem.price || 0;
          const totalPrice = unitPrice * (session.quantity || 1);

          const newOrderData = {
            _id: `ord_${Date.now()}`,
            orderReference: refNumber,
            conversationId: context.conversationId,
            contactId: context.contactId || 'cnt_1',
            customerName: session.customerName || 'Valued Customer',
            customerContact: {
              phoneNumber: session.customerPhone || context.contactPhone || '+1555000000',
              email: session.customerEmail || '',
            },
            itemId: currentItem._id,
            itemName: currentItem.name,
            itemType: currentItem.itemType || 'Product',
            quantity: session.quantity || 1,
            unitPrice,
            totalPrice,
            currency: bizConfig.currency || '₹',
            fulfilmentDetails: {
              deliveryAddress: session.fulfilmentAddress || 'Customer specified',
            },
            status: 'confirmed',
            confirmedAt: new Date(),
          };

          if (isDbConnected) {
            try {
              await Order.create(newOrderData);
            } catch (e) {}
          }
          if (!memoryStore.data.orders) memoryStore.data.orders = [];
          memoryStore.data.orders.unshift(newOrderData);

          // Reset session
          session.state = 'MAIN_MENU';
          session.activeReference = refNumber;
          session.draftType = 'none';
          session.collectedAnswers = {};
          await this.saveSession(session);

          return {
            action: 'reply',
            responseText:
              `✅ *Order Successfully Placed!*\n\n` +
              `🎉 Thank you, ${session.customerName}! Your order has been registered.\n` +
              `👉 Order Reference: *${refNumber}*\n\n` +
              `📦 *Item:* ${currentItem.name} (Qty: ${newOrderData.quantity})\n` +
              `💰 *Total Amount:* ${newOrderData.currency}${totalPrice.toLocaleString()}\n` +
              `📍 *Delivery:* ${newOrderData.fulfilmentDetails.deliveryAddress}\n\n` +
              `Our fulfillment team is preparing your package. Type *TRACK* anytime to verify dispatch status, or *MENU* for main options.`,
            state: 'ORDER_CONFIRMED',
            referenceNumber: refNumber,
          };
        } else {
          // Finalize Service / Appointment Booking
          const refNumber = `BK-${Math.floor(10000 + Math.random() * 90000)}`;
          const priceLabel =
            currentItem.priceType === 'quote_required'
              ? 'Quote on Request'
              : currentItem.priceType === 'starting_at'
              ? `Starting at ${bizConfig.currency}${currentItem.price.toLocaleString()}`
              : `${bizConfig.currency}${currentItem.price.toLocaleString()}`;

          const newBookingData = {
            _id: `bk_${Date.now()}`,
            bookingReference: refNumber,
            conversationId: context.conversationId,
            contactId: context.contactId || 'cnt_1',
            customerName: session.customerName || 'Valued Customer',
            customerContact: {
              phoneNumber: session.customerPhone || context.contactPhone || '+1555000000',
              email: session.customerEmail || '',
            },
            itemId: currentItem._id,
            itemName: currentItem.name,
            itemType: currentItem.itemType || 'Service',
            requirements: session.collectedAnswers || {},
            preferredDateTime: session.preferredDateTime || '',
            estimatedPrice: priceLabel,
            status: 'confirmed',
            confirmedAt: new Date(),
            internalNotes: 'Automated WhatsApp conversation booking.',
          };

          if (isDbConnected) {
            try {
              await Booking.create(newBookingData);
            } catch (e) {}
          }
          if (!memoryStore.data.bookings) memoryStore.data.bookings = [];
          memoryStore.data.bookings.unshift(newBookingData);

          // Reset session
          session.state = 'MAIN_MENU';
          session.activeReference = refNumber;
          session.draftType = 'none';
          session.collectedAnswers = {};
          await this.saveSession(session);

          return {
            action: 'reply',
            responseText:
              `✅ *Booking Confirmed!*\n\n` +
              `🎉 Thank you, ${session.customerName}! Your booking reference is:\n` +
              `👉 *${refNumber}*\n\n` +
              `📌 *Service:* ${currentItem.name}\n` +
              (newBookingData.preferredDateTime ? `📅 *Scheduled Slot:* ${newBookingData.preferredDateTime}\n` : '') +
              `💰 *Estimate:* ${priceLabel}\n\n` +
              `Our engineering & advisory team has received your specifications. A senior solution manager will reach out via WhatsApp/email within 2 business hours.\n\n` +
              `_Type *TRACK* to review status anytime or *MENU* for main options._`,
            state: 'BOOKING_CONFIRMED',
            referenceNumber: refNumber,
          };
        }
      } else if (isNegative) {
        session.state = 'MAIN_MENU';
        session.draftType = 'none';
        session.collectedAnswers = {};
        await this.saveSession(session);

        return {
          action: 'reply',
          responseText:
            `❌ *Request Discarded.*\n\nNo booking was created.\n\n${this.buildWelcomeMenu(bizConfig)}`,
          state: 'MAIN_MENU',
        };
      } else {
        return {
          action: 'reply',
          responseText:
            `Please confirm your request:\n👉 Reply *YES* to proceed with confirmation, or *CANCEL* to discard.`,
          state: 'AWAITING_CONFIRMATION',
        };
      }
    }

    // -------------------------------------------------------------
    // 5. Automated Reply Rules (Keywords Fallback)
    // -------------------------------------------------------------
    let rules: any[] = [];
    if (isDbConnected) {
      try {
        rules = await AutoReplyRule.find({ isActive: true }).sort({ priority: -1, createdAt: -1 });
      } catch (e) {}
    }
    if (!rules || rules.length === 0) {
      rules = (memoryStore.data.autoReplyRules || []).filter((r: any) => r.isActive !== false);
    }

    for (const rule of rules) {
      let matched = false;
      for (const kw of rule.keywords) {
        const cleanKw = kw.trim().toLowerCase();
        if (!cleanKw) continue;

        switch (rule.matchType) {
          case 'exact':
            matched = text === cleanKw;
            break;
          case 'contains':
            matched = text.includes(cleanKw);
            break;
          case 'starts_with':
            matched = text.startsWith(cleanKw);
            break;
          case 'regex':
            try {
              const regex = new RegExp(cleanKw, 'i');
              matched = regex.test(text);
            } catch (err) {
              matched = false;
            }
            break;
          default:
            matched = text.includes(cleanKw);
        }

        if (matched) break;
      }

      if (matched) {
        if (isDbConnected && rule._id) {
          AutoReplyRule.findByIdAndUpdate(rule._id, { $inc: { triggerCount: 1 } }).catch(() => {});
        }

        if (rule.actionType === 'handoff') {
          return await this.triggerHandoff(session, context, `Rule: ${rule.name}`);
        }

        return {
          action: 'reply',
          responseText: `${rule.responseMessage}\n\n💡 _Type *MENU* for main options._`,
          matchedRuleName: rule.name,
          ruleCategory: rule.category,
          mediaUrl: rule.mediaUrl,
          reason: `Matched rule: ${rule.name}`,
        };
      }
    }

    // -------------------------------------------------------------
    // 6. FAQ Knowledge Base Lookup
    // -------------------------------------------------------------
    let faqs: any[] = [];
    if (isDbConnected) {
      try {
        faqs = await Faq.find({ isActive: true });
      } catch (e) {}
    }
    if (!faqs || faqs.length === 0) {
      faqs = (memoryStore.data.faqs || []).filter((f: any) => f.isActive !== false);
    }

    for (const faq of faqs) {
      const q = faq.question.toLowerCase();
      const words = q.split(/\s+/).filter((w: string) => w.length > 3);
      const matchesSignificantWord = words.some((w: string) => text.includes(w));
      if (text.includes(q) || q.includes(text) || matchesSignificantWord) {
        if (isDbConnected && faq._id) {
          Faq.findByIdAndUpdate(faq._id, { $inc: { triggerCount: 1 } }).catch(() => {});
        }
        return {
          action: 'reply',
          responseText: `💡 *${faq.question}*\n\n${faq.answer}\n\n_Type *MENU* for main options or *AGENT* to speak with someone._`,
          reason: `Matched FAQ: ${faq.question}`,
        };
      }
    }

    // -------------------------------------------------------------
    // 7. Intelligent Default Fallback
    // -------------------------------------------------------------
    return {
      action: 'fallback',
      responseText:
        `🤖 *I didn't quite catch that.*\n\n` +
        `You can:\n` +
        `• Type *MENU* to view services and catalog options.\n` +
        `• Type *SERVICES* to browse our offerings.\n` +
        `• Type *TRACK* to check an existing booking reference.\n` +
        `• Type *AGENT* to speak directly with our team.`,
      reason: 'No keywords or state transitions matched',
    };
  }
}
