import { v4 as uuidv4 } from 'uuid';
import {
  IWhatsAppProvider,
  ISendMessagePayload,
  IProviderResponse,
  IIncomingWebhookPayload,
  IConnectionTestResult,
} from './whatsappProvider.interface.js';
import { BotEngine } from './botEngine.js';

export class DemoWhatsAppProvider implements IWhatsAppProvider {
  public async sendMessage(payload: ISendMessagePayload): Promise<IProviderResponse> {
    const messageId = `wamid.DEMO_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    console.log(`[DemoProvider] Sent simulated WhatsApp message to ${payload.to} (ID: ${messageId})`);

    return {
      success: true,
      messageId,
      timestamp: new Date().toISOString(),
      status: 'delivered',
      provider: 'demo',
    };
  }

  public verifyWebhook(mode: string, token: string, challenge: string): string | null {
    // In demo mode, verify immediately if challenge provided
    console.log(`[DemoProvider] Webhook verification request received (mode=${mode}, token=${token})`);
    if (mode === 'subscribe') {
      return challenge;
    }
    return null;
  }

  public async processIncomingWebhook(payload: IIncomingWebhookPayload): Promise<{
    processed: boolean;
    messagesCount: number;
    statusesCount: number;
    events: any[];
  }> {
    const events: any[] = [];
    let messagesCount = 0;
    let statusesCount = 0;

    if (!payload?.entry) {
      return { processed: false, messagesCount: 0, statusesCount: 0, events: [] };
    }

    for (const entry of payload.entry) {
      for (const change of entry.changes || []) {
        const val = change.value;
        if (val?.messages) {
          for (const msg of val.messages) {
            messagesCount++;
            const senderProfile = val.contacts?.find((c: any) => c.wa_id === msg.from)?.profile?.name || '';
            let text = '';
            if (msg.type === 'text') {
              text = msg.text?.body || '';
            } else if (msg.type === 'interactive') {
              text =
                msg.interactive?.button_reply?.title ||
                msg.interactive?.button_reply?.id ||
                msg.interactive?.list_reply?.title ||
                msg.interactive?.list_reply?.id ||
                '';
            } else if (msg.type === 'button') {
              text = msg.button?.text || msg.button?.payload || '';
            } else {
              text = (msg as any)[msg.type]?.caption || '';
            }

            events.push({
              type: 'incoming_message',
              from: msg.from,
              messageId: msg.id,
              senderName: senderProfile,
              text,
              messageType: msg.type || 'text',
              timestamp: msg.timestamp,
              raw: msg,
            });
          }
        }
        if (val?.statuses) {
          for (const st of val.statuses) {
            statusesCount++;
            events.push({
              type: 'status_update',
              recipientId: st.recipient_id,
              status: st.status,
              messageId: st.id,
              timestamp: st.timestamp,
            });
          }
        }
      }
    }

    return {
      processed: true,
      messagesCount,
      statusesCount,
      events,
    };
  }

  public async testConnection(): Promise<IConnectionTestResult> {
    // Demo mode test: Always succeeds with simulated sandbox environment credentials
    return {
      connected: true,
      provider: 'demo',
      message: 'Demo Sandbox is active and operational. Messages and bots are simulated locally.',
      details: {
        wabaId: 'demo_waba_1002938485',
        phoneNumberId: 'demo_phone_2039485761',
        verifiedName: 'WhatBot Demo Business',
        qualityRating: 'HIGH (GREEN)',
        codeVerificationStatus: 'VERIFIED (SIMULATED)',
      },
    };
  }

  public getStatus() {
    return {
      name: 'Demo WhatsApp Sandbox Provider',
      mode: 'demo' as const,
      isReady: true,
      description: 'Simulates WhatsApp messages, instant keyword replies, and webhooks locally without Meta API credentials.',
    };
  }
}
