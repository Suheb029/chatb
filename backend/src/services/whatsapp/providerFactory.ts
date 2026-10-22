import { IWhatsAppProvider } from './whatsappProvider.interface.js';
import { DemoWhatsAppProvider } from './demoProvider.js';
import { MetaCloudApiProvider } from './metaCloudApiProvider.js';
import { ApiConfig } from '../../models/ApiConfig.js';
import { isDbConnected } from '../../config/db.js';

let cachedProvider: IWhatsAppProvider | null = null;
let currentMode: 'demo' | 'live' = 'demo';

export class WhatsAppProviderFactory {
  public static async getProvider(forceRefresh = false): Promise<IWhatsAppProvider> {
    if (cachedProvider && !forceRefresh) {
      return cachedProvider;
    }

    let config = null;
    if (isDbConnected) {
      try {
        config = await ApiConfig.findOne();
      } catch (e) {
        console.warn('[ProviderFactory] Error reading ApiConfig from DB:', e);
      }
    }

    const envMode = process.env.WHATSAPP_MODE as 'demo' | 'live' | undefined;
    const hasLiveCredentials = Boolean(
      (process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || config?.accessToken) &&
      (process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID || config?.phoneNumberId)
    );

    // Determine active mode:
    // If explicitly set in environment to 'live' or 'demo', honor environment.
    // Otherwise fallback to DB ApiConfig mode, or auto-detect based on credential availability.
    let mode: 'demo' | 'live' = 'demo';
    if (envMode === 'live') {
      mode = 'live';
    } else if (envMode === 'demo') {
      mode = 'demo';
    } else if (config?.mode) {
      mode = config.mode;
    } else if (hasLiveCredentials) {
      mode = 'live';
    }

    currentMode = mode;

    if (mode === 'live') {
      const accessToken =
        process.env.WHATSAPP_ACCESS_TOKEN ||
        process.env.META_ACCESS_TOKEN ||
        config?.accessToken ||
        '';
      const phoneNumberId =
        process.env.WHATSAPP_PHONE_NUMBER_ID ||
        process.env.META_PHONE_NUMBER_ID ||
        config?.phoneNumberId ||
        '';
      const webhookVerifyToken =
        process.env.WHATSAPP_VERIFY_TOKEN ||
        process.env.META_VERIFY_TOKEN ||
        config?.webhookVerifyToken ||
        'whatbot_secure_token';
      const metaVersion =
        process.env.WHATSAPP_API_VERSION ||
        process.env.META_GRAPH_VERSION ||
        config?.metaVersion ||
        'v20.0';
      const wabaId =
        process.env.WHATSAPP_WABA_ID ||
        process.env.META_WABA_ID ||
        config?.wabaId ||
        '';
      const appSecret =
        process.env.WHATSAPP_APP_SECRET ||
        '';

      cachedProvider = new MetaCloudApiProvider({
        phoneNumberId,
        accessToken,
        webhookVerifyToken,
        metaVersion,
        wabaId,
        appSecret,
      });
      console.log(`[ProviderFactory] Active provider: Meta Cloud API Provider (Live Mode, Graph API ${metaVersion})`);
    } else {
      cachedProvider = new DemoWhatsAppProvider();
      console.log('[ProviderFactory] Active provider: Demo WhatsApp Sandbox Provider (Demo Mode)');
    }

    return cachedProvider;
  }

  public static getCurrentMode(): 'demo' | 'live' {
    return currentMode;
  }

  public static invalidateCache() {
    cachedProvider = null;
  }
}
