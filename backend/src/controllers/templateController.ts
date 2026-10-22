import { Request, Response } from 'express';
import { memoryStore } from '../services/store.js';
import { isDbConnected } from '../config/db.js';
import { MessageTemplate } from '../models/MessageTemplate.js';

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { category, status } = req.query;

    let templates: any[] = [];
    if (isDbConnected) {
      try {
        let filter: any = {};
        if (category && category !== 'all') filter.category = category;
        if (status && status !== 'all') filter.status = status;
        templates = await MessageTemplate.find(filter).sort({ createdAt: -1 });
      } catch (e) {
        templates = memoryStore.data.templates;
      }
    } else {
      templates = memoryStore.data.templates;
      if (category && category !== 'all') templates = templates.filter((t) => t.category === category);
      if (status && status !== 'all') templates = templates.filter((t) => t.status === status);
    }

    res.json({
      success: true,
      data: templates.map((t) => (t.toObject ? t.toObject() : t)),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { name, category = 'UTILITY', language = 'en_US', headerType = 'NONE', headerText = '', bodyText, footerText = '', buttons = [], status = 'APPROVED' } = req.body;

    if (!name || !bodyText) {
      return res.status(400).json({ success: false, message: 'Template name and body text are required' });
    }

    const templateData = {
      _id: `tmpl_${Date.now()}`,
      name: name.toLowerCase().replace(/\s+/g, '_'),
      category,
      language,
      headerType,
      headerText,
      bodyText,
      footerText,
      buttons,
      status: status || 'APPROVED',
      metaTemplateId: `meta_hsm_${Date.now()}`,
      createdAt: new Date(),
    };

    let created: any;
    if (isDbConnected) {
      try {
        created = await MessageTemplate.create(templateData);
      } catch (e) {
        created = templateData;
      }
    } else {
      created = templateData;
    }

    memoryStore.data.templates.unshift(created);

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: created,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isDbConnected) {
      await MessageTemplate.findByIdAndUpdate(id, updates);
    }

    const index = memoryStore.data.templates.findIndex((t) => t._id.toString() === id);
    if (index !== -1) {
      memoryStore.data.templates[index] = {
        ...memoryStore.data.templates[index],
        ...updates,
      };
    }

    res.json({ success: true, message: 'Template updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isDbConnected) {
      await MessageTemplate.findByIdAndDelete(id);
    }

    memoryStore.data.templates = memoryStore.data.templates.filter((t) => t._id.toString() !== id);

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitTemplateForApproval = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Simulate Meta approval process: immediately mark PENDING then APPROVE after brief delay
    const template = memoryStore.data.templates.find((t) => t._id.toString() === id);
    if (template) {
      template.status = 'APPROVED';
    }

    if (isDbConnected) {
      await MessageTemplate.findByIdAndUpdate(id, { status: 'APPROVED' });
    }

    res.json({
      success: true,
      message: 'Template submitted to Meta and approved for demo testing!',
      status: 'APPROVED',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
