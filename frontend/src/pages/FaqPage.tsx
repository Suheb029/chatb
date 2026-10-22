import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Search,
  Tag,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { api } from '../lib/api';
import { Faq } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

export const FaqPage: React.FC = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General' as 'General' | 'Pricing' | 'Products' | 'Shipping' | 'Refunds' | 'Support',
  });

  const { success, error } = useToast();

  const categories = ['General', 'Pricing', 'Products', 'Shipping', 'Refunds', 'Support'];

  useEffect(() => {
    loadFaqs();
  }, [category, search]);

  const loadFaqs = async () => {
    try {
      setIsLoading(true);
      const res = await api.faqs.getList({
        category: category !== 'all' ? category : undefined,
        search: search || undefined,
      });
      if (res.data) setFaqs(res.data);
    } catch (e: any) {
      error('Failed to load FAQs', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingFaq(null);
    setFormData({ question: '', answer: '', category: 'General' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (faq: Faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
    });
    setIsModalOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question || !formData.answer) {
      error('Validation Error', 'Question and answer are required.');
      return;
    }

    try {
      if (editingFaq) {
        await api.faqs.update(editingFaq._id, formData);
        success('FAQ Updated', 'Knowledge base question updated successfully.');
      } else {
        await api.faqs.create(formData);
        success('FAQ Created', 'New FAQ added to chatbot knowledge base.');
      }
      setIsModalOpen(false);
      loadFaqs();
    } catch (err: any) {
      error('Failed to save', err.message);
    }
  };

  const handleDelete = async (faq: Faq) => {
    if (window.confirm(`Delete question "${faq.question}"?`)) {
      try {
        await api.faqs.delete(faq._id);
        setFaqs((prev) => prev.filter((f) => f._id !== faq._id));
        success('FAQ Deleted', 'Question removed from knowledge base.');
      } catch (err: any) {
        error('Failed to delete', err.message);
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">FAQ Knowledge Base</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-defined questions and automated answers matched directly when customers ask common inquiries
          </p>
        </div>

        <Button variant="whatsapp" size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
          Add New FAQ
        </Button>
      </div>

      {/* Filter and Category Pills */}
      <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search FAQs by question or answer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 rounded-xl text-xs text-slate-900 border-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setCategory('all')}
            className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              category === 'all'
                ? 'bg-[#128C7E] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                category === cat
                  ? 'bg-[#128C7E] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {faqs.length === 0 ? (
          <Card className="p-12 text-center text-slate-400 text-xs">
            No FAQs found in this category.
          </Card>
        ) : (
          faqs.map((faq) => {
            const isExpanded = expandedId === faq._id;
            return (
              <Card key={faq._id} className="p-0 overflow-hidden shadow-xs hover:border-slate-300 transition-colors">
                <div
                  onClick={() => toggleExpand(faq._id)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        faq.category === 'Pricing'
                          ? 'bg-emerald-100 text-emerald-800'
                          : faq.category === 'Shipping'
                          ? 'bg-blue-100 text-blue-800'
                          : faq.category === 'Refunds'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {faq.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{faq.question}</h4>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                      Triggered {faq.triggerCount || 0} times
                    </span>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEdit(faq)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit FAQ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(faq)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-700 font-mono whitespace-pre-line leading-relaxed animate-slide-up">
                    <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1 font-sans">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Automated Response Preview:
                    </div>
                    {faq.answer}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Add / Edit FAQ Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFaq ? 'Edit FAQ Knowledge Base Item' : 'Add FAQ Knowledge Item'}
        subtitle="Manage questions and automated answers"
      >
        <form onSubmit={handleSaveFaq} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Customer Question *</label>
            <input
              type="text"
              required
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="e.g. What is your refund policy?"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Automated WhatsApp Answer *</label>
            <textarea
              rows={4}
              required
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              placeholder="The official response delivered to the customer..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="whatsapp">
              {editingFaq ? 'Update FAQ' : 'Save FAQ'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
