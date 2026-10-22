import { Request, Response } from 'express';
import { memoryStore } from '../services/store.js';
import { isDbConnected } from '../config/db.js';
import { BotSettings } from '../models/BotSettings.js';
import { BotEngine } from '../services/whatsapp/botEngine.js';

export const getBotSettings = async (req: Request, res: Response) => {
  try {
    let settings = null;
    if (isDbConnected) {
      try {
        settings = await BotSettings.findOne();
      } catch (e) {}
    }

    if (!settings) {
      settings = memoryStore.data.botSettings;
    }

    res.json({
      success: true,
      data: settings.toObject ? settings.toObject() : settings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBotSettings = async (req: Request, res: Response) => {
  try {
    const updateData = req.body;

    let updated: any;
    if (isDbConnected) {
      try {
        updated = await BotSettings.findOneAndUpdate({}, updateData, { new: true, upsert: true });
      } catch (e) {}
    }

    memoryStore.data.botSettings = {
      ...memoryStore.data.botSettings,
      ...updateData,
    };

    res.json({
      success: true,
      message: 'Chatbot settings updated successfully',
      data: updated || memoryStore.data.botSettings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const testSimulator = async (req: Request, res: Response) => {
  try {
    const { message, conversationId = 'sim_device_preview', reset = false } = req.body;
    if (!message && !reset) {
      return res.status(400).json({ success: false, message: 'Message is required for preview simulation' });
    }

    if (reset) {
      const session = await BotEngine.getSession({ conversationId });
      session.state = 'MAIN_MENU';
      session.draftType = 'none';
      session.collectedAnswers = {};
      session.isHandoffActive = false;
      await BotEngine.saveSession(session);
      return res.json({ success: true, message: 'Simulator session reset to MAIN_MENU' });
    }

    const decision = await BotEngine.evaluateMessage(message, {
      conversationId,
      contactName: 'Demo Tester',
      contactPhone: '+1 555 0192',
    });

    res.json({
      success: true,
      input: message,
      decision,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
