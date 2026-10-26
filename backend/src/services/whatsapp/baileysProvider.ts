import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import {
  IWhatsAppProvider,
  ISendMessagePayload,
  IProviderResponse,
  IIncomingWebhookPayload,
  IConnectionTestResult,
} from './whatsappProvider.interface.js';
import { BotEngine } from './botEngine.js';
import { memoryStore } from '../store.js';
import { isDbConnected } from '../../config/db.js';
import { Contact } from '../../models/Contact.js';
import { Conversation } from '../../models/Conversation.js';
import { Message } from '../../models/Message.js';
import { BotSettings } from '../../models/BotSettings.js';

export class BaileysWhatsAppProvider implements IWhatsAppProvider {
  private static instance: BaileysWhatsAppProvider | null = null;
  private sock: WASocket | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private latestQR: string | null = null;
  private latestQRDataUrl: string | null = null;
  private connectedUser: { id: string; name?: string } | null = null;
  private processedIds = new Set<string>();
  private authDir: string;

  private constructor() {
    this.authDir = path.resolve(process.cwd(), '.baileys_auth');
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  public static getInstance(): BaileysWhatsAppProvider {
    if (!BaileysWhatsAppProvider.instance) {
      BaileysWhatsAppProvider.instance = new BaileysWhatsAppProvider();
    }
    return BaileysWhatsAppProvider.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      return;
    }

    this.isConnecting = true;
    console.log('[WhatsApp Web] Initializing WhatsApp Web (QR scan engine)...');

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['WhatBot Assistant', 'Chrome', '120.0.0'],
        syncFullHistory: false,
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.latestQR = qr;
          try {
            this.latestQRDataUrl = await QRCode.toDataURL(qr);
          } catch (e) {
            console.error('[WhatsApp Web] Failed to generate QR data URL:', e);
          }
          this.isConnected = false;

          console.log('\n=============================================================');
          console.log('📱 SCAN THIS WHATSAPP QR CODE WITH YOUR PHONE:');
          console.log('   1. Open WhatsApp on your phone');
          console.log('   2. Tap Settings (iOS) or 3 Dots (Android) > Linked Devices');
          console.log('   3. Tap "Link a Device" and scan the QR below');
          console.log('=============================================================');
          qrcodeTerminal.generate(qr, { small: true });
          console.log('=============================================================\n');
        }

        if (connection === 'open') {
          this.isConnected = true;
          this.isConnecting = false;
          this.latestQR = null;
          this.latestQRDataUrl = null;

          const rawId = this.sock?.user?.id || '';
          const cleanPhone = rawId.split(':')[0] || rawId.replace(/@.*$/, '');
          this.connectedUser = {
            id: `+${cleanPhone}`,
            name: this.sock?.user?.name || 'WhatsApp Agent',
          };

          console.log('\n✅ =========================================================');
          console.log(`🎉 [WhatsApp Web] Connected successfully!`);
          console.log(`📱 Phone Number : ${this.connectedUser.id}`);
          console.log(`👤 Profile Name : ${this.connectedUser.name}`);
          console.log(`🤖 WhatBot agent is now LIVE and listening to customer messages!`);
          console.log('=============================================================\n');
        }

