import { Request, Response } from 'express';
import { WhatsAppProviderFactory } from '../services/whatsapp/providerFactory.js';
import { Conversation } from '../models/Conversation.js';
import { Contact } from '../models/Contact.js';
import { Message } from '../models/Message.js';
import { BotSettings } from '../models/BotSettings.js';
import { ApiConfig } from '../models/ApiConfig.js';
import { BotEngine } from '../services/whatsapp/botEngine.js';
import { memoryStore } from '../services/store.js';
import { isDbConnected } from '../config/db.js';

// In-memory deduplication cache for WhatsApp webhook events (TTL 15 minutes)
const PROCESSED_TTL_MS = 15 * 60 * 1000;
const processedMessageIds = new Map<string, number>();

/**
 * Check if a message has already been processed within the TTL window
 */
export const isDuplicateMessage = (id?: string): boolean => {
  if (!id) return false;
  const now = Date.now();

  // Periodically purge old IDs
  for (const [key, timestamp] of processedMessageIds.entries()) {
    if (now - timestamp > PROCESSED_TTL_MS) {
      processedMessageIds.delete(key);
    }
  }

  if (processedMessageIds.has(id)) {
    return true;
  }

  processedMessageIds.set(id, now);
  return false;
};

/**
 * Reset deduplication cache (useful for automated testing)
 */
export const resetDeduplicationCache = () => {
  processedMessageIds.clear();
};

/**
 * GET /api/webhooks/whatsapp
 * Meta WhatsApp Cloud API Webhook Verification Handshake
 * Validates hub.mode, hub.verify_token, and responds with hub.challenge
 */
export const verifyWebhook = async (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  // Read verification token from environment variable or database configuration
  let expectedToken =
    process.env.WHATSAPP_VERIFY_TOKEN ||
    process.env.META_VERIFY_TOKEN;

  if (!expectedToken && isDbConnected) {
    try {
      const apiConfig = await ApiConfig.findOne();
      expectedToken = apiConfig?.webhookVerifyToken;
    } catch (e) {
      console.warn('[Webhook] Error reading ApiConfig verify token:', e);
    }
  }

  if (!expectedToken) {
    expectedToken = 'whatbot_secure_token';
  }

  if (mode === 'subscribe' && token && token === expectedToken) {
    console.log('[Webhook] GET verification successful. Handshake verified with challenge.');
    return res.status(200).send(challenge);
  }

  console.warn('[Webhook] GET verification failed: hub.verify_token mismatch or invalid hub.mode.');
  return res.status(403).send('Verification token mismatch');
};

/**
 * POST /api/webhooks/whatsapp
 * Meta WhatsApp Cloud API Webhook Event Handler
 * Processes incoming customer messages, delivery status updates, and executes automated replies.
 */
