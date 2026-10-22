import { Request, Response } from 'express';
import { memoryStore } from '../services/store.js';
import { isDbConnected } from '../config/db.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Contact } from '../models/Contact.js';
import { BotEngine } from '../services/whatsapp/botEngine.js';
import { WhatsAppProviderFactory } from '../services/whatsapp/providerFactory.js';

export const getConversations = async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;

    let conversations: any[] = [];
    let contacts: any[] = [];

    if (isDbConnected) {
      try {
        let filter: any = {};
        if (status && status !== 'all') {
          filter.status = status;
        }
        conversations = await Conversation.find(filter).sort({ lastMessageTimestamp: -1 });
        contacts = await Contact.find();
      } catch (err) {
        conversations = memoryStore.data.conversations;
        contacts = memoryStore.data.contacts;
      }
    } else {
      conversations = memoryStore.data.conversations;
      contacts = memoryStore.data.contacts;
      if (status && status !== 'all') {
        conversations = conversations.filter((c) => c.status === status);
      }
    }

    // Populate contacts
    const populated = conversations.map((conv) => {
      const contact = contacts.find(
        (c) => c._id.toString() === (conv.contactId?._id || conv.contactId)?.toString()
      ) || {
        name: 'WhatsApp User',
        phoneNumber: '+1 555 000 0000',
        avatar: '',
        tags: [],
      };

      return {
        ...conv.toObject ? conv.toObject() : conv,
        contact,
      };
    });

    // Apply search filter if query given
    const filtered = search
      ? populated.filter(
          (c) =>
            c.contact?.name?.toLowerCase().includes((search as string).toLowerCase()) ||
            c.contact?.phoneNumber?.includes(search as string) ||
            c.lastMessageText?.toLowerCase().includes((search as string).toLowerCase())
        )
      : populated;

    res.json({
      success: true,
      data: filtered,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    let conversation: any = null;
    let contact: any = null;
    let messages: any[] = [];

    if (isDbConnected) {
      try {
        conversation = await Conversation.findById(id);
        if (conversation) {
          contact = await Contact.findById(conversation.contactId);
          messages = await Message.find({ conversationId: conversation._id }).sort({ timestamp: 1 });
        }
      } catch (e) {
        // fallback
      }
    }

    if (!conversation) {
      conversation = memoryStore.data.conversations.find((c) => c._id.toString() === id);
      if (conversation) {
        contact = memoryStore.data.contacts.find(
          (c) => c._id.toString() === conversation.contactId.toString()
        );
        messages = memoryStore.data.messages
          .filter((m) => m.conversationId.toString() === id)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }
    }

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    res.json({
      success: true,
      data: {
        conversation: conversation.toObject ? conversation.toObject() : conversation,
        contact: contact ? (contact.toObject ? contact.toObject() : contact) : null,
        messages: messages.map((m) => (m.toObject ? m.toObject() : m)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // conversationId
    const { text, messageType = 'text', mediaUrl, fileName } = req.body;

    if (!text && !mediaUrl) {
      return res.status(400).json({ success: false, message: 'Message text or media is required' });
    }

    let conversation: any = null;
    let contact: any = null;

    if (isDbConnected) {
      conversation = await Conversation.findById(id);
      if (conversation) {
        contact = await Contact.findById(conversation.contactId);
      }
    }

    if (!conversation) {
      conversation = memoryStore.data.conversations.find((c) => c._id.toString() === id);
      if (conversation) {
        contact = memoryStore.data.contacts.find(
          (c) => c._id.toString() === conversation.contactId.toString()
        );
      }
    }

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Call WhatsApp Provider to dispatch message (demo or live meta API)
    const provider = await WhatsAppProviderFactory.getProvider();
    const sendResult = await provider.sendMessage({
      to: contact?.phoneNumber || '+15550000000',
      type: messageType,
      text,
      mediaUrl,
      fileName,
    });

    const newMsgObj = {
      _id: `msg_${Date.now()}`,
      conversationId: conversation._id,
      contactId: conversation.contactId,
      sender: 'agent',
      text: text || (messageType === 'image' ? '📷 Image' : '📎 Document'),
      messageType,
      mediaUrl: mediaUrl || '',
      fileName: fileName || '',
      status: sendResult.status,
      timestamp: new Date(),
      metadata: {
        waMessageId: sendResult.messageId,
        provider: sendResult.provider,
      },
    };

    if (isDbConnected) {
      try {
        const createdMsg = await Message.create(newMsgObj);
        await Conversation.findByIdAndUpdate(conversation._id, {
          lastMessageText: newMsgObj.text,
          lastMessageTimestamp: new Date(),
        });
        return res.status(201).json({ success: true, data: createdMsg });
      } catch (e) {
        // Fall back to memory
      }
    }

    // In-memory fallback
    memoryStore.data.messages.push(newMsgObj);
    conversation.lastMessageText = newMsgObj.text;
    conversation.lastMessageTimestamp = new Date();

    res.status(201).json({
      success: true,
      data: newMsgObj,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Simulate an incoming customer message (DEMO Mode simulation & testing)
 * Automatically triggers BotEngine evaluation and automated reply!
 */
export const simulateIncomingMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // conversationId
    const { text = 'Can I see the price plans?' } = req.body;

    let conversation: any = null;
    let contact: any = null;

    if (isDbConnected) {
      conversation = await Conversation.findById(id);
      if (conversation) {
        contact = await Contact.findById(conversation.contactId);
      }
    }

    if (!conversation) {
      conversation = memoryStore.data.conversations.find((c) => c._id.toString() === id);
      if (conversation) {
        contact = memoryStore.data.contacts.find(
          (c) => c._id.toString() === conversation.contactId.toString()
        );
      }
    }

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // 1. Create incoming customer message
    const customerMsg = {
      _id: `msg_cust_${Date.now()}`,
      conversationId: conversation._id,
      contactId: conversation.contactId,
      sender: 'customer',
      text,
      messageType: 'text',
      status: 'delivered',
      timestamp: new Date(),
      metadata: { isSimulated: true },
    };

    if (isDbConnected) {
      await Message.create(customerMsg);
    }
    memoryStore.data.messages.push(customerMsg);

    // 2. Evaluate with BotEngine with stateful conversation context
    const contactIdStr = (conversation.contactId?._id || conversation.contactId)?.toString();
    const decision = await BotEngine.evaluateMessage(text, {
      conversationId: conversation._id.toString(),
      contactId: contactIdStr,
      contactName: contact?.name || 'Valued Customer',
      contactPhone: contact?.phoneNumber || '+1555000000',
    });
    let botReplyMsg: any = null;

    if (decision.action !== 'none' && decision.responseText) {
      botReplyMsg = {
        _id: `msg_bot_${Date.now() + 500}`,
        conversationId: conversation._id,
        contactId: conversation.contactId,
        sender: 'bot',
        text: decision.responseText,
        messageType: 'text',
        mediaUrl: decision.mediaUrl || '',
        status: 'delivered',
        timestamp: new Date(Date.now() + 500),
        metadata: {
          matchedRule: decision.matchedRuleName || decision.reason,
          action: decision.action,
          state: decision.state,
          referenceNumber: decision.referenceNumber,
          options: decision.options,
        },
      };

      if (isDbConnected) {
        await Message.create(botReplyMsg);
      }
      memoryStore.data.messages.push(botReplyMsg);

      // If handoff was triggered, set status to pending (Requirement 6)
      if (decision.action === 'handoff') {
        conversation.status = 'pending';
        conversation.assignedAgent = 'Unassigned Agent Queue';
      }
    }

    // Update conversation metadata
    const finalLastText = botReplyMsg ? botReplyMsg.text : customerMsg.text;
    conversation.lastMessageText = finalLastText;
    conversation.lastMessageTimestamp = new Date();

    if (isDbConnected) {
      await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessageText: finalLastText,
        lastMessageTimestamp: new Date(),
        status: conversation.status,
      });
    }

    res.json({
      success: true,
      data: {
        customerMessage: customerMsg,
        botReply: botReplyMsg,
        botDecision: decision,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateConversationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'pending', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (isDbConnected) {
      await Conversation.findByIdAndUpdate(id, { status });
    }

    const conv = memoryStore.data.conversations.find((c) => c._id.toString() === id);
    if (conv) {
      conv.status = status;
    }

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { agentName } = req.body;

    if (isDbConnected) {
      await Conversation.findByIdAndUpdate(id, { assignedAgent: agentName });
    }

    const conv = memoryStore.data.conversations.find((c) => c._id.toString() === id);
    if (conv) {
      conv.assignedAgent = agentName;
    }

    res.json({ success: true, message: `Conversation assigned to ${agentName}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInternalNotes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { internalNotes } = req.body;

    if (isDbConnected) {
      await Conversation.findByIdAndUpdate(id, { internalNotes });
    }

    const conv = memoryStore.data.conversations.find((c) => c._id.toString() === id);
    if (conv) {
      conv.internalNotes = internalNotes;
    }

    res.json({ success: true, message: 'Internal notes updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resumeBot = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const session = await BotEngine.getSession({ conversationId: id });
    session.isHandoffActive = false;
    session.state = 'MAIN_MENU';
    await BotEngine.saveSession(session);

    if (isDbConnected) {
      await Conversation.findByIdAndUpdate(id, {
        status: 'open',
        assignedAgent: 'Chatbot',
      });
    }

    const conv = memoryStore.data.conversations?.find((c) => c._id.toString() === id);
    if (conv) {
      conv.status = 'open';
      conv.assignedAgent = 'Chatbot';
    }

    res.json({
      success: true,
      message: 'Automated chatbot replies successfully resumed for this conversation.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversationSession = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const session = await BotEngine.getSession({ conversationId: id });
    res.json({ success: true, data: session });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

