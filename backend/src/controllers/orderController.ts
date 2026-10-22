import { Request, Response } from 'express';
import { memoryStore } from '../services/store.js';
import { isDbConnected } from '../config/db.js';
import { Order } from '../models/Order.js';

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;

    let orders: any[] = [];
    if (isDbConnected) {
      try {
        let filter: any = {};
        if (status && status !== 'all') filter.status = status;
        orders = await Order.find(filter).sort({ createdAt: -1 });
      } catch (e) {
        orders = memoryStore.data.orders || [];
      }
    } else {
      orders = memoryStore.data.orders || [];
      if (status && status !== 'all') {
        orders = orders.filter((o) => o.status === status);
      }
    }

    if (search) {
      const q = (search as string).toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderReference?.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.itemName?.toLowerCase().includes(q) ||
          o.customerContact?.phoneNumber?.includes(q)
      );
    }

    res.json({
      success: true,
      data: orders.map((o) => (o.toObject ? o.toObject() : o)),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (isDbConnected) {
      try {
        await Order.findByIdAndUpdate(id, { status });
      } catch (e) {}
    }

    const idx = (memoryStore.data.orders || []).findIndex(
      (o: any) => o._id.toString() === id || o.orderReference === id
    );
    if (idx !== -1) {
      memoryStore.data.orders[idx].status = status;
    }

    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const trackOrder = async (req: Request, res: Response) => {
  try {
    const ref = String(req.params.ref || '');
    const cleanRef = ref.trim().toUpperCase();

    let order: any = null;
    if (isDbConnected) {
      try {
        order = await Order.findOne({ orderReference: cleanRef });
      } catch (e) {}
    }
    if (!order) {
      order = (memoryStore.data.orders || []).find(
        (o: any) => o.orderReference === cleanRef
      );
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order reference not found' });
    }

    res.json({
      success: true,
      data: order.toObject ? order.toObject() : order,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
