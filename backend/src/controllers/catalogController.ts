import { Request, Response } from 'express';
import { memoryStore } from '../services/store.js';
import { isDbConnected } from '../config/db.js';
import { CatalogItem } from '../models/CatalogItem.js';

export const getCatalog = async (req: Request, res: Response) => {
  try {
    const { itemType, category, search } = req.query;

    let items: any[] = [];
    if (isDbConnected) {
      try {
        let filter: any = {};
        if (itemType && itemType !== 'all') filter.itemType = itemType;
        if (category && category !== 'all') filter.category = category;
        items = await CatalogItem.find(filter).sort({ order: 1, createdAt: -1 });
      } catch (e) {
        items = memoryStore.data.catalogItems || [];
      }
    } else {
      items = memoryStore.data.catalogItems || [];
      if (itemType && itemType !== 'all') {
        items = items.filter((i) => i.itemType === itemType);
      }
      if (category && category !== 'all') {
        items = items.filter((i) => i.category === category);
      }
    }

    if (search) {
      const q = (search as string).toLowerCase();
      items = items.filter(
        (i) =>
          i.name?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      data: items.map((i) => (i.toObject ? i.toObject() : i)),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCatalogItem = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      image = '',
      category = 'General',
      itemType = 'Service',
      price = 0,
      priceType = 'starting_at',
      duration = '',
      availability = 'available',
      requiresDateTime = false,
      requiresAddress = false,
      followUpQuestions = [],
      isActive = true,
      order = 0,
    } = req.body;

    if (!name || !description) {
      return res.status(400).json({ success: false, message: 'Item name and description are required.' });
    }

    const itemData = {
      _id: `cat_${Date.now()}`,
      name,
      description,
      image,
      category,
      itemType,
      price: Number(price) || 0,
      priceType,
      duration,
      availability,
      requiresDateTime: Boolean(requiresDateTime),
      requiresAddress: Boolean(requiresAddress),
      followUpQuestions: Array.isArray(followUpQuestions) ? followUpQuestions : [],
      isActive: Boolean(isActive),
      order: Number(order) || 0,
      createdAt: new Date(),
    };

    let created: any = null;
    if (isDbConnected) {
      try {
        created = await CatalogItem.create(itemData);
      } catch (e) {
        created = itemData;
      }
    } else {
      created = itemData;
    }

    if (!memoryStore.data.catalogItems) memoryStore.data.catalogItems = [];
    memoryStore.data.catalogItems.push(created);

    res.status(201).json({
      success: true,
      message: `${itemType} "${name}" created successfully`,
      data: created,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCatalogItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isDbConnected) {
      try {
        await CatalogItem.findByIdAndUpdate(id, updates);
      } catch (e) {}
    }

    const index = (memoryStore.data.catalogItems || []).findIndex(
      (i: any) => i._id.toString() === id
    );
    if (index !== -1) {
      memoryStore.data.catalogItems[index] = {
        ...memoryStore.data.catalogItems[index],
        ...updates,
      };
    }

    res.json({ success: true, message: 'Catalog item updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCatalogItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isDbConnected) {
      try {
        await CatalogItem.findByIdAndDelete(id);
      } catch (e) {}
    }

    memoryStore.data.catalogItems = (memoryStore.data.catalogItems || []).filter(
      (i: any) => i._id.toString() !== id
    );

    res.json({ success: true, message: 'Catalog item removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
