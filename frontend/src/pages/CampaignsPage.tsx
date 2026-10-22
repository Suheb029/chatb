import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Send,
  Users,
  CheckCircle,
  Eye,
  Clock,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { api } from '../lib/api';
import { Campaign, MessageTemplate } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../lib/utils';

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Campaign Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    targetTags: 'VIP, Enterprise',
    sendOption: 'now',
    scheduledDate: '',
  });

  const { success, error } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [campRes, tmplRes] = await Promise.all([
        api.campaigns.getList(),
        api.templates.getList({ status: 'APPROVED' }),
      ]);
      if (campRes.data) setCampaigns(campRes.data);
      if (tmplRes.data) {
        setTemplates(tmplRes.data);
        if (tmplRes.data.length > 0) {
          setFormData((prev) => ({ ...prev, templateId: tmplRes.data[0]._id }));
        }
      }
    } catch (e: any) {
      error('Failed to load campaigns', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.templateId) {
      error('Validation Error', 'Campaign name and template are required.');
      return;
    }

    const payload = {
      name: formData.name,
      templateId: formData.templateId,
      targetTags: formData.targetTags.split(',').map((t) => t.trim()).filter(Boolean),
      scheduledAt: formData.sendOption === 'schedule' ? formData.scheduledDate : undefined,
    };

    try {
      const res = await api.campaigns.create(payload);
      success('Broadcast Launched', res.message);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      error('Campaign launch failed', err.message);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">WhatsApp Broadcast Campaigns</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliver bulk announcements, promotions, and updates to tagged audience segments using approved templates
          </p>
        </div>

        <Button variant="whatsapp" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
          New Broadcast
        </Button>
      </div>

      {/* Campaigns Grid */}
      <div className="space-y-4">
        {campaigns.map((camp) => {
          const deliveryRate = camp.sentCount > 0 ? Math.round((camp.deliveredCount / camp.sentCount) * 100) : 0;
          const readRate = camp.deliveredCount > 0 ? Math.round((camp.readCount / camp.deliveredCount) * 100) : 0;

          return (
            <Card key={camp._id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{camp.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        camp.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : camp.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {camp.sentAt ? `Dispatched on ${formatDate(camp.sentAt)}` : 'Scheduled'}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-700">
                      Target Tags: {(camp.targetTags || []).join(', ') || 'All Audience'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <span className="text-xs text-slate-400 font-medium block">Audience</span>
                    <span className="text-lg font-extrabold text-slate-900">{camp.totalAudience}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-slate-400 font-medium block">Delivered</span>
                    <span className="text-lg font-extrabold text-emerald-600">{deliveryRate}%</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-slate-400 font-medium block">Read Rate</span>
                    <span className="text-lg font-extrabold text-teal-700">{readRate}%</span>
                  </div>
                </div>
              </div>

              {/* Progress and status bars */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Sent Messages</span>
                  <span className="text-base font-bold text-slate-900">{camp.sentCount}</span>
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  <span className="text-emerald-700 block font-medium">Delivered</span>
                  <span className="text-base font-bold text-emerald-950">{camp.deliveredCount}</span>
                </div>
                <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-100">
                  <span className="text-teal-700 block font-medium">Read Receipts</span>
                  <span className="text-base font-bold text-teal-950">{camp.readCount}</span>
                </div>
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                  <span className="text-rose-700 block font-medium">Undelivered / Failed</span>
                  <span className="text-base font-bold text-rose-950">{camp.failedCount}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* New Campaign Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Launch WhatsApp Broadcast Campaign"
        subtitle="Select an approved template and target customer segment"
      >
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. VIP Festive Flash Sale Announcement"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Approved Message Template *</label>
            <select
              required
              value={formData.templateId}
              onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {templates.map((tmpl) => (
                <option key={tmpl._id} value={tmpl._id}>
                  {tmpl.name} ({tmpl.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Contact Tags (Comma-separated)</label>
            <input
              type="text"
              value={formData.targetTags}
              onChange={(e) => setFormData({ ...formData, targetTags: e.target.value })}
              placeholder="e.g. VIP, Enterprise, Lead"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Dispatch Timing</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="sendOption"
                  value="now"
                  checked={formData.sendOption === 'now'}
                  onChange={() => setFormData({ ...formData, sendOption: 'now' })}
                  className="accent-[#25D366]"
                />
                <span>Send Immediately</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="sendOption"
                  value="schedule"
                  checked={formData.sendOption === 'schedule'}
                  onChange={() => setFormData({ ...formData, sendOption: 'schedule' })}
                  className="accent-[#25D366]"
                />
                <span>Schedule for Later</span>
              </label>
            </div>
          </div>

          {formData.sendOption === 'schedule' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="whatsapp">
              Launch Campaign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
