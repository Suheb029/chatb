import { Request, Response } from 'express';
import { memoryStore } from '../services/store.js';
import { isDbConnected } from '../config/db.js';
import { BusinessConfiguration } from '../models/BusinessConfiguration.js';

export const getBusinessConfig = async (req: Request, res: Response) => {
  try {
    let config = null;
    if (isDbConnected) {
      try {
        config = await BusinessConfiguration.findOne();
      } catch (e) {}
    }
    if (!config) {
      config = memoryStore.data.businessConfig;
    }

    res.json({
      success: true,
      data: config.toObject ? config.toObject() : config,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBusinessConfig = async (req: Request, res: Response) => {
  try {
    const updates = req.body;

    let updated: any = null;
    if (isDbConnected) {
      try {
        updated = await BusinessConfiguration.findOneAndUpdate({}, updates, {
          new: true,
          upsert: true,
        });
      } catch (e) {}
    }

    memoryStore.data.businessConfig = {
      ...memoryStore.data.businessConfig,
      ...updates,
    };

    res.json({
      success: true,
      message: 'Business configuration and welcome menu updated successfully',
      data: updated || memoryStore.data.businessConfig,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
