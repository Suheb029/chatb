import crypto from 'crypto';
import {
  IWhatsAppProvider,
  ISendMessagePayload,
  IProviderResponse,
  IIncomingWebhookPayload,
  IConnectionTestResult,
} from './whatsappProvider.interface.js';
import { maskPhoneNumber } from '../../config/whatsappConfig.js';

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
      const missingKeys = [];
      if (!this.config.phoneNumberId) missingKeys.push('WHATSAPP_PHONE_NUMBER_ID');
      if (!this.config.accessToken) missingKeys.push('WHATSAPP_ACCESS_TOKEN');

      const errorMsg = `Meta WhatsApp credentials missing: ${missingKeys.join(' and ')} not configured.`;
      console.error(`[MetaCloudApiProvider] ❌ Configuration Error: ${errorMsg}`);

      return {
        success: false,
        messageId: '',
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: errorMsg,
        errorCode: 'MISSING_CREDENTIALS',
        diagnostic:
          'Live mode requires valid Meta Cloud API credentials. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in backend/.env or configure them in the Settings dashboard.',
        isPermanentError: true,
        provider: 'meta_cloud',
      };
    }

    const cleanTo = (payload.to || '').replace(/\D/g, '');
    if (!cleanTo || cleanTo.length < 7 || cleanTo.length > 15) {
      const errorMsg = `Invalid recipient phone number format: "${payload.to}". Must be a valid international E.164 number.`;
      console.error(`[MetaCloudApiProvider] ❌ Validation Error: ${errorMsg}`);
      return {
        success: false,
        messageId: '',
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: errorMsg,
        errorCode: 'INVALID_RECIPIENT_NUMBER',
        diagnostic:
          'Recipient phone number must contain between 7 and 15 digits according to the international E.164 standard without dummy characters.',
        isPermanentError: true,
        provider: 'meta_cloud',
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s request timeout

    try {
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
        const errObj = responseData?.error || {};
        const errorCode = errObj.code;
        const errorSubcode = errObj.error_subcode;
        const errorType = errObj.type || 'OAuthException';
        const rawMessage =
          errObj.message || `HTTP ${response.status}: Failed to send message via Meta Graph API`;
        const errorDetails = errObj.error_data?.details || '';
        const fbtraceId = errObj.fbtrace_id || '';

        const isRecipientNotAllowed = errorCode === 131030 || rawMessage.includes('131030');

        let diagnostic = errorDetails || rawMessage;
        if (isRecipientNotAllowed) {
          diagnostic =
            `Meta Graph API Error 131030: Recipient phone number not in allowed list.\n` +
            `• Test Phone Number (Development Mode): When using a Meta sandbox test number, messages can ONLY be sent to recipient phone numbers explicitly added to your Meta App's allowed recipients list. Navigate to: Meta App Dashboard > WhatsApp > API Setup > 'To' phone number field > Manage phone number list, and add/verify ${maskPhoneNumber(cleanTo)}.\n` +
            `• Production Phone Number: Verify that the configured WHATSAPP_PHONE_NUMBER_ID (${this.config.phoneNumberId}) is correct and belongs to a live, verified WhatsApp Business Account with an active payment method.\n` +
            `• Important: Code changes cannot bypass Meta's allowlist security restriction. You must register the recipient number in the Meta App Dashboard or switch to an approved live production number.`;

          console.error(
            `[MetaCloudApiProvider] Error sending message (Code: 131030, Trace: ${fbtraceId || 'N/A'}): ` +
            `Sender Phone Number ID: ${this.config.phoneNumberId}, Recipient: ${maskPhoneNumber(cleanTo)}. ` +
            `Recipient is not in Meta allowed list.`
          );
        } else {
          console.error(
            `[MetaCloudApiProvider] Error sending message (Code: ${errorCode || 'N/A'}, Trace: ${fbtraceId || 'N/A'}): ${rawMessage}`
          );
        }

        const permanentCodes = [131030, 100, 131026, 131047, 131051, 132000, 132001, 190];
        const isPermanentError =
          isRecipientNotAllowed || (typeof errorCode === 'number' && permanentCodes.includes(errorCode));

        return {
          success: false,
          messageId: '',
          timestamp: new Date().toISOString(),
          status: 'failed',
          error: rawMessage,
          errorCode,
          errorSubcode,
          errorType,
          errorDetails,
          traceId: fbtraceId,
          diagnostic,
          isPermanentError,
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
        errorCode: isTimeout ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
        diagnostic: isTimeout
          ? 'Network request to Meta Graph API timed out after 10000ms.'
          : `Network error reaching Meta Graph API: ${err.message}`,
        isPermanentError: false,
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
    const expectedToken = (this.config.webhookVerifyToken || '').trim();
    if (!expectedToken) {
      console.error('[MetaCloudApiProvider] Webhook verification failed: No verify token configured.');
      return null;
    }
    if (mode === 'subscribe' && token && token.trim() === expectedToken) {
      console.log('[MetaCloudApiProvider] Webhook verification handshake successful');
      return challenge;
    }
    console.warn('[MetaCloudApiProvider] Webhook verification failed. Token mismatch or invalid mode.');
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
              let interactiveId = '';
              let interactiveTitle = '';

              if (msg.type === 'text') {
                text = msg.text?.body || '';
              } else if (msg.type === 'interactive') {
                const ir = msg.interactive;
                if (ir?.button_reply) {
                  interactiveId = ir.button_reply.id || '';
                  interactiveTitle = ir.button_reply.title || '';
                } else if (ir?.list_reply) {
                  interactiveId = ir.list_reply.id || '';
                  interactiveTitle = ir.list_reply.title || '';
                }
                text = interactiveTitle || interactiveId || '';
              } else if (msg.type === 'button') {
                text = msg.button?.text || msg.button?.payload || '';
                interactiveTitle = msg.button?.text || '';
                interactiveId = msg.button?.payload || '';
              } else {
                // Non-text message (e.g. image caption, document caption, audio, etc.)
                text = (msg as any)[msg.type]?.caption || '';
              }

              // Detect Meta App Dashboard sample test payloads
              const isSamplePayload =
                msg.from === 'WHATSAPP_USER_ID' ||
                entry.id === 'WHATSAPP_BUSINESS_ACCOUNT_ID' ||
                val.metadata?.phone_number_id === 'WHATSAPP_PHONE_NUMBER_ID' ||
                !/\d{7,15}/.test((msg.from || '').replace(/\D/g, ''));

              events.push({
                type: 'incoming_message',
                messageId: msg.id,
                from: msg.from,
                senderName: contactProfile,
                timestamp: msg.timestamp,
                messageType: msg.type,
                text,
                interactiveId,
                interactiveTitle,
                isSamplePayload,
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