export const receiveWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const provider = await WhatsAppProviderFactory.getProvider();
    const result = await provider.processIncomingWebhook(payload);

    if (!result.processed) {
      return res.status(200).json({ success: true, processed: false, reason: 'Unrecognized webhook format' });
    }

    // Fetch active bot settings to check if automated replies are enabled
    let botSettings = null;
    if (isDbConnected) {
      try {
        botSettings = await BotSettings.findOne();
      } catch (e) {
        console.warn('[Webhook] Error fetching BotSettings from DB:', e);
      }
    }
    if (!botSettings) {
      botSettings = memoryStore.data.botSettings;
    }
    const isBotEnabled = botSettings ? botSettings.isEnabled !== false : true;

    for (const event of result.events) {
      // 1. Process Delivery and Read Status Updates
      if (event.type === 'status_update') {
        const { messageId, status, recipientId } = event;
        console.log(`[Webhook] Delivery status update received: ${messageId} -> ${status} for ${recipientId}`);

        if (messageId && status) {
          if (isDbConnected) {
            try {
              await Message.updateMany(
                { 'metadata.waMessageId': messageId },
                { status: status }
              );
            } catch (e) {
              console.warn('[Webhook] Error updating message status in DB:', e);
            }
          }

          const memMsg = memoryStore.data.messages.find(
            (m: any) => m.metadata?.waMessageId === messageId || m._id === messageId
          );
          if (memMsg) {
            memMsg.status = status;
          }
        }
        continue;
      }

      // 2. Process Incoming Customer Messages
      if (event.type === 'incoming_message') {
        const rawFrom = (event.from || '').replace(/\D/g, '');
        const fromNumber = rawFrom.startsWith('+') ? rawFrom : `+${rawFrom}`;
        const senderName = event.senderName || `WhatsApp Customer (${fromNumber.slice(-4)})`;
        const text = (event.text || '').trim();
        const messageType = event.messageType || 'text';
        const waMessageId = event.messageId;

        // Protection against duplicate processing
        if (waMessageId && isDuplicateMessage(waMessageId)) {
          console.log(`[Webhook] Duplicate incoming message ${waMessageId} ignored.`);
          continue;
        }

        // Find or create Contact in MongoDB / Memory
        let contact: any = memoryStore.data.contacts.find(
          (c) => c.phoneNumber.replace(/\D/g, '') === fromNumber.replace(/\D/g, '')
        );
        if (!contact && isDbConnected) {
          try {
            contact = await Contact.findOne({ phoneNumber: fromNumber });
          } catch (e) {}
        }

        if (!contact) {
          const newContactData = {
            _id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: senderName,
            phoneNumber: fromNumber,
            tags: ['Incoming Lead', 'WhatsApp Cloud API'],
            status: 'active',
            lastInteractionAt: new Date(),
            unreadCount: 1,
            assignedAgent: 'Chatbot',
          };
          if (isDbConnected) {
            try {
              contact = await Contact.create(newContactData);
            } catch (e) {
              contact = newContactData;
            }
          } else {
            contact = newContactData;
          }
          memoryStore.data.contacts.unshift(contact);
        } else {
          contact.lastInteractionAt = new Date();
          if (senderName && contact.name.startsWith('WhatsApp Customer')) {
            contact.name = senderName;
          }
        }

        // Find or create Conversation in MongoDB / Memory
        let conv: any = memoryStore.data.conversations.find(
          (c) => c.contactId.toString() === contact._id.toString()
        );
        if (!conv && isDbConnected) {
          try {
            conv = await Conversation.findOne({ contactId: contact._id });
          } catch (e) {}
        }

        const displayText = text || (messageType !== 'text' ? `[${messageType.toUpperCase()} received]` : '');

        if (!conv) {
          const newConvData = {
            _id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            contactId: contact._id,
            status: 'open',
            assignedAgent: 'Chatbot',
            lastMessageText: displayText,
            lastMessageTimestamp: new Date(),
            unreadCount: 1,
            tags: contact.tags || ['WhatsApp'],
            internalNotes: 'Created via incoming WhatsApp Cloud API webhook.',
          };
          if (isDbConnected) {
            try {
              conv = await Conversation.create(newConvData);
            } catch (e) {
              conv = newConvData;
            }
          } else {
            conv = newConvData;
          }
          memoryStore.data.conversations.unshift(conv);
        } else {
          conv.lastMessageText = displayText;
          conv.lastMessageTimestamp = new Date();
          conv.unreadCount = (conv.unreadCount || 0) + 1;
          if (isDbConnected) {
            try {
              await Conversation.findByIdAndUpdate(conv._id, {
                lastMessageText: conv.lastMessageText,
                lastMessageTimestamp: conv.lastMessageTimestamp,
                unreadCount: conv.unreadCount,
              });
            } catch (e) {}
          }
        }

        const allowedMessageTypes = ['text', 'image', 'document', 'template', 'system', 'interactive', 'button', 'audio', 'video', 'location'];
        const incomingMsg = {
          _id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          conversationId: conv._id,
          contactId: contact._id,
          sender: 'customer' as const,
          text: displayText,
          messageType: (allowedMessageTypes.includes(messageType) ? messageType : 'text') as any,
          status: 'delivered' as const,
          timestamp: new Date(),
          metadata: { waMessageId: waMessageId },
        };

        if (isDbConnected) {
          try {
            await Message.create(incomingMsg);
          } catch (e) {
            console.warn('[Webhook] Error inserting customer message to DB:', e);
          }
        }
        memoryStore.data.messages.push(incomingMsg);

        // Check if bot is disabled in settings
        if (!isBotEnabled) {
          console.log(`[Webhook] Bot is disabled in settings. Stored incoming message from ${fromNumber} for live agent queue; skipping automated reply.`);
          continue;
        }

        // Safely ignore or skip automated evaluation if message has no text
        if (!text) {
          console.log(`[Webhook] Received non-text message (${messageType}) from ${fromNumber}. No text content to evaluate.`);
          continue;
        }

        // Evaluate automated response via stateful BotEngine
        const botDecision = await BotEngine.evaluateMessage(text, {
          conversationId: conv._id.toString(),
          contactId: contact._id.toString(),
          contactName: senderName,
          contactPhone: fromNumber,
        });

        if (botDecision.action !== 'none' && botDecision.responseText) {
          // Prepare bot reply record
          const botReplyMsg = {
            _id: `msg_bot_${Date.now() + 500}_${Math.random().toString(36).substring(2, 6)}`,
            conversationId: conv._id,
            contactId: contact._id,
            sender: 'bot' as const,
            text: botDecision.responseText,
            messageType: 'text' as const,
            mediaUrl: botDecision.mediaUrl || '',
            status: 'sent' as const,
            timestamp: new Date(Date.now() + 500),
            metadata: {
              matchedRule: botDecision.matchedRuleName || botDecision.reason,
              waMessageId: '',
            },
          };

          // Dispatch reply via active provider (Meta Cloud API or Demo Sandbox)
          const sendResult = await provider.sendMessage({
            to: fromNumber,
            type: 'text',
            text: botDecision.responseText,
          });

          if (sendResult?.messageId) {
            botReplyMsg.metadata.waMessageId = sendResult.messageId;
          }

          if (isDbConnected) {
            try {
              await Message.create(botReplyMsg);
            } catch (e) {
              console.warn('[Webhook] Error persisting bot reply to DB:', e);
            }
          }
          memoryStore.data.messages.push(botReplyMsg);

          // Update conversation last message status
          conv.lastMessageText = botDecision.responseText;
          conv.lastMessageTimestamp = new Date();
          conv.unreadCount = 0; // Bot answered immediately

          if (isDbConnected) {
            try {
              await Conversation.findByIdAndUpdate(conv._id, {
                lastMessageText: conv.lastMessageText,
                lastMessageTimestamp: conv.lastMessageTimestamp,
                unreadCount: conv.unreadCount,
              });
            } catch (e) {}
          }
        }
      }
    }

    // Always return HTTP 200 OK to Meta to acknowledge receipt
    res.status(200).json({ success: true, processed: result.processed });
  } catch (err: any) {
    console.error('[Webhook] Error processing incoming payload:', err.message);
    // Returning 200 with error info prevents Meta from endless retries and account warnings
    res.status(200).json({ success: true, warning: 'Processed with errors', error: err.message });
  }
};