        if (connection === 'close') {
          this.isConnected = false;
          this.isConnecting = false;
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          console.log(`[WhatsApp Web] Connection closed (status: ${statusCode}). Reconnecting: ${shouldReconnect}`);

          if (shouldReconnect) {
            setTimeout(() => this.initialize(), 4000);
          } else {
            console.log('[WhatsApp Web] Session logged out. Ready for new QR code scan.');
            this.clearSessionFolder();
            setTimeout(() => this.initialize(), 2000);
          }
        }
      });

      this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
          try {
            await this.handleIncomingMessage(msg);
          } catch (err: any) {
            console.error('[WhatsApp Web] Error processing incoming message:', err);
          }
        }
      });
    } catch (err: any) {
      this.isConnecting = false;
      console.error('[WhatsApp Web] Initialization failed:', err);
    }
  }

  private async handleIncomingMessage(msg: any): Promise<void> {
    if (!msg || !msg.message) return;
    if (msg.key.fromMe) return; // Ignore messages sent by the bot account itself

    const jid: string = msg.key.remoteJid || '';
    // Skip broadcast status messages
    if (jid === 'status@broadcast') return;
    // For 1-on-1 business automation, ignore group chats (@g.us) to prevent spam
    if (jid.endsWith('@g.us')) return;

    const messageId = msg.key.id;
    if (messageId && this.processedIds.has(messageId)) {
      return;
    }
    if (messageId) {
      this.processedIds.add(messageId);
      if (this.processedIds.size > 2000) {
        this.processedIds.clear();
      }
    }

    const messageContent = msg.message;
    const text: string = (
      messageContent?.conversation ||
      messageContent?.extendedTextMessage?.text ||
      messageContent?.buttonsResponseMessage?.selectedButtonId ||
      messageContent?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      messageContent?.templateButtonReplyMessage?.selectedId ||
      ''
    ).trim();

    const interactiveTitle: string =
      messageContent?.buttonsResponseMessage?.selectedDisplayText ||
      messageContent?.listResponseMessage?.singleSelectReply?.title ||
      '';

    const cleanDigits = jid.replace(/@.*$/, '').replace(/\D/g, '');
    if (!cleanDigits) return;
    const fromNumber = `+${cleanDigits}`;
    const senderName = msg.pushName || `WhatsApp User (${fromNumber.slice(-4)})`;

    console.log(`[WhatsApp Web] 📩 Received message from ${fromNumber} (${senderName}): "${text || '[Media]'}"`);

    // 1. Find or create Contact in MongoDB / memoryStore
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
        tags: ['WhatsApp Web Lead'],
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
      if (senderName && contact.name.startsWith('WhatsApp User')) {
        contact.name = senderName;
      }
    }

    // 2. Find or create Conversation
    let conv: any = memoryStore.data.conversations.find(
      (c) => c.contactId.toString() === contact._id.toString()
    );
    if (!conv && isDbConnected) {
      try {
        conv = await Conversation.findOne({ contactId: contact._id });
      } catch (e) {}
    }

    const displayText = text || '[Media message received]';

    if (!conv) {
      const newConvData = {
        _id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        contactId: contact._id,
        status: 'open',
        assignedAgent: 'Chatbot',
        lastMessageText: displayText,
        lastMessageTimestamp: new Date(),
        unreadCount: 1,
        tags: ['WhatsApp Web'],
        internalNotes: 'Created via WhatsApp Web connection.',
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

    // 3. Save incoming customer message
    const incomingMsg = {
      _id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId: conv._id,
      contactId: contact._id,
      sender: 'customer' as const,
      text: displayText,
      messageType: 'text' as const,
      status: 'delivered' as const,
      timestamp: new Date(),
      metadata: {
        waMessageId: messageId,
        provider: 'baileys',
      },
    };

    if (isDbConnected) {
      try {
        await Message.create(incomingMsg);
      } catch (e) {}
    }
    memoryStore.data.messages.push(incomingMsg);

    // 4. Check if Bot is enabled
    let botSettings = null;
    if (isDbConnected) {
      try {
        botSettings = await BotSettings.findOne();
      } catch (e) {}
    }
    if (!botSettings) {
      botSettings = memoryStore.data.botSettings;
    }
    const isBotEnabled = botSettings ? botSettings.isEnabled !== false : true;

    if (!isBotEnabled) {
      console.log(`[WhatsApp Web] Bot is disabled in settings. Skipping automated reply for ${fromNumber}.`);
      return;
    }

    if (!text) {
      return;
    }

    // 5. Evaluate response with BotEngine
    const botDecision = await BotEngine.evaluateMessage(
      text,
      {
        conversationId: conv._id.toString(),
        contactId: contact._id.toString(),
        contactName: senderName,
        contactPhone: fromNumber,
      },
      {
        interactiveId: text,
        interactiveTitle: interactiveTitle,
      }
    );

    if (botDecision.action !== 'none' && botDecision.responseText) {
      console.log(`[WhatsApp Web] 🤖 Bot replying to ${fromNumber}: "${botDecision.responseText.slice(0, 60)}..."`);

      // Dispatch reply via WhatsApp socket
      try {
        const sendResult = await this.sock?.sendMessage(jid, {
          text: botDecision.responseText,
        });

        const botReplyMsg = {
          _id: `msg_bot_${Date.now() + 200}_${Math.random().toString(36).substring(2, 6)}`,
          conversationId: conv._id,
          contactId: contact._id,
          sender: 'bot' as const,
          text: botDecision.responseText,
          messageType: 'text' as const,
          mediaUrl: botDecision.mediaUrl || '',
          status: 'sent' as const,
          timestamp: new Date(Date.now() + 200),
          metadata: {
            matchedRule: botDecision.matchedRuleName || botDecision.reason,
            waMessageId: sendResult?.key?.id,
            provider: 'baileys',
          },
        };

        if (isDbConnected) {
          try {
            await Message.create(botReplyMsg);
          } catch (e) {}
        }
        memoryStore.data.messages.push(botReplyMsg);

        conv.lastMessageText = botDecision.responseText;
        conv.lastMessageTimestamp = new Date();
      } catch (sendErr: any) {
        console.error('[WhatsApp Web] Failed to send bot reply:', sendErr);
      }
    }
  }

  public async sendMessage(payload: ISendMessagePayload): Promise<IProviderResponse> {
    const rawNumber = payload.to.replace(/\D/g, '');
    const jid = `${rawNumber}@s.whatsapp.net`;

    if (!this.isConnected || !this.sock) {
      return {
        success: false,
        status: 'failed',
        messageId: '',
        timestamp: new Date().toISOString(),
        provider: 'baileys',
        error: 'WhatsApp Web is not connected. Please scan the QR code first.',
      };
    }

    try {
      let result;
      if (payload.type === 'image' && payload.mediaUrl) {
        result = await this.sock.sendMessage(jid, {
          image: { url: payload.mediaUrl },
          caption: payload.text || '',
        });
      } else {
        result = await this.sock.sendMessage(jid, {
          text: payload.text || '',
        });
      }

      return {
        success: true,
        status: 'sent',
        messageId: result?.key?.id || `wa_web_${Date.now()}`,
        timestamp: new Date().toISOString(),
        provider: 'baileys',
      };
    } catch (err: any) {
      console.error('[WhatsApp Web] Error sending message:', err);
      return {
        success: false,
        status: 'failed',
        messageId: '',
        timestamp: new Date().toISOString(),
        provider: 'baileys',
        error: err.message,
      };
    }
  }

  public verifyWebhook(): string | null {
    return 'ok';
  }

  public async processIncomingWebhook(): Promise<any> {
    return { processed: true, messagesCount: 0, statusesCount: 0, events: [] };
  }

  public async testConnection(): Promise<IConnectionTestResult> {
    if (this.isConnected && this.sock) {
      return {
        connected: true,
        provider: 'baileys',
        message: `WhatsApp Web is actively connected! Logged in as: ${this.connectedUser?.id || 'Connected'}`,
        details: {
          phoneNumberId: this.connectedUser?.id,
          verifiedName: this.connectedUser?.name,
          userId: this.connectedUser?.id,
        },
      };
    }

    return {
      connected: false,
      provider: 'baileys',
      message: this.latestQR
        ? 'Waiting for QR code scan. Open WhatsApp > Linked Devices and scan the code.'
        : 'Connecting to WhatsApp Web server...',
    };
  }

  public getStatus() {
    return {
      name: 'WhatsApp Web (QR Scan)',
      mode: 'qr' as const,
      isReady: this.isConnected,
      description: this.isConnected
        ? `Linked to WhatsApp as ${this.connectedUser?.id}`
        : 'Waiting for QR code scan',
    };
  }

  public getQRStatus() {
    return {
      isConnected: this.isConnected,
      user: this.connectedUser,
      qrRaw: this.latestQR,
      qrDataUrl: this.latestQRDataUrl,
    };
  }

  public async logout(): Promise<void> {
    try {
      if (this.sock) {
        await this.sock.logout();
      }
    } catch (e) {}

    this.isConnected = false;
    this.connectedUser = null;
    this.latestQR = null;
    this.latestQRDataUrl = null;
    this.clearSessionFolder();
    await this.initialize();
  }

  private clearSessionFolder() {
    try {
      if (fs.existsSync(this.authDir)) {
        fs.rmSync(this.authDir, { recursive: true, force: true });
        fs.mkdirSync(this.authDir, { recursive: true });
      }
    } catch (e) {
      console.warn('[WhatsApp Web] Error clearing auth session directory:', e);
    }
  }
}
