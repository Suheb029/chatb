import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Send,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Smartphone,
  Eye,
  Trash2,
  Edit2,
  Info,
} from 'lucide-react';
import { api } from '../lib/api';
import { MessageTemplate } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'UTILITY' as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION',
    language: 'en_US',
    headerType: 'NONE' as 'NONE' | 'TEXT' | 'IMAGE' | 'DOCUMENT',
    headerText: '',
    bodyText: '',
    footerText: '',
    buttonType: 'QUICK_REPLY' as 'QUICK_REPLY' | 'URL',
    buttonText: '',
    buttonValue: '',
  });

  const { success, error, info } = useToast();

  useEffect(() => {
    loadTemplates();
  }, [categoryFilter]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const res = await api.templates.getList({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      if (res.data) {
        setTemplates(res.data);
        if (!selectedTemplate && res.data.length > 0) {
          setSelectedTemplate(res.data[0]);
        }
      }
    } catch (e: any) {
      error('Failed to load templates', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category: 'UTILITY',
      language: 'en_US',
      headerType: 'NONE',
      headerText: '',
      bodyText: '',
      footerText: '',
      buttonType: 'QUICK_REPLY',
      buttonText: '',
      buttonValue: '',
    });
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.bodyText) {
      error('Validation Error', 'Template name and body text are required.');
      return;
    }

    const buttons = formData.buttonText
      ? [{ type: formData.buttonType, text: formData.buttonText, value: formData.buttonValue }]
      : [];

    const payload = {
      name: formData.name,
      category: formData.category,
      language: formData.language,
      headerType: formData.headerType,
      headerText: formData.headerText,
      bodyText: formData.bodyText,
      footerText: formData.footerText,
      buttons,
      status: 'APPROVED',
    };

    try {
      await api.templates.create(payload);
      success('Template Created', `Template "${formData.name}" created and verified in demo sandbox.`);
      setIsModalOpen(false);
      loadTemplates();
    } catch (err: any) {
      error('Creation failed', err.message);
    }
  };

  const handleSubmitApproval = async (tmpl: MessageTemplate) => {
    try {
      info('Submitting to Meta...', 'Sending template definition to Meta Cloud Graph API verification queue.');
      const res = await api.templates.submitApproval(tmpl._id);
      success('Meta Status Updated', res.message);
      loadTemplates();
    } catch (err: any) {
      error('Approval submission failed', err.message);
    }
  };

  const handleDelete = async (tmpl: MessageTemplate) => {
    if (window.confirm(`Delete template "${tmpl.name}"?`)) {
      try {
        await api.templates.delete(tmpl._id);
        success('Template Deleted', `${tmpl.name} removed.`);
        loadTemplates();
      } catch (err: any) {
        error('Failed to delete', err.message);
      }
    }
  };

  const preview = selectedTemplate || templates[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Meta Compliance Policy Notice */}
      <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/80 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900">
            Official Meta WhatsApp Business Template Guidelines
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            WhatsApp requires all business-initiated messages sent outside the standard 24-hour customer support window to use pre-approved Message Templates (HSMs). In demo mode, templates can be drafted, tested, and reviewed immediately. For live production, templates are submitted to Meta via Graph API v20.0 and reviewed against WhatsApp Commerce policies.
          </p>
        </div>
      </Card>

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">WhatsApp Message Templates (HSM)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage reusable templates with dynamic variables like <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-emerald-800 font-bold">{'{{1}}'}</code>, CTA links, and quick replies
          </p>
        </div>

        <Button variant="whatsapp" size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
          Create New Template
        </Button>
      </div>

      {/* Main Two-Column View: Template Cards & Live Device Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Template List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            {['all', 'MARKETING', 'UTILITY', 'AUTHENTICATION'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all capitalize ${
                  categoryFilter === cat
                    ? 'bg-[#128C7E] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {templates.map((tmpl) => {
              const isSelected = preview?._id === tmpl._id;
              return (
                <Card
                  key={tmpl._id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`p-5 cursor-pointer transition-all border ${
                    isSelected ? 'border-[#25D366] bg-emerald-50/20 shadow-sm' : 'hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 font-mono">{tmpl.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            tmpl.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tmpl.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : tmpl.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tmpl.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-semibold text-slate-600">{tmpl.category}</span>
                        <span>•</span>
                        <span>{tmpl.language}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {tmpl.status === 'DRAFT' && (
                        <button
                          onClick={() => handleSubmitApproval(tmpl)}
                          className="text-[11px] font-bold text-emerald-700 hover:underline bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg"
                        >
                          Submit to Meta
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(tmpl)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body Preview */}
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono line-clamp-2">
                    {tmpl.bodyText}
                  </p>

                  {/* Buttons Preview */}
                  {tmpl.buttons && tmpl.buttons.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {tmpl.buttons.map((btn, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-bold text-[#128C7E] bg-white border border-emerald-200 px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1"
                        >
                          {btn.type === 'URL' && <ExternalLink className="w-3 h-3" />}
                          {btn.text}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column (1 col): Live WhatsApp Phone Preview Mockup */}
        <div>
          <div className="sticky top-24 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live WhatsApp Device Preview
              </span>
              <Badge variant="whatsapp">Real-time render</Badge>
            </div>

            {preview ? (
              <div className="rounded-3xl border-4 border-slate-800 bg-slate-900 p-2 shadow-modal">
                {/* Smartphone Speaker / Notch */}
                <div className="w-20 h-3 bg-slate-800 rounded-full mx-auto mb-2" />

                <div className="rounded-2xl overflow-hidden whatsapp-chat-bg flex flex-col h-[460px]">
                  {/* WhatsApp Top Bar */}
                  <div className="bg-[#075E54] p-3 text-white flex items-center gap-2 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs text-white">
                      WB
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">WhatBot Official</p>
                      <p className="text-[10px] text-emerald-200">Official Business Account</p>
                    </div>
                  </div>

                  {/* Message Bubble Canvas */}
                  <div className="p-4 flex-1 flex flex-col justify-end">
                    <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-md border border-slate-200 space-y-2 max-w-[90%]">
                      {/* Header */}
                      {preview.headerText && (
                        <h4 className="font-bold text-xs text-slate-900">{preview.headerText}</h4>
                      )}

                      {/* Body */}
                      <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                        {preview.bodyText
                          .replace('{{1}}', 'Alex Rivera')
                          .replace('{{2}}', '#WB-94821')
                          .replace('{{3}}', 'Express Courier')}
                      </p>

                      {/* Footer */}
                      {preview.footerText && (
                        <p className="text-[10px] text-slate-400">{preview.footerText}</p>
                      )}

                      {/* Action Buttons */}
                      {preview.buttons && preview.buttons.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                          {preview.buttons.map((b, i) => (
                            <div
                              key={i}
                              className="text-center text-xs font-bold text-[#128C7E] bg-slate-50 hover:bg-slate-100 p-2 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center gap-1.5"
                            >
                              {b.type === 'URL' && <ExternalLink className="w-3.5 h-3.5" />}
                              <span>{b.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                Select a template to view the live preview.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Template Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create WhatsApp Message Template"
        subtitle="Define HSM header, body with {{1}} parameters, and call-to-action buttons"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Template Name * (Lowercase letters & underscores only)
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. order_delivery_update"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="UTILITY">Utility</option>
                <option value="MARKETING">Marketing</option>
                <option value="AUTHENTICATION">Authentication</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="en_US">English (US)</option>
                <option value="es_ES">Spanish</option>
                <option value="pt_BR">Portuguese</option>
                <option value="fr_FR">French</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Header Title (Optional)</label>
            <input
              type="text"
              value={formData.headerText}
              onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
              placeholder="e.g. 📦 Your Order Has Shipped!"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Body Message * (Use {'{{1}}'}, {'{{2}}'} for variable parameters)
            </label>
            <textarea
              rows={4}
              required
              value={formData.bodyText}
              onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
              placeholder="Hello {{1}}, great news! Your order #{{2}} has been confirmed."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Footer Text (Optional)</label>
            <input
              type="text"
              value={formData.footerText}
              onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
              placeholder="e.g. Reply STOP to opt out"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CTA Button Text</label>
              <input
                type="text"
                value={formData.buttonText}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                placeholder="e.g. Track Order"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target URL</label>
              <input
                type="text"
                value={formData.buttonValue}
                onChange={(e) => setFormData({ ...formData, buttonValue: e.target.value })}
                placeholder="https://example.com/track"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="whatsapp">
              Create Template
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
