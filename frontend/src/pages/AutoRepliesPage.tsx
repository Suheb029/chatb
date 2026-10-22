import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Sparkles,
  Search,
  Check,
  Tag,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { api } from '../lib/api';
import { AutoReplyRule } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

export const AutoRepliesPage: React.FC = () => {
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    keywords: '',
    matchType: 'contains' as 'contains' | 'exact' | 'starts_with' | 'regex',
    responseMessage: '',
    category: 'General',
    priority: 5,
    actionType: 'reply' as 'reply' | 'handoff' | 'send_media',
  });

  const { success, error } = useToast();

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setIsLoading(true);
      const res = await api.autoReplies.getList();
      if (res.data) setRules(res.data);
    } catch (e: any) {
      error('Failed to load rules', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      keywords: '',
      matchType: 'contains',
      responseMessage: '',
      category: 'General',
      priority: 5,
      actionType: 'reply',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: AutoReplyRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      keywords: rule.keywords.join(', '),
      matchType: rule.matchType,
      responseMessage: rule.responseMessage,
      category: rule.category || 'General',
      priority: rule.priority || 5,
      actionType: rule.actionType || 'reply',
    });
    setIsModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.keywords || !formData.responseMessage) {
      error('Validation Error', 'Rule name, keywords, and response message are required.');
      return;
    }

    const payload = {
      name: formData.name,
      keywords: formData.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      matchType: formData.matchType,
      responseMessage: formData.responseMessage,
      category: formData.category,
      priority: Number(formData.priority),
      actionType: formData.actionType,
    };

    try {
      if (editingRule) {
        await api.autoReplies.update(editingRule._id, payload);
        success('Rule Updated', `Rule "${formData.name}" updated successfully.`);
      } else {
        await api.autoReplies.create(payload);
        success('Rule Created', `Rule "${formData.name}" created successfully.`);
      }
      setIsModalOpen(false);
      loadRules();
    } catch (err: any) {
      error('Failed to save rule', err.message);
    }
  };

  const handleToggle = async (rule: AutoReplyRule) => {
    try {
      await api.autoReplies.toggle(rule._id);
      setRules((prev) =>
        prev.map((r) => (r._id === rule._id ? { ...r, isActive: !r.isActive } : r))
      );
      success('Rule Toggled', `Rule "${rule.name}" is now ${!rule.isActive ? 'Active' : 'Disabled'}.`);
    } catch (err: any) {
      error('Failed to toggle', err.message);
    }
  };

  const handleDelete = async (rule: AutoReplyRule) => {
    if (window.confirm(`Delete rule "${rule.name}"?`)) {
      try {
        await api.autoReplies.delete(rule._id);
        setRules((prev) => prev.filter((r) => r._id !== rule._id));
        success('Rule Deleted', `Rule "${rule.name}" removed.`);
      } catch (err: any) {
        error('Failed to delete', err.message);
      }
    }
  };

  const handleTestMatch = async () => {
    if (!testInput.trim()) return;
    try {
      const res = await api.bot.testSimulator(testInput);
      setTestResult(res.decision);
    } catch (e: any) {
      error('Test failed', e.message);
    }
  };

  const filteredRules = rules.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase())) ||
      r.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Automated Keyword Replies</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure instant WhatsApp responses when customer messages match specific keywords and triggers
          </p>
        </div>

        <Button variant="whatsapp" size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
          Create Reply Rule
        </Button>
      </div>

      {/* Interactive Keyword Tester Card */}
      <Card className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200/80">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Instant Rule & Keyword Tester</h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Type sample customer phrases (e.g., "what is the price?", "where is my order?", "speak to person") to verify matching:
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a test phrase to simulate rule matching..."
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTestMatch()}
            className="flex-1 text-xs px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Button variant="whatsapp" size="sm" onClick={handleTestMatch}>
            Test Rule
          </Button>
        </div>

        {testResult && (
          <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-200 text-xs shadow-xs animate-slide-up flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                Decision: <span className="text-emerald-700 capitalize">{testResult.action}</span>
              </span>
              {testResult.matchedRuleName && (
                <Badge variant="whatsapp">Matched: {testResult.matchedRuleName}</Badge>
              )}
            </div>
            <p className="text-slate-600 font-mono text-[11px] whitespace-pre-line bg-slate-50 p-2 rounded-lg border border-slate-100">
              {testResult.responseText}
            </p>
          </div>
        )}
      </Card>

      {/* Search & Rules Count */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter rules by keyword, name, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">{filteredRules.length} rules active</span>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRules.map((rule) => (
          <Card key={rule._id} className="p-5 flex flex-col justify-between hover space-y-4" hover>
            <div className="space-y-3">
              {/* Header: Title and Active Switch */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{rule.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {rule.category}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Match: {rule.matchType}
                    </span>
                  </div>
                </div>

                {/* Active switch */}
                <button
                  onClick={() => handleToggle(rule)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    rule.isActive ? 'bg-[#25D366]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                      rule.isActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Trigger Keywords Pills */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Keywords Trigger
                </span>
                <div className="flex flex-wrap gap-1">
                  {rule.keywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono"
                    >
                      "{kw}"
                    </span>
                  ))}
                </div>
              </div>

              {/* Response Message Snippet */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Automated Reply
                </span>
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-3 font-mono leading-relaxed">
                  {rule.responseMessage}
                </p>
              </div>
            </div>

            {/* Footer Stats and Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-medium">
                Triggered {rule.triggerCount || 0} times
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(rule)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Edit Rule"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(rule)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Delete Rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add / Edit Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? 'Edit Automated Reply Rule' : 'Create Automated Reply Rule'}
        subtitle="Set keyword triggers, match criteria, and response text"
      >
        <form onSubmit={handleSaveRule} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rule Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Pricing & Subscription Plans"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Sales, Support, Orders"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Match Type</label>
              <select
                value={formData.matchType}
                onChange={(e) => setFormData({ ...formData, matchType: e.target.value as any })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="contains">Contains Keyword</option>
                <option value="exact">Exact Match</option>
                <option value="starts_with">Starts With</option>
                <option value="regex">Regular Expression</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Trigger Keywords * (Comma-separated)
            </label>
            <input
              type="text"
              required
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="price, cost, plan, plans, pricing, discount"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Automated WhatsApp Response *</label>
            <textarea
              rows={4}
              required
              value={formData.responseMessage}
              onChange={(e) => setFormData({ ...formData, responseMessage: e.target.value })}
              placeholder="The message WhatsApp sends back to the customer..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="whatsapp">
              {editingRule ? 'Update Rule' : 'Save Rule'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
