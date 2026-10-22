import { Request, Response } from 'express';
import { memoryStore } from '../services/store.js';
import { isDbConnected } from '../config/db.js';
import { Booking } from '../models/Booking.js';

export const getBookings = async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;

    let bookings: any[] = [];
    if (isDbConnected) {
      try {
        let filter: any = {};
        if (status && status !== 'all') filter.status = status;
        bookings = await Booking.find(filter).sort({ createdAt: -1 });
      } catch (e) {
        bookings = memoryStore.data.bookings || [];
      }
    } else {
      bookings = memoryStore.data.bookings || [];
      if (status && status !== 'all') {
        bookings = bookings.filter((b) => b.status === status);
      }
    }

    if (search) {
      const q = (search as string).toLowerCase();
      bookings = bookings.filter(
        (b) =>
          b.bookingReference?.toLowerCase().includes(q) ||
          b.customerName?.toLowerCase().includes(q) ||
          b.itemName?.toLowerCase().includes(q) ||
          b.customerContact?.phoneNumber?.includes(q)
      );
    }

    res.json({
      success: true,
      data: bookings.map((b) => (b.toObject ? b.toObject() : b)),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, internalNotes } = req.body;

    const updates: any = {};
    if (status) updates.status = status;
    if (internalNotes !== undefined) updates.internalNotes = internalNotes;

    if (isDbConnected) {
      try {
        await Booking.findByIdAndUpdate(id, updates);
      } catch (e) {}
    }

    const idx = (memoryStore.data.bookings || []).findIndex(
      (b: any) => b._id.toString() === id || b.bookingReference === id
    );
    if (idx !== -1) {
      memoryStore.data.bookings[idx] = {
        ...memoryStore.data.bookings[idx],
        ...updates,
      };
    }

    res.json({ success: true, message: `Booking status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const trackBooking = async (req: Request, res: Response) => {
  try {
    const ref = String(req.params.ref || '');
    const cleanRef = ref.trim().toUpperCase();

    let booking: any = null;
    if (isDbConnected) {
      try {
        booking = await Booking.findOne({ bookingReference: cleanRef });
      } catch (e) {}
    }
    if (!booking) {
      booking = (memoryStore.data.bookings || []).find(
        (b: any) => b.bookingReference === cleanRef
      );
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking reference not found' });
    }

    res.json({
      success: true,
      data: booking.toObject ? booking.toObject() : booking,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
