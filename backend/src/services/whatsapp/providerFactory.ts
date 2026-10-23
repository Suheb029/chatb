import { IWhatsAppProvider } from './whatsappProvider.interface.js';
import { DemoWhatsAppProvider } from './demoProvider.js';
import { MetaCloudApiProvider } from './metaCloudApiProvider.js';
import { ApiConfig } from '../../models/ApiConfig.js';
import { isDbConnected } from '../../config/db.js';
import { resolveWhatsAppConfig } from '../../config/whatsappConfig.js';

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

    const resolved = resolveWhatsAppConfig(config);
    currentMode = resolved.mode;

    if (resolved.mode === 'live') {
      cachedProvider = new MetaCloudApiProvider({
        phoneNumberId: resolved.phoneNumberId,
        accessToken: resolved.accessToken,
        webhookVerifyToken: resolved.webhookVerifyToken,
        metaVersion: resolved.metaVersion,
        wabaId: resolved.wabaId,
        appSecret: resolved.appSecret,
      });

      if (!resolved.hasRequiredLiveCredentials) {
        console.warn(
          `[ProviderFactory] Active provider: Meta Cloud API Provider (Live Mode, Graph API ${resolved.metaVersion}) [⚠️ MISSING REQUIRED CREDENTIALS: ${resolved.missingCredentials.join(', ')}]`
        );
      } else {
        console.log(`[ProviderFactory] Active provider: Meta Cloud API Provider (Live Mode, Graph API ${resolved.metaVersion})`);
      }
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
