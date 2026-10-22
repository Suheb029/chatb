import { Request, Response } from 'express';
import { memoryStore } from '../services/store.js';
import { isDbConnected } from '../config/db.js';
import { Contact } from '../models/Contact.js';
import { Conversation } from '../models/Conversation.js';

export const getContacts = async (req: Request, res: Response) => {
  try {
    const { search, tag } = req.query;

    let contacts: any[] = [];
    if (isDbConnected) {
      try {
        let filter: any = {};
        if (tag && tag !== 'all') {
          filter.tags = tag;
        }
        contacts = await Contact.find(filter).sort({ lastInteractionAt: -1 });
      } catch (e) {
        contacts = memoryStore.data.contacts;
      }
    } else {
      contacts = memoryStore.data.contacts;
      if (tag && tag !== 'all') {
        contacts = contacts.filter((c) => c.tags?.includes(tag as string));
      }
    }

    if (search) {
      const q = (search as string).toLowerCase();
      contacts = contacts.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.phoneNumber?.includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      data: contacts.map((c) => (c.toObject ? c.toObject() : c)),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const { name, phoneNumber, email, tags = [], notes = '' } = req.body;

    if (!name || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Name and phone number are required' });
    }

    const contactData = {
      _id: `cnt_${Date.now()}`,
      name,
      phoneNumber,
      email: email || '',
      tags: Array.isArray(tags) ? tags : [tags],
      notes,
      status: 'active',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
      lastInteractionAt: new Date(),
      unreadCount: 0,
      assignedAgent: 'Chatbot',
    };

    let created: any;
    if (isDbConnected) {
      try {
        created = await Contact.create(contactData);
      } catch (err: any) {
        // Fall back to memory if duplicate key or Mongo error
        created = contactData;
      }
    } else {
      created = contactData;
    }

    memoryStore.data.contacts.unshift(created);

    // Also auto-create initial conversation for this contact if none exists
    const convData = {
      _id: `conv_${Date.now()}`,
      contactId: created._id,
      status: 'open',
      assignedAgent: 'Chatbot',
      lastMessageText: 'New contact created',
      lastMessageTimestamp: new Date(),
      unreadCount: 0,
      internalNotes: notes,
      tags: created.tags,
    };
    if (isDbConnected) {
      try {
        await Conversation.create(convData);
      } catch (e) {}
    }
    memoryStore.data.conversations.unshift(convData);

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: created,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, email, tags, notes, status } = req.body;

    if (isDbConnected) {
      await Contact.findByIdAndUpdate(id, { name, phoneNumber, email, tags, notes, status });
    }

    const index = memoryStore.data.contacts.findIndex((c) => c._id.toString() === id);
    if (index !== -1) {
      memoryStore.data.contacts[index] = {
        ...memoryStore.data.contacts[index],
        name: name ?? memoryStore.data.contacts[index].name,
        phoneNumber: phoneNumber ?? memoryStore.data.contacts[index].phoneNumber,
        email: email ?? memoryStore.data.contacts[index].email,
        tags: tags ?? memoryStore.data.contacts[index].tags,
        notes: notes ?? memoryStore.data.contacts[index].notes,
        status: status ?? memoryStore.data.contacts[index].status,
      };
    }

    res.json({ success: true, message: 'Contact updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isDbConnected) {
      await Contact.findByIdAndDelete(id);
      await Conversation.deleteMany({ contactId: id });
    }

    memoryStore.data.contacts = memoryStore.data.contacts.filter((c) => c._id.toString() !== id);
    memoryStore.data.conversations = memoryStore.data.conversations.filter((c) => c.contactId.toString() !== id);

    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportContactsCsv = async (req: Request, res: Response) => {
  try {
    let contacts = memoryStore.data.contacts;
    if (isDbConnected) {
      try {
        contacts = await Contact.find();
      } catch (e) {}
    }

    const headers = ['Name', 'Phone Number', 'Email', 'Tags', 'Status', 'Notes', 'Last Interaction'];
    const rows = contacts.map((c) => [
      `"${c.name}"`,
      `"${c.phoneNumber}"`,
      `"${c.email || ''}"`,
      `"${(c.tags || []).join('; ')}"`,
      `"${c.status}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
      `"${new Date(c.lastInteractionAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=whatsapp_contacts.csv');
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
