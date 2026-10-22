import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Truck,
  Eye,
  User,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api } from '../lib/api';
import { Booking, Order } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { formatTime, formatRelativeTime } from '../lib/utils';

export const BookingsOrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'orders'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Detail view modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Reference track lookup
  const [trackRefInput, setTrackRefInput] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);

  const { success, error, info } = useToast();

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter, searchQuery]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'bookings') {
        const res = await api.bookings.getList({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery || undefined,
        });
        if (res.data) {
          const normalizedBookings: Booking[] = (res.data || []).map((b: any) => ({
            _id: b._id,
            bookingReference: b.bookingReference || '',
            conversationId: b.conversationId || '',
            contactId: b.contactId || '',
            customerName: b.customerName || 'Valued Customer',
            customerPhone: b.customerPhone || b.customerContact?.phoneNumber || '',
            customerEmail: b.customerEmail || b.customerContact?.email || '',
            serviceId: b.serviceId || b.itemId || '',
            serviceName: b.serviceName || b.itemName || 'Service Booking',
            itemType: (b.itemType || 'service').toLowerCase() as any,
            customerRequirements: b.customerRequirements || b.requirements || {},
            preferredDateTime: b.preferredDateTime || '',
            status: (b.status === 'pending_review' ? 'pending' : b.status) || 'confirmed',
            price: Number(b.price || (typeof b.estimatedPrice === 'string' ? b.estimatedPrice.replace(/[^0-9.]/g, '') : 0)) || 0,
            currency: b.currency || '₹',
            notes: b.notes || b.internalNotes || '',
            confirmedAt: b.confirmedAt,
            createdAt: b.createdAt || new Date().toISOString(),
          }));
          setBookings(normalizedBookings);
        }
      } else {
        const res = await api.orders.getList({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery || undefined,
        });
        if (res.data) {
          const normalizedOrders: Order[] = (res.data || []).map((o: any) => ({
            _id: o._id,
            orderReference: o.orderReference || '',
            conversationId: o.conversationId || '',
            contactId: o.contactId || '',
            customerName: o.customerName || 'Valued Customer',
            customerPhone: o.customerPhone || o.customerContact?.phoneNumber || '',
            customerEmail: o.customerEmail || o.customerContact?.email || '',
            productId: o.productId || o.itemId || '',
            productName: o.productName || o.itemName || 'Catalog Product',
            quantity: Number(o.quantity) || 1,
            unitPrice: Number(o.unitPrice) || 0,
            totalPrice: Number(o.totalPrice) || 0,
            currency: o.currency || '₹',
            fulfilmentAddress: o.fulfilmentAddress || o.fulfilmentDetails?.deliveryAddress || '',
            customerNotes: o.customerNotes || o.fulfilmentDetails?.notes || '',
            status: (o.status === 'pending_payment' ? 'pending' : o.status) || 'confirmed',
            confirmedAt: o.confirmedAt,
            createdAt: o.createdAt || new Date().toISOString(),
          }));
          setOrders(normalizedOrders);
        }
      }
    } catch (e: any) {
      error('Failed to load records', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (id: string, newStatus: string) => {
    try {
      await api.bookings.updateStatus(id, newStatus);
      success('Booking Updated', `Status changed to ${newStatus}`);
      loadData();
      if (selectedBooking && selectedBooking._id === id) {
        setSelectedBooking({ ...selectedBooking, status: newStatus as any });
      }
    } catch (e: any) {
      error('Failed to update status', e.message);
    }
  };

  const handleUpdateOrderStatus = async (id: string, newStatus: string) => {
    try {
      await api.orders.updateStatus(id, newStatus);
      success('Order Updated', `Status changed to ${newStatus}`);
      loadData();
      if (selectedOrder && selectedOrder._id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as any });
      }
    } catch (e: any) {
      error('Failed to update status', e.message);
    }
  };

  const handleTrackReference = async () => {
    const ref = trackRefInput.trim().toUpperCase();
    if (!ref) return;

    try {
      if (ref.startsWith('BK-')) {
        const res = await api.bookings.track(ref);
        if (res.data) {
          setSelectedBooking(res.data);
          setActiveTab('bookings');
          success('Booking Found', `Reference ${ref}`);
        }
      } else if (ref.startsWith('ORD-')) {
        const res = await api.orders.track(ref);
        if (res.data) {
          setSelectedOrder(res.data);
          setActiveTab('orders');
          success('Order Found', `Reference ${ref}`);
        }
      } else {
        // Try booking first then order
        try {
          const res = await api.bookings.track(ref);
          if (res.data) {
            setSelectedBooking(res.data);
            setActiveTab('bookings');
            return;
          }
        } catch (e) {}
        const res = await api.orders.track(ref);
        if (res.data) {
          setSelectedOrder(res.data);
          setActiveTab('orders');
        }
      }
    } catch (e: any) {
      error('Lookup Failed', `No record found with reference "${ref}"`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Calendar className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Bookings & Product Orders</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time requests collected from customer conversations via WhatsApp. View customer answers, scheduling slots, and fulfillment details.
          </p>
        </div>

        {/* Quick Reference Tracker */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              placeholder="Track BK-XXXXX or ORD-XXXXX..."
              value={trackRefInput}
              onChange={(e) => setTrackRefInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrackReference()}
              className="w-full text-xs uppercase bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <Button variant="whatsapp" size="sm" onClick={handleTrackReference}>
            Track
          </Button>
        </div>
      </div>

      {/* Main Tabs (Bookings vs Orders) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('bookings');
              setStatusFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bookings'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Service Bookings</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'bookings' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {bookings.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('orders');
              setStatusFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Product Orders</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'orders' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {orders.length}
            </span>
          </button>
        </div>

        {/* Status Filter and Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            {activeTab === 'orders' ? (
              <>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </>
            ) : (
              <option value="completed">Completed</option>
            )}
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer or ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Content Table */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Loading records...</div>
      ) : activeTab === 'bookings' ? (
        bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Bookings Found</p>
            <p className="text-xs text-slate-400">
              When customers complete the booking flow via WhatsApp, requests will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Reference</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Service / Offering</th>
                    <th className="px-5 py-3.5">Preferred Date/Time</th>
                    <th className="px-5 py-3.5">Price</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-emerald-700">
                        {b.bookingReference}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{b.customerName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{b.customerPhone}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800">{b.serviceName}</span>
                        <span className="block text-[10px] text-slate-400 capitalize">
                          {b.itemType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        {b.preferredDateTime || 'Flexible / Next week'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {b.price > 0 ? `₹${b.price.toLocaleString('en-IN')}` : 'Quote Request'}
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={b.status}
                          onChange={(e) => handleUpdateBookingStatus(b._id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : b.status === 'pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : b.status === 'completed'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedBooking(b)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No Product Orders Found</p>
          <p className="text-xs text-slate-400">
            When customers order catalog products through the bot, their orders appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Reference</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Quantity</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-700">
                      {o.orderReference}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{o.customerName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{o.customerPhone}</p>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{o.productName}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-700">{o.quantity} unit(s)</td>
                    <td className="px-5 py-3.5 font-bold text-emerald-700">
                      ₹{o.totalPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateOrderStatus(o._id, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                          o.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : o.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : o.status === 'shipped'
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : o.status === 'delivered'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedOrder(o)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title={`Booking: ${selectedBooking.bookingReference}`}
          subtitle={`Submitted ${formatRelativeTime(selectedBooking.createdAt)}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            {/* Header Summary */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                  Service Requested
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedBooking.serviceName}
                </h3>
                <p className="text-xs text-slate-500 capitalize">Type: {selectedBooking.itemType}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Amount
                </span>
                <span className="text-base font-extrabold text-emerald-700">
                  {selectedBooking.price > 0
                    ? `₹${selectedBooking.price.toLocaleString('en-IN')}`
                    : 'Quote on Request'}
                </span>
              </div>
            </div>

            {/* Customer Contact Details */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Customer Information
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Name</span>
                  <span className="font-bold text-slate-800">{selectedBooking.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">WhatsApp Phone</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedBooking.customerPhone}
                  </span>
                </div>
                {selectedBooking.customerEmail && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email</span>
                    <span className="text-slate-800">{selectedBooking.customerEmail}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block text-[10px]">Preferred Timing</span>
                  <span className="font-semibold text-emerald-800">
                    {selectedBooking.preferredDateTime || 'Next week / Flexible'}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Follow-Up Answers */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Customer Answers & Requirements
              </p>
              {selectedBooking.customerRequirements &&
              Object.keys(selectedBooking.customerRequirements).length > 0 ? (
                <div className="space-y-1.5">
                  {Object.entries(selectedBooking.customerRequirements).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between"
                    >
                      <span className="text-slate-500 font-semibold capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-bold text-slate-900">{val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No specific questions were required.</p>
              )}
            </div>

            {/* Status Change Control */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Update Status:</span>
                <select
                  value={selectedBooking.status}
                  onChange={(e) =>
                    handleUpdateBookingStatus(selectedBooking._id, e.target.value)
                  }
                  className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <Button variant="outline" size="sm" onClick={() => setSelectedBooking(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order: ${selectedOrder.orderReference}`}
          subtitle={`Placed ${formatRelativeTime(selectedOrder.createdAt)}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            {/* Header Summary */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">
                  Product Ordered
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedOrder.productName}
                </h3>
                <p className="text-xs text-slate-500">
                  Quantity: {selectedOrder.quantity} unit(s) • Unit Price: ₹
                  {selectedOrder.unitPrice.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Total Verified Price
                </span>
                <span className="text-base font-extrabold text-emerald-700">
                  ₹{selectedOrder.totalPrice.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Customer Details & Fulfilment */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Customer & Delivery Information
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Name</span>
                  <span className="font-bold text-slate-800">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">WhatsApp Phone</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedOrder.customerPhone}
                  </span>
                </div>
              </div>

              {selectedOrder.fulfilmentAddress && (
                <div className="pt-1">
                  <span className="text-slate-400 block text-[10px]">Delivery Address</span>
                  <span className="font-medium text-slate-800 text-xs">
                    {selectedOrder.fulfilmentAddress}
                  </span>
                </div>
              )}
            </div>

            {/* Status Change Control */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Update Status:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateOrderStatus(selectedOrder._id, e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
