import dotenv from 'dotenv';
import { ApiConfig } from '../models/ApiConfig.js';
import { isDbConnected } from './db.js';

dotenv.config();

export interface IResolvedWhatsAppConfig {
  mode: 'demo' | 'live' | 'qr';
  accessToken: string;
  phoneNumberId: string;
  webhookVerifyToken: string;
  metaVersion: string;
  wabaId: string;
  appSecret: string;
  hasRequiredLiveCredentials: boolean;
  missingCredentials: string[];
}

/**
 * Mask a sensitive token or password, showing at most the first 4 and last 4 characters.
 */
export const maskSecret = (token?: string): string => {
  if (!token || token.trim().length === 0) return '';
  const trimmed = token.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 4)}••••••••••••••••${trimmed.slice(-4)}`;
};

/**
 * Mask a phone number for privacy and security in logs.
 * Example: +15551234567 -> +1555****4567
 */
export const maskPhoneNumber = (phone?: string): string => {
  if (!phone) return 'unknown';
  const clean = phone.replace(/[^\d+]/g, '');
  const digitsOnly = clean.replace(/\D/g, '');
  if (digitsOnly.length <= 4) return '****';
  if (digitsOnly.length <= 7) return `***${digitsOnly.slice(-4)}`;
  const prefix = clean.startsWith('+') ? `+${digitsOnly.slice(0, 4)}` : digitsOnly.slice(0, 4);
  const suffix = digitsOnly.slice(-4);
  return `${prefix}****${suffix}`;
};

/**
 * Resolve a single configuration key with strict precedence:
 * 1. Primary WHATSAPP_* environment variable
 * 2. Legacy META_* environment variable (with warning if conflicting)
 * 3. Database ApiConfig value
 * 4. Fallback default
 */
const resolveConfigValue = (
  primaryKey: string,
  legacyKey: string | null,
  dbValue: string | undefined,
  defaultValue = ''
): string => {
  const primaryVal = process.env[primaryKey]?.trim();
  const legacyVal = legacyKey ? process.env[legacyKey]?.trim() : undefined;

  // Check for conflicts between primary and legacy environment variables
  if (primaryVal && legacyVal && primaryVal !== legacyVal) {
    console.warn(
      `[Config] ⚠️ Precedence Warning: Both ${primaryKey} and legacy ${legacyKey} are defined with conflicting values. Precedence rule applied: using ${primaryKey}.`
    );
  }

  if (primaryVal) return primaryVal;
  if (legacyVal) return legacyVal;
  if (dbValue && dbValue.trim().length > 0) return dbValue.trim();
  return defaultValue;
};

/**
 * Resolve the complete WhatsApp integration configuration.
 */
export const resolveWhatsAppConfig = (dbConfig?: any): IResolvedWhatsAppConfig => {
  const envMode = process.env.WHATSAPP_MODE?.trim().toLowerCase() as 'demo' | 'live' | 'qr' | 'web' | undefined;

  const accessToken = resolveConfigValue(
    'WHATSAPP_ACCESS_TOKEN',
    'META_ACCESS_TOKEN',
    dbConfig?.accessToken,
    ''
  );

  const phoneNumberId = resolveConfigValue(
    'WHATSAPP_PHONE_NUMBER_ID',
    'META_PHONE_NUMBER_ID',
    dbConfig?.phoneNumberId,
    ''
  );

  const webhookVerifyToken = resolveConfigValue(
    'WHATSAPP_VERIFY_TOKEN',
    'META_VERIFY_TOKEN',
    dbConfig?.webhookVerifyToken,
    ''
  );

  const metaVersion = resolveConfigValue(
    'WHATSAPP_API_VERSION',
    'META_GRAPH_VERSION',
    dbConfig?.metaVersion,
    'v20.0'
  );

  const wabaId = resolveConfigValue(
    'WHATSAPP_WABA_ID',
    'META_WABA_ID',
    dbConfig?.wabaId,
    ''
  );

  const appSecret = resolveConfigValue(
    'WHATSAPP_APP_SECRET',
    null,
    undefined,
    ''
  );

  // Check required credentials for live Meta Cloud API integration
  const missingCredentials: string[] = [];
  if (!accessToken) missingCredentials.push('WHATSAPP_ACCESS_TOKEN');
  if (!phoneNumberId) missingCredentials.push('WHATSAPP_PHONE_NUMBER_ID');

  const hasRequiredLiveCredentials = missingCredentials.length === 0;

  // Mode selection:
  // If explicitly set in environment, honor environment strictly.
  // Otherwise fall back to DB config mode, or auto-detect based on live credential availability.
  let mode: 'demo' | 'live' | 'qr' = 'demo';
  if (envMode === 'qr' || envMode === 'web') {
    mode = 'qr';
  } else if (envMode === 'live') {
    mode = 'live';
  } else if (envMode === 'demo') {
    mode = 'demo';
  } else if (dbConfig?.mode) {
    mode = (dbConfig.mode === 'web' ? 'qr' : dbConfig.mode) as 'demo' | 'live' | 'qr';
  } else if (hasRequiredLiveCredentials) {
    mode = 'live';
  }

  return {
    mode,
    accessToken,
    phoneNumberId,
    webhookVerifyToken,
    metaVersion,
    wabaId,
    appSecret,
    hasRequiredLiveCredentials,
    missingCredentials,
  };
};

/**
 * Validate configuration at application startup and log informative, secure diagnostic messages.
 * Never prints tokens, passwords, or secrets to logs.
 */
export const validateConfigAtStartup = async (): Promise<IResolvedWhatsAppConfig> => {
  let dbConfig: any = null;
  if (isDbConnected) {
    try {
      dbConfig = await ApiConfig.findOne();
    } catch (e) {
      // Non-blocking
    }
  }

  const config = resolveWhatsAppConfig(dbConfig);

  console.log('[Config] Validating WhatsApp Integration Configuration:');
  console.log(`  • Configured Mode: ${config.mode.toUpperCase()}`);
  console.log(`  • Graph API Version: ${config.metaVersion}`);

  if (config.mode === 'live') {
    if (!config.hasRequiredLiveCredentials) {
      console.warn(
        `[Config] ⚠️ LIVE MODE CONFIGURATION WARNING: Live mode is selected (WHATSAPP_MODE=live), but required Meta credentials are missing: ${config.missingCredentials.join(
          ', '
        )}.`
      );
      console.warn(
        '  • Outbound messages will fail with configuration errors until valid credentials are configured in .env or the Settings dashboard.'
      );
      console.warn('  • The server will NOT silently fall back to demo mode when live mode is explicitly chosen.');
    } else {
      console.log(`  • Sender Phone Number ID: ${config.phoneNumberId}`);
      console.log(`  • Access Token: [Configured] (${maskSecret(config.accessToken)})`);
    }

    if (!config.webhookVerifyToken) {
      console.warn(
        '  • Webhook Verification Token: [MISSING] (WHATSAPP_VERIFY_TOKEN must be configured for Meta webhook handshake)'
      );
    } else {
      console.log('  • Webhook Verification Token: [Configured]');
    }

    if (config.appSecret) {
      console.log('  • App Secret HMAC Verification: [Enabled]');
    } else {
      console.log('  • App Secret HMAC Verification: [Disabled - optional]');
    }
  } else {
    console.log('  • Sandbox Demo Mode active: Local simulation without real Meta API credentials.');
  }

  return config;
};
