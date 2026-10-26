export interface ISendMessagePayload {
  to: string; // E.164 formatted phone number (e.g., +14155552671)
  type: 'text' | 'image' | 'document' | 'template';
  text?: string;
  mediaUrl?: string;
  fileName?: string;
  template?: {
    name: string;
    language: string;
    components?: any[];
  };
}

export interface IProviderResponse {
  success: boolean;
  messageId: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  error?: string;
  errorCode?: number | string;
  errorSubcode?: number | string;
  errorType?: string;
  errorDetails?: string;
  traceId?: string;
  diagnostic?: string;
  isPermanentError?: boolean;
  provider: 'demo' | 'meta_cloud' | 'baileys';
}

export interface IIncomingWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: { body: string };
          type: string;
          interactive?: {
            type?: string;
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string; description?: string };
          };
          button?: { text?: string; payload?: string };
          image?: { id?: string; mime_type?: string; sha256?: string; caption?: string };
          document?: { id?: string; mime_type?: string; sha256?: string; filename?: string; caption?: string };
          [key: string]: any;
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface IConnectionTestResult {
  connected: boolean;
  provider: 'demo' | 'meta_cloud' | 'baileys';
  message: string;
  details?: {
    wabaId?: string;
    phoneNumberId?: string;
    verifiedName?: string;
    qualityRating?: string;
    codeVerificationStatus?: string;
    userId?: string;
  };
}

/**
 * Universal Interface for WhatsApp Providers
 * Enables clean decoupling of Demo simulation from live Meta Graph API integration
 */
export interface IWhatsAppProvider {
  /**
   * Send a WhatsApp message to an end customer
   */
  sendMessage(payload: ISendMessagePayload): Promise<IProviderResponse>;

  /**
   * Verify incoming Webhook token for Meta challenge verification
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null;

  /**
   * Process incoming Webhook notification payload from Meta Cloud API or Demo emitter
   */
  processIncomingWebhook(payload: IIncomingWebhookPayload | any): Promise<{
    processed: boolean;
    messagesCount: number;
    statusesCount: number;
    events: any[];
  }>;

  /**
   * Test API credentials and connection health
   */
  testConnection(): Promise<IConnectionTestResult>;

  /**
   * Return status info
   */
  getStatus(): {
    name: string;
    mode: 'demo' | 'live' | 'qr';
    isReady: boolean;
    description: string;
  };

  /**
   * Optional QR status for WhatsApp Web pairing
   */
  getQRStatus?(): {
    isConnected: boolean;
    user?: { id: string; name?: string } | null;
    qrRaw: string | null;
    qrDataUrl: string | null;
  };

  /**
   * Optional logout for WhatsApp Web session
   */
  logout?(): Promise<void>;
}

