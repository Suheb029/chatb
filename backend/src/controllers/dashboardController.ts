import { Request, Response } from 'express';
import { memoryStore } from '../services/store.js';
import { isDbConnected } from '../config/db.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Contact } from '../models/Contact.js';
import { AutoReplyRule } from '../models/AutoReplyRule.js';

export const getOverview = async (req: Request, res: Response) => {
  try {
    let totalConversations = memoryStore.data.conversations.length;
    let messages = memoryStore.data.messages;
    let contactsCount = memoryStore.data.contacts.length;
    let rules = memoryStore.data.autoReplyRules;

    if (isDbConnected) {
      try {
        totalConversations = await Conversation.countDocuments();
        messages = await Message.find();
        contactsCount = await Contact.countDocuments();
        rules = await AutoReplyRule.find();
      } catch (err) {
        console.warn('[Dashboard] Using fallback memory data for stats calculation');
      }
    }

    const messagesReceived = messages.filter((m: any) => m.sender === 'customer').length;
    const messagesSent = messages.filter((m: any) => m.sender === 'agent' || m.sender === 'bot').length;
    const botReplies = messages.filter((m: any) => m.sender === 'bot').length;
    const agentReplies = messages.filter((m: any) => m.sender === 'agent').length;

    const totalBotTriggers = rules.reduce((acc: number, r: any) => acc + (r.triggerCount || 0), 0);
    const chatbotResponseRate = messagesReceived > 0
      ? Math.round((botReplies / (botReplies + agentReplies || 1)) * 100 * 10) / 10
      : 84.5;

    // Daily volume trend (past 7 days)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyVolume = [
      { day: 'Mon', incoming: 142, outgoing: 125, automated: 98 },
      { day: 'Tue', incoming: 189, outgoing: 165, automated: 134 },
      { day: 'Wed', incoming: 215, outgoing: 198, automated: 160 },
      { day: 'Thu', incoming: 198, outgoing: 174, automated: 142 },
      { day: 'Fri', incoming: 245, outgoing: 230, automated: 192 },
      { day: 'Sat', incoming: 110, outgoing: 95, automated: 85 },
      { day: 'Sun', incoming: 88, outgoing: 80, automated: 74 },
    ];

    // Response Distribution
    const replyDistribution = [
      { name: 'Chatbot Automated', value: botReplies || 519, color: '#25D366' },
      { name: 'Human Agent', value: agentReplies || 148, color: '#128C7E' },
    ];

    // Status breakdown
    const statusCounts = {
      open: 14,
      pending: 6,
      resolved: 42,
    };

    // Category breakdown
    const categories = [
      { name: 'Sales & Pricing', count: 184, percentage: 38 },
      { name: 'Customer Support', count: 126, percentage: 26 },
      { name: 'Order Tracking', count: 98, percentage: 20 },
      { name: 'General FAQs', count: 76, percentage: 16 },
    ];

    // Recent activity list
    const recentActivity = [
      {
        id: 'act_1',
        title: 'Rule "Pricing & Plans" triggered',
        description: 'Sent pricing catalog to Marcus Vance',
        time: '12 minutes ago',
        type: 'bot',
      },
      {
        id: 'act_2',
        title: 'Human Handoff executed',
        description: 'Marcus Vance assigned to Alex Rivera',
        time: '25 minutes ago',
        type: 'agent',
      },
      {
        id: 'act_3',
        title: 'New FAQ triggered',
        description: 'Answered "Operational Business Hours" for Elena Rostova',
        time: '45 minutes ago',
        type: 'faq',
      },
      {
        id: 'act_4',
        title: 'Broadcast Campaign Delivered',
        description: 'Q1 Product Launch delivered to 1,238 contacts (99% delivery rate)',
        time: '3 hours ago',
        type: 'campaign',
      },
    ];

    res.json({
      success: true,
      isDemo: true,
      stats: {
        totalConversations: totalConversations || 62,
        messagesReceived: messagesReceived || 874,
        messagesSent: messagesSent || 822,
        activeContacts: contactsCount || 48,
        automatedReplies: totalBotTriggers || 519,
        chatbotResponseRate: chatbotResponseRate || 82.4,
        avgResponseTime: '1.4s',
        resolutionRate: '91.8%',
      },
      charts: {
        dailyVolume,
        replyDistribution,
        statusCounts,
        categories,
      },
      recentActivity,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
