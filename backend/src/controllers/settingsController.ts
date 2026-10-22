import { Request, Response } from 'express';
import { memoryStore } from '../services/store.js';
import { isDbConnected } from '../config/db.js';
import { ApiConfig } from '../models/ApiConfig.js';
import { WhatsAppProviderFactory } from '../services/whatsapp/providerFactory.js';

const maskToken = (token?: string): string => {
  if (!token || token.trim().length === 0) return '';
  if (token.length <= 8) return '••••••••';
  return `${token.slice(0, 4)}••••••••••••••••${token.slice(-4)}`;
};

export const getSettings = async (req: Request, res: Response) => {
  try {
    let config: any = null;
    if (isDbConnected) {
      try {
        config = await ApiConfig.findOne();
      } catch (e) {}
    }

    if (!config) {
      config = memoryStore.data.apiConfig;
    }

    const provider = await WhatsAppProviderFactory.getProvider();
    const status = provider.getStatus();

    res.json({
      success: true,
      data: {
        mode: config.mode || 'demo',
        wabaId: config.wabaId || '',
        phoneNumberId: config.phoneNumberId || '',
        accessTokenMasked: maskToken(config.accessToken),
        hasAccessToken: Boolean(config.accessToken && config.accessToken.length > 5),
        webhookVerifyToken: config.webhookVerifyToken || 'whatbot_secure_token',
        webhookCallbackUrl:
          config.webhookCallbackUrl || `${req.protocol}://${req.get('host')}/api/webhooks/whatsapp`,
        isConnected: config.isConnected ?? false,
        lastTestedAt: config.lastTestedAt,
        metaVersion: config.metaVersion || 'v20.0',
        providerStatus: status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { mode, wabaId, phoneNumberId, accessToken, webhookVerifyToken, webhookCallbackUrl } = req.body;

    const updates: any = {};
    if (mode !== undefined) updates.mode = mode;
    if (wabaId !== undefined) updates.wabaId = wabaId;
    if (phoneNumberId !== undefined) updates.phoneNumberId = phoneNumberId;
    // Only update accessToken if user entered a new one (not masked)
    if (accessToken && !accessToken.includes('••••')) {
      updates.accessToken = accessToken;
    }
    if (webhookVerifyToken !== undefined) updates.webhookVerifyToken = webhookVerifyToken;
    if (webhookCallbackUrl !== undefined) updates.webhookCallbackUrl = webhookCallbackUrl;

    if (isDbConnected) {
      try {
        await ApiConfig.findOneAndUpdate({}, updates, { new: true, upsert: true });
      } catch (e) {}
    }

    memoryStore.data.apiConfig = {
      ...memoryStore.data.apiConfig,
      ...updates,
    };

    // Invalidate provider cache to switch mode if changed
    WhatsAppProviderFactory.invalidateCache();

    res.json({
      success: true,
      message: 'WhatsApp API configuration saved securely',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const testConnection = async (req: Request, res: Response) => {
  try {
    const provider = await WhatsAppProviderFactory.getProvider(true);
    const testResult = await provider.testConnection();

    // Update connection status in config
    if (isDbConnected) {
      await ApiConfig.findOneAndUpdate({}, {
        isConnected: testResult.connected,
        lastTestedAt: new Date(),
      });
    }
    memoryStore.data.apiConfig.isConnected = testResult.connected;
    memoryStore.data.apiConfig.lastTestedAt = new Date();

    res.json({
      success: true,
      data: testResult,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: `Test connection error: ${error.message}`,
    });
  }
};

export const resetDemoData = async (req: Request, res: Response) => {
  try {
    memoryStore.reset();
    const { seedDatabase } = await import('../seed/seedData.js');
    await seedDatabase(true);
    res.json({
      success: true,
      message: 'Demo dataset successfully restored to original sandbox state.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
