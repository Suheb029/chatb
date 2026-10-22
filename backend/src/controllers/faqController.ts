import { Request, Response } from 'express';
import { memoryStore } from '../services/store.js';
import { isDbConnected } from '../config/db.js';
import { Faq } from '../models/Faq.js';

export const getFaqs = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    let faqs: any[] = [];
    if (isDbConnected) {
      try {
        let filter: any = {};
        if (category && category !== 'all') {
          filter.category = category;
        }
        faqs = await Faq.find(filter).sort({ order: 1, createdAt: 1 });
      } catch (e) {
        faqs = memoryStore.data.faqs;
      }
    } else {
      faqs = memoryStore.data.faqs;
      if (category && category !== 'all') {
        faqs = faqs.filter((f) => f.category === category);
      }
    }

    if (search) {
      const q = (search as string).toLowerCase();
      faqs = faqs.filter(
        (f) => f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      data: faqs.map((f) => (f.toObject ? f.toObject() : f)),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFaq = async (req: Request, res: Response) => {
  try {
    const { question, answer, category = 'General', isActive = true, order = 0 } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }

    const faqData = {
      _id: `faq_${Date.now()}`,
      question,
      answer,
      category,
      isActive,
      order: Number(order) || 0,
      triggerCount: 0,
      createdAt: new Date(),
    };

    let created: any;
    if (isDbConnected) {
      try {
        created = await Faq.create(faqData);
      } catch (e) {
        created = faqData;
      }
    } else {
      created = faqData;
    }

    memoryStore.data.faqs.push(created);

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: created,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { question, answer, category, isActive, order } = req.body;

    const updates: any = {};
    if (question !== undefined) updates.question = question;
    if (answer !== undefined) updates.answer = answer;
    if (category !== undefined) updates.category = category;
    if (isActive !== undefined) updates.isActive = isActive;
    if (order !== undefined) updates.order = Number(order);

    if (isDbConnected) {
      await Faq.findByIdAndUpdate(id, updates);
    }

    const index = memoryStore.data.faqs.findIndex((f) => f._id.toString() === id);
    if (index !== -1) {
      memoryStore.data.faqs[index] = {
        ...memoryStore.data.faqs[index],
        ...updates,
      };
    }

    res.json({ success: true, message: 'FAQ updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isDbConnected) {
      await Faq.findByIdAndDelete(id);
    }

    memoryStore.data.faqs = memoryStore.data.faqs.filter((f) => f._id.toString() !== id);

    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
