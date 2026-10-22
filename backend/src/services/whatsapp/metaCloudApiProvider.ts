import crypto from 'crypto';
import {
  IWhatsAppProvider,
  ISendMessagePayload,
  IProviderResponse,
  IIncomingWebhookPayload,
  IConnectionTestResult,
} from './whatsappProvider.interface.js';

export interface IMetaConfig {
  wabaId?: string;
  phoneNumberId: string;
  accessToken: string;
  webhookVerifyToken: string;
  metaVersion?: string;
  appSecret?: string;
}

/**
 * Meta Cloud API Provider (Official WhatsApp Business Cloud API)
 * Handles sending messages, verifying webhooks, and parsing incoming Meta payloads.
 */
export class MetaCloudApiProvider implements IWhatsAppProvider {
  private config: IMetaConfig;
  private baseUrl: string;

  constructor(config: IMetaConfig) {
    this.config = config;
    const version = config.metaVersion || 'v20.0';
    this.baseUrl = `https://graph.facebook.com/${version}`;
  }

  /**
   * Send WhatsApp Message via Meta Graph API
   */
  public async sendMessage(payload: ISendMessagePayload): Promise<IProviderResponse> {
    if (!this.config.accessToken || !this.config.phoneNumberId) {
      return {
        success: false,
        messageId: '',
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: 'Meta WhatsApp credentials missing: Phone Number ID or Access Token not configured.',
        provider: 'meta_cloud',
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s request timeout

    try {
      const cleanTo = payload.to.replace(/\D/g, ''); // Numbers only

      // Build WhatsApp Graph API payload format
      let body: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
      };

      if (payload.type === 'text') {
        body.type = 'text';
        body.text = { preview_url: false, body: payload.text || '' };
      } else if (payload.type === 'image') {
        body.type = 'image';
        body.image = { link: payload.mediaUrl, caption: payload.text || '' };
      } else if (payload.type === 'document') {
        body.type = 'document';
        body.document = {
          link: payload.mediaUrl,
          caption: payload.text || '',
          filename: payload.fileName || 'file.pdf',
        };
      } else if (payload.type === 'template' && payload.template) {
        body.type = 'template';
        body.template = {
          name: payload.template.name,
          language: { code: payload.template.language || 'en_US' },
          components: payload.template.components || [],
        };
      } else {
        body.type = 'text';
        body.text = { preview_url: false, body: payload.text || '' };
      }

      const endpoint = `${this.baseUrl}/${this.config.phoneNumberId}/messages`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const responseData: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg =
          responseData?.error?.message ||
          `HTTP ${response.status}: Failed to send message via Meta Graph API`;
        const errorCode = responseData?.error?.code;
        // Never log accessToken or secrets
        console.error(`[MetaCloudApiProvider] Error sending message (Code: ${errorCode || 'N/A'}):`, errorMsg);
        return {
          success: false,
          messageId: '',
          timestamp: new Date().toISOString(),
          status: 'failed',
          error: errorMsg,
          provider: 'meta_cloud',
        };
      }

      const waMsgId = responseData?.messages?.[0]?.id || `wamid.META_${Date.now()}`;
      return {
        success: true,
        messageId: waMsgId,
        timestamp: new Date().toISOString(),
        status: 'sent',
        provider: 'meta_cloud',
      };
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError';
      const errorMsg = isTimeout ? 'Request timed out after 10000ms' : err.message;
      console.error('[MetaCloudApiProvider] Network/API Error:', errorMsg);
      return {
        success: false,
        messageId: '',
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: errorMsg,
        provider: 'meta_cloud',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Verify Webhook challenge from Meta WhatsApp
   * Validates hub.mode == 'subscribe' and hub.verify_token
   */
  public verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token && token === this.config.webhookVerifyToken) {
      console.log('[MetaCloudApiProvider] Webhook verification handshake successful');
      return challenge;
    }
    console.warn('[MetaCloudApiProvider] Webhook verification failed. Token mismatch.');
    return null;
  }

  /**
   * Verify X-Hub-Signature-256 header when WHATSAPP_APP_SECRET is configured
   */
  public verifySignature(payloadBody: string | Buffer, signatureHeader?: string): boolean {
    if (!this.config.appSecret || !signatureHeader) {
      return true; // Pass if secret not configured
    }

    try {
      const signatureParts = signatureHeader.split('=');
      if (signatureParts.length !== 2 || signatureParts[0] !== 'sha256') {
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.config.appSecret)
        .update(payloadBody)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signatureParts[1], 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (e) {
      console.error('[MetaCloudApiProvider] Signature verification error');
      return false;
    }
  }

  /**
   * Process incoming Webhook notification from Meta Cloud API
   * Supports text messages, interactive button/list replies, and delivery status updates.
   */
  public async processIncomingWebhook(payload: IIncomingWebhookPayload | any): Promise<{
    processed: boolean;
    messagesCount: number;
    statusesCount: number;
    events: any[];
  }> {
    const events: any[] = [];
    let messagesCount = 0;
    let statusesCount = 0;

    if (!payload || payload.object !== 'whatsapp_business_account' || !payload.entry) {
      return { processed: false, messagesCount: 0, statusesCount: 0, events: [] };
    }

    for (const entry of payload.entry) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          const val = change.value;
          if (!val) continue;

          // 1. Process incoming customer messages
          if (val.messages && val.messages.length > 0) {
            for (const msg of val.messages) {
              messagesCount++;
              const contactProfile =
                val.contacts?.find((c: any) => c.wa_id === msg.from)?.profile?.name || '';

              // Safely extract text from text, interactive button/list replies, or quick replies
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
                // Non-text message (e.g. image caption, document caption, audio, etc.)
                text = (msg as any)[msg.type]?.caption || '';
              }

              events.push({
                type: 'incoming_message',
                messageId: msg.id,
                from: msg.from,
                senderName: contactProfile,
                timestamp: msg.timestamp,
                messageType: msg.type,
                text,
                raw: msg,
              });
            }
          }

          // 2. Process delivery and read status updates
          if (val.statuses && val.statuses.length > 0) {
            for (const status of val.statuses) {
              statusesCount++;
              events.push({
                type: 'status_update',
                messageId: status.id,
                recipientId: status.recipient_id,
                status: status.status, // 'sent', 'delivered', 'read', 'failed'
                timestamp: status.timestamp,
                errors: (status as any).errors,
              });
            }
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

  /**
   * Test connection to Meta Graph API
   */
  public async testConnection(): Promise<IConnectionTestResult> {
    if (!this.config.accessToken || !this.config.phoneNumberId) {
      return {
        connected: false,
        provider: 'meta_cloud',
        message: 'Cannot connect: Phone Number ID or Access Token is missing in configuration.',
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const endpoint = `${this.baseUrl}/${this.config.phoneNumberId}?fields=verified_name,code_verification_status,quality_rating,display_phone_number`;
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
        signal: controller.signal,
      });

      const data: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          connected: false,
          provider: 'meta_cloud',
          message: data?.error?.message || `Failed to verify Meta Cloud API (HTTP ${response.status})`,
        };
      }

      return {
        connected: true,
        provider: 'meta_cloud',
        message: `Successfully connected to WhatsApp Business Account (${data.verified_name || data.display_phone_number || this.config.phoneNumberId})`,
        details: {
          phoneNumberId: this.config.phoneNumberId,
          verifiedName: data.verified_name,
          qualityRating: data.quality_rating,
          codeVerificationStatus: data.code_verification_status,
        },
      };
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError';
      return {
        connected: false,
        provider: 'meta_cloud',
        message: isTimeout
          ? 'Network timeout reaching Meta API servers.'
          : `Network error reaching Meta API servers: ${err.message}`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  public getStatus() {
    const hasCredentials = Boolean(this.config.accessToken && this.config.phoneNumberId);
    return {
      name: 'Meta Cloud API Provider',
      mode: 'live' as const,
      isReady: hasCredentials,
      description: hasCredentials
        ? `Connected to official Meta Graph API ${this.baseUrl.split('/').pop()} endpoint.`
        : 'Awaiting WhatsApp Cloud API Access Token and Phone Number ID.',
    };
  }
}
