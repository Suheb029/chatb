import { Request, Response } from 'express';
import { memoryStore } from '../services/store.js';
import { isDbConnected } from '../config/db.js';
import { AutoReplyRule } from '../models/AutoReplyRule.js';

export const getRules = async (req: Request, res: Response) => {
  try {
    let rules: any[] = [];
    if (isDbConnected) {
      try {
        rules = await AutoReplyRule.find().sort({ priority: -1, createdAt: -1 });
      } catch (e) {
        rules = memoryStore.data.autoReplyRules;
      }
    } else {
      rules = memoryStore.data.autoReplyRules;
    }

    res.json({
      success: true,
      data: rules.map((r) => (r.toObject ? r.toObject() : r)),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRule = async (req: Request, res: Response) => {
  try {
    const { name, keywords, matchType = 'contains', responseMessage, isActive = true, category = 'General', priority = 0, actionType = 'reply', mediaUrl = '' } = req.body;

    if (!name || !keywords || !responseMessage) {
      return res.status(400).json({ success: false, message: 'Name, keywords, and response message are required' });
    }

    const kwList = Array.isArray(keywords)
      ? keywords.map((k: string) => k.trim())
      : keywords.split(',').map((k: string) => k.trim());

    const ruleData = {
      _id: `rule_${Date.now()}`,
      name,
      keywords: kwList,
      matchType,
      responseMessage,
      isActive,
      priority: Number(priority) || 0,
      triggerCount: 0,
      category,
      actionType,
      mediaUrl,
      createdAt: new Date(),
    };

    let created: any;
    if (isDbConnected) {
      try {
        created = await AutoReplyRule.create(ruleData);
      } catch (e) {
        created = ruleData;
      }
    } else {
      created = ruleData;
    }

    memoryStore.data.autoReplyRules.unshift(created);

    res.status(201).json({
      success: true,
      message: 'Automated reply rule created',
      data: created,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, keywords, matchType, responseMessage, isActive, category, priority, actionType, mediaUrl } = req.body;

    const kwList = keywords
      ? Array.isArray(keywords)
        ? keywords.map((k: string) => k.trim())
        : keywords.split(',').map((k: string) => k.trim())
      : undefined;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (kwList !== undefined) updates.keywords = kwList;
    if (matchType !== undefined) updates.matchType = matchType;
    if (responseMessage !== undefined) updates.responseMessage = responseMessage;
    if (isActive !== undefined) updates.isActive = isActive;
    if (category !== undefined) updates.category = category;
    if (priority !== undefined) updates.priority = Number(priority);
    if (actionType !== undefined) updates.actionType = actionType;
    if (mediaUrl !== undefined) updates.mediaUrl = mediaUrl;

    if (isDbConnected) {
      await AutoReplyRule.findByIdAndUpdate(id, updates);
    }

    const index = memoryStore.data.autoReplyRules.findIndex((r) => r._id.toString() === id);
    if (index !== -1) {
      memoryStore.data.autoReplyRules[index] = {
        ...memoryStore.data.autoReplyRules[index],
        ...updates,
      };
    }

    res.json({ success: true, message: 'Rule updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rule = memoryStore.data.autoReplyRules.find((r) => r._id.toString() === id);
    const newStatus = rule ? !rule.isActive : true;

    if (isDbConnected) {
      await AutoReplyRule.findByIdAndUpdate(id, { isActive: newStatus });
    }

    if (rule) {
      rule.isActive = newStatus;
    }

    res.json({ success: true, message: `Rule ${newStatus ? 'enabled' : 'disabled'}`, isActive: newStatus });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isDbConnected) {
      await AutoReplyRule.findByIdAndDelete(id);
    }

    memoryStore.data.autoReplyRules = memoryStore.data.autoReplyRules.filter(
      (r) => r._id.toString() !== id
    );

    res.json({ success: true, message: 'Rule deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
