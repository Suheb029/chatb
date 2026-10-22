import React, { useState, useEffect } from 'react';
import {
  Bot,
  Zap,
  Clock,
  UserCheck,
  Sparkles,
  HelpCircle,
  Save,
  CheckCircle2,
  Sliders,
  Play,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import { api } from '../lib/api';
import { BotSettings } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';

export const BotBuilderPage: React.FC<{ onOpenSimulator: () => void }> = ({ onOpenSimulator }) => {
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'hours' | 'handoff' | 'visual'>('visual');

  const { success, error } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const res = await api.bot.getSettings();
      if (res.data) setSettings(res.data);
    } catch (e: any) {
      error('Failed to load bot settings', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setIsSaving(true);
      await api.bot.updateSettings(settings);
      success('Settings Saved', 'Chatbot configuration updated successfully.');
    } catch (e: any) {
      error('Failed to save settings', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWorkDay = (day: number) => {
    if (!settings) return;
    const current = settings.businessHours.workDays || [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();

    setSettings({
      ...settings,
      businessHours: {
        ...settings.businessHours,
        workDays: updated,
      },
    });
  };

  if (isLoading || !settings) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const daysOfWeek = [
    { num: 1, name: 'Mon' },
    { num: 2, name: 'Tue' },
    { num: 3, name: 'Wed' },
    { num: 4, name: 'Thu' },
    { num: 5, name: 'Fri' },
    { num: 6, name: 'Sat' },
    { num: 7, name: 'Sun' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Banner & Master Bot Switch */}
      <Card className="p-6 bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-emerald-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Chatbot Automation Engine</h2>
              <Badge variant={settings.isEnabled ? 'success' : 'neutral'} dot>
                {settings.isEnabled ? 'Active & Responding' : 'Bot Paused'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control greeting messages, business hours routing, human handoff triggers, and fallback replies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Master Enable/Disable Toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-700">Chatbot Enabled</span>
            <input
              type="checkbox"
              checked={settings.isEnabled}
              onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-[#25D366]"
            />
          </label>

          <Button
            variant="whatsapp"
            size="sm"
            icon={<Play className="w-3.5 h-3.5" />}
            onClick={onOpenSimulator}
          >
            Live Simulator
          </Button>

          <Button
            variant="primary"
            size="sm"
            isLoading={isSaving}
            icon={<Save className="w-3.5 h-3.5" />}
            onClick={handleSave}
          >
            Save All
          </Button>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'visual', label: 'Visual Workflow Map', icon: <GitBranch className="w-4 h-4" /> },
          { id: 'general', label: 'Welcome & Fallback Messages', icon: <Bot className="w-4 h-4" /> },
          { id: 'hours', label: 'Business Hours & After-Hours', icon: <Clock className="w-4 h-4" /> },
          { id: 'handoff', label: 'Human Agent Handoff', icon: <UserCheck className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-[#128C7E] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: VISUAL WORKFLOW MAP */}
      {activeTab === 'visual' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Interactive Visual Workflow Flowchart</h3>
              <p className="text-xs text-slate-500">
                Evaluation path taken when an incoming WhatsApp customer message is received
              </p>
            </div>
            <Badge variant="whatsapp">Hierarchical Priority Routing</Badge>
          </div>

          <div className="space-y-4 relative">
            {/* Pipeline Step 1 */}
            <Card className="p-4 border-l-4 border-l-blue-500 bg-blue-50/30 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs mt-0.5">1</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Trigger: Incoming WhatsApp Message</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Customer sends any text message from WhatsApp via Meta Cloud API or Demo Sandbox.
                  </p>
                </div>
              </div>
              <Badge variant="info">Event: message.received</Badge>
            </Card>

            <div className="flex justify-center -my-2">
              <ArrowRight className="w-4 h-4 text-slate-400 rotate-90" />
            </div>

            {/* Pipeline Step 2 */}
            <Card className="p-4 border-l-4 border-l-rose-500 bg-rose-50/30 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700 font-bold text-xs mt-0.5">2</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Priority Check: Human Agent Handoff Keywords?</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Evaluates if text contains handoff trigger words: <span className="font-mono bg-white px-1 py-0.5 rounded border border-rose-200 font-bold text-rose-900">{(settings.handoffKeywords || []).join(', ')}</span>
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-lg">
                Action: Transfer to Live Agent
              </span>
            </Card>

            <div className="flex justify-center -my-2">
              <ArrowRight className="w-4 h-4 text-slate-400 rotate-90" />
            </div>

            {/* Pipeline Step 3 */}
            <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50/30 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700 font-bold text-xs mt-0.5">3</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Schedule Check: Is Outside Business Hours?</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Configured for {settings.businessHours.start} to {settings.businessHours.end} ({settings.businessHours.timezone}).
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-lg">
                Action: Send After-Hours Notice
              </span>
            </Card>

            <div className="flex justify-center -my-2">
              <ArrowRight className="w-4 h-4 text-slate-400 rotate-90" />
            </div>

            {/* Pipeline Step 4 */}
            <Card className="p-4 border-l-4 border-l-[#25D366] bg-emerald-50/30 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs mt-0.5">4</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Keyword Rule Matching (Automated Replies)</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Matches exact keywords, partial contains, or regex across active automated reply rules (e.g. "price", "hours", "order").
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
                Action: Instant Automated Reply
              </span>
            </Card>

            <div className="flex justify-center -my-2">
              <ArrowRight className="w-4 h-4 text-slate-400 rotate-90" />
            </div>

            {/* Pipeline Step 5 */}
            <Card className="p-4 border-l-4 border-l-slate-400 bg-slate-50 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs mt-0.5">5</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Fallback Handler (Unmatched Queries)</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    If no rule or FAQ matched, replies with default guidance and prompts the user to rephrase or ask for an agent.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded-lg">
                Action: Send Fallback Message
              </span>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: GENERAL WELCOME & FALLBACK */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bot Display Name</label>
              <input
                type="text"
                value={settings.botName}
                onChange={(e) => setSettings({ ...settings, botName: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-md"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                👋 Welcome Greeting Message
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Sent automatically when a customer initiates a new conversation or greets with "hi", "hello", "start", or "menu".
              </p>
              <textarea
                rows={4}
                value={settings.welcomeMessage}
                onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                🤖 Default Fallback Response
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Triggered when a customer query does not match any automated reply rules, FAQs, or handoff keywords.
              </p>
              <textarea
                rows={4}
                value={settings.fallbackMessage}
                onChange={(e) => setSettings({ ...settings, fallbackMessage: e.target.value })}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: BUSINESS HOURS */}
      {activeTab === 'hours' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Business Hours Enforcement</h3>
              <p className="text-xs text-slate-500">Route conversations and send after-hours messages automatically</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-slate-700">Enforce Business Hours</span>
              <input
                type="checkbox"
                checked={settings.businessHoursEnabled}
                onChange={(e) => setSettings({ ...settings, businessHoursEnabled: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-[#25D366]"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Opening Time</label>
              <input
                type="time"
                value={settings.businessHours.start}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    businessHours: { ...settings.businessHours, start: e.target.value },
                  })
                }
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Closing Time</label>
              <input
                type="time"
                value={settings.businessHours.end}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    businessHours: { ...settings.businessHours, end: e.target.value },
                  })
                }
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Timezone</label>
              <input
                type="text"
                value={settings.businessHours.timezone}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    businessHours: { ...settings.businessHours, timezone: e.target.value },
                  })
                }
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Operating Work Days</label>
            <div className="flex items-center gap-2">
              {daysOfWeek.map((day) => {
                const isSelected = settings.businessHours.workDays?.includes(day.num);
                return (
                  <button
                    key={day.num}
                    type="button"
                    onClick={() => toggleWorkDay(day.num)}
                    className={`w-10 h-10 rounded-xl font-bold text-xs transition-colors ${
                      isSelected
                        ? 'bg-[#128C7E] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {day.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              🌙 After-Hours Automated Notice
            </label>
            <textarea
              rows={3}
              value={settings.afterHoursMessage}
              onChange={(e) => setSettings({ ...settings, afterHoursMessage: e.target.value })}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
        </Card>
      )}

      {/* TAB 4: HUMAN AGENT HANDOFF */}
      {activeTab === 'handoff' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Seamless Human Agent Handoff</h3>
              <p className="text-xs text-slate-500">
                Immediately route customer to an active live support agent when requested
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-slate-700">Handoff Enabled</span>
              <input
                type="checkbox"
                checked={settings.handoffEnabled}
                onChange={(e) => setSettings({ ...settings, handoffEnabled: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-[#25D366]"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Trigger Keywords (Comma-separated)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              If the customer mentions any of these terms, the bot marks the conversation OPEN and transfers to human inbox.
            </p>
            <input
              type="text"
              value={(settings.handoffKeywords || []).join(', ')}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  handoffKeywords: e.target.value.split(',').map((k) => k.trim()),
                })
              }
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              👤 Handoff Confirmation Message
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Sent to the customer to let them know a human agent is joining the conversation.
            </p>
            <textarea
              rows={3}
              value={settings.handoffMessage}
              onChange={(e) => setSettings({ ...settings, handoffMessage: e.target.value })}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
        </Card>
      )}

      {/* Floating Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onOpenSimulator} icon={<Play className="w-3.5 h-3.5" />}>
          Test Changes in Simulator
        </Button>
        <Button variant="whatsapp" isLoading={isSaving} onClick={handleSave} icon={<Save className="w-4 h-4" />}>
          Save Configuration
        </Button>
      </div>
    </div>
  );
};
