import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Briefcase,
  ShoppingBag,
  Layers,
  Calendar,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  X,
  PlusCircle,
  Check,
} from 'lucide-react';
import { api } from '../lib/api';
import { CatalogItem, FollowUpQuestion } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

export const CatalogServicesPage: React.FC = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<CatalogItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New question draft inside modal
  const [newQText, setNewQText] = useState('');
  const [newQKey, setNewQKey] = useState('');
  const [newQType, setNewQType] = useState<'text' | 'options' | 'number'>('text');
  const [newQOptions, setNewQOptions] = useState('');
  const [newQRequired, setNewQRequired] = useState(true);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  const { success, error, info } = useToast();

  useEffect(() => {
    loadItems();
  }, [selectedType, searchQuery]);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const res = await api.catalog.getList({
        type: selectedType !== 'all' ? selectedType : undefined,
        search: searchQuery || undefined,
      });
      if (res.data) {
        const normalized: CatalogItem[] = (res.data || []).map((i: any) => ({
          _id: i._id,
          name: i.name || '',
          description: i.description || '',
          image: i.image || '',
          category: i.category || 'General',
          price: Number(i.price) || 0,
          pricingType: i.pricingType || i.priceType || 'fixed',
          estimatedDuration: i.estimatedDuration || i.duration || '',
          itemType: (i.itemType || 'service').toLowerCase() as any,
          isActive: i.isActive !== false,
          requiresFulfilmentAddress: i.requiresFulfilmentAddress || i.requiresAddress || false,
          followUpQuestions: (i.followUpQuestions || []).map((q: any) => ({
            id: q.id || '',
            question: q.question || '',
            key: q.key || q.id || '',
            type: q.type || 'text',
            options: q.options || [],
            required: q.required !== false,
          })),
        }));
        setItems(normalized);
      }
    } catch (e: any) {
      error('Failed to load catalog', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingItem({
      name: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
      category: 'General',
      price: 0,
      pricingType: 'fixed',
      estimatedDuration: '',
      itemType: 'service',
      isActive: true,
      requiresFulfilmentAddress: false,
      followUpQuestions: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: CatalogItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSaveItem = async () => {
    if (!editingItem || !editingItem.name?.trim()) {
      error('Validation Error', 'Item name is required.');
      return;
    }

    try {
      setIsSaving(true);
      if (editingItem._id) {
        await api.catalog.update(editingItem._id, editingItem);
        success('Catalog Item Updated', `"${editingItem.name}" updated successfully.`);
      } else {
        await api.catalog.create(editingItem);
        success('Catalog Item Created', `"${editingItem.name}" added to catalog.`);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      loadItems();
    } catch (e: any) {
      error('Failed to save item', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.catalog.delete(id);
      success('Item Removed', `"${name}" removed from catalog.`);
      loadItems();
    } catch (e: any) {
      error('Failed to delete', e.message);
    }
  };

  const handleAddQuestionToItem = () => {
    if (!newQText.trim()) return;
    const key = newQKey.trim() || newQText.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const optionsArray =
      newQType === 'options'
        ? newQOptions.split(',').map((o) => o.trim()).filter(Boolean)
        : undefined;

    const newQ: FollowUpQuestion = {
      id: `q_${Date.now()}`,
      question: newQText.trim(),
      key,
      type: newQType,
      options: optionsArray,
      required: newQRequired,
    };

    const currentQuestions = editingItem?.followUpQuestions || [];
    setEditingItem({
      ...editingItem,
      followUpQuestions: [...currentQuestions, newQ],
    });

    setNewQText('');
    setNewQKey('');
    setNewQOptions('');
    setShowAddQuestion(false);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (!editingItem) return;
    const questions = editingItem.followUpQuestions?.filter((_, i) => i !== idx) || [];
    setEditingItem({ ...editingItem, followUpQuestions: questions });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Products, Services & Catalog Offerings</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure all offerings that your WhatsApp bot presents to customers during conversations, complete with custom follow-up questions.
          </p>
        </div>

        <Button
          variant="whatsapp"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreateModal}
        >
          Add New Offering
        </Button>
      </div>

      {/* Filter Tabs and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Offerings', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'service', label: 'Services', icon: <Briefcase className="w-3.5 h-3.5" /> },
            { id: 'product', label: 'Products', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
            { id: 'package', label: 'Packages', icon: <Package className="w-3.5 h-3.5" /> },
            { id: 'plan', label: 'Plans & Retainers', icon: <Calendar className="w-3.5 h-3.5" /> },
          ].map((tab) => {
            const isActive = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#128C7E] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search offerings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Loading catalog items...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Catalog Offerings Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add your services, products, packages, or subscription plans so WhatBot can present them to customers.
          </p>
          <Button variant="whatsapp" size="sm" onClick={handleOpenCreateModal}>
            Create First Offering
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col overflow-hidden"
            >
              {/* Card Header & Thumbnail */}
              <div className="relative h-40 bg-slate-100 overflow-hidden border-b border-slate-100">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-xs ${
                      item.itemType === 'service'
                        ? 'bg-emerald-600 text-white'
                        : item.itemType === 'product'
                        ? 'bg-blue-600 text-white'
                        : item.itemType === 'package'
                        ? 'bg-purple-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {item.itemType}
                  </span>
                  <span className="text-[10px] font-semibold bg-black/60 text-white backdrop-blur-sm px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <Badge variant={item.isActive ? 'whatsapp' : 'neutral'} size="sm">
                    {item.isActive ? 'Active' : 'Hidden'}
                  </Badge>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Price and Duration */}
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      {item.pricingType === 'quote_required'
                        ? 'Pricing'
                        : item.pricingType === 'starting_at'
                        ? 'Starting From'
                        : 'Price'}
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      {item.pricingType === 'quote_required'
                        ? 'Quote on Request'
                        : `₹${item.price.toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  {item.estimatedDuration && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Duration
                      </span>
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {item.estimatedDuration}
                      </span>
                    </div>
                  )}
                </div>

                {/* Follow-up questions badge */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                    {item.followUpQuestions?.length || 0} Bot Question(s)
                  </span>

                  {item.requiresFulfilmentAddress && (
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      Delivery Address Req.
                    </span>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-end gap-1.5 pt-2">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                    title="Edit Item"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item._id, item.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Item Modal */}
      {editingItem && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem._id ? 'Edit Offering' : 'Add New Offering'}
          subtitle="Configure item details, pricing, fulfillment, and conversation follow-up questions"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="e.g. Website Development"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editingItem.itemType || 'service'}
                  onChange={(e) => setEditingItem({ ...editingItem, itemType: e.target.value as any })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="service">Service (e.g. Development, Design, Clinic)</option>
                  <option value="product">Product (e.g. Hardware, Merchandise)</option>
                  <option value="package">Package (e.g. Starter Bundle, Setup Pack)</option>
                  <option value="plan">Plan / Retainer (e.g. Monthly Maintenance)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={editingItem.category || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  placeholder="e.g. Engineering, Hardware"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pricing Model</label>
                <select
                  value={editingItem.pricingType || 'fixed'}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, pricingType: e.target.value as any })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="starting_at">Starting At</option>
                  <option value="quote_required">Quote on Request</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Price (Amount in ₹)
                </label>
                <input
                  type="number"
                  disabled={editingItem.pricingType === 'quote_required'}
                  value={editingItem.price ?? 0}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, price: Number(e.target.value) || 0 })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Duration / Fulfillment Time
                </label>
                <input
                  type="text"
                  value={editingItem.estimatedDuration || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, estimatedDuration: e.target.value })
                  }
                  placeholder="e.g. 1-2 weeks, 45 mins, 2-3 business days"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Image Thumbnail URL
                </label>
                <input
                  type="text"
                  value={editingItem.image || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={editingItem.description || ''}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                placeholder="Clear overview of what is included in this offering..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={editingItem.isActive ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                Active (Visible in WhatsApp Bot)
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={editingItem.requiresFulfilmentAddress ?? false}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      requiresFulfilmentAddress: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                Require Delivery / Fulfilment Address
              </label>
            </div>

            {/* Custom Follow-Up Questions Section */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Conversation Follow-Up Questions
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    WhatBot asks these questions dynamically when a customer selects this offering.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddQuestion(!showAddQuestion)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Question
                </button>
              </div>

              {/* Add Question Subform */}
              {showAddQuestion && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
                  <p className="text-xs font-bold text-emerald-950">Add New Follow-Up Question</p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Question Text (e.g. What type of website do you need?)
                    </label>
                    <input
                      type="text"
                      value={newQText}
                      onChange={(e) => setNewQText(e.target.value)}
                      placeholder="e.g. What is your estimated budget?"
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Answer Format
                      </label>
                      <select
                        value={newQType}
                        onChange={(e) => setNewQType(e.target.value as any)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="text">Free Text</option>
                        <option value="options">Multiple Choice Options</option>
                        <option value="number">Number / Amount</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Identifier Key
                      </label>
                      <input
                        type="text"
                        value={newQKey}
                        onChange={(e) => setNewQKey(e.target.value)}
                        placeholder="e.g. budget, website_type"
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {newQType === 'options' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Comma-separated Options
                      </label>
                      <input
                        type="text"
                        value={newQOptions}
                        onChange={(e) => setNewQOptions(e.target.value)}
                        placeholder="e.g. Business website, E-commerce store, Custom web app"
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newQRequired}
                        onChange={(e) => setNewQRequired(e.target.checked)}
                        className="w-3.5 h-3.5 text-emerald-600 rounded"
                      />
                      Required Answer
                    </label>

                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => setShowAddQuestion(false)}>
                        Cancel
                      </Button>
                      <Button variant="whatsapp" size="sm" onClick={handleAddQuestionToItem}>
                        Attach Question
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-2">
                {editingItem.followUpQuestions && editingItem.followUpQuestions.length > 0 ? (
                  editingItem.followUpQuestions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{q.question}</span>
                          <Badge variant="neutral" size="sm">
                            {q.type}
                          </Badge>
                          {q.required && (
                            <span className="text-[10px] text-rose-500 font-bold">*Required</span>
                          )}
                        </div>

                        {q.options && q.options.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pl-7 pt-1">
                            {q.options.map((opt, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md"
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-center">
                    No custom questions defined. The bot will proceed directly to date/contact collection.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="whatsapp"
                size="sm"
                icon={<Check className="w-4 h-4" />}
                isLoading={isSaving}
                onClick={handleSaveItem}
              >
                Save Offering
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
