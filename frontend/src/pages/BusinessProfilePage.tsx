import React, { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  RotateCcw,
  Sparkles,
  Briefcase,
  ShoppingBag,
  Layers,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Plus,
  Trash2,
  Check,
  Eye,
  Bot,
} from 'lucide-react';
import { api } from '../lib/api';
import { BusinessConfiguration, BusinessMenuOption } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';

export const BusinessProfilePage: React.FC = () => {
  const [config, setConfig] = useState<BusinessConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionAction, setNewOptionAction] = useState('enquiry');
  const [showAddOption, setShowAddOption] = useState(false);

  const { success, error, info } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const res = await api.businessConfig.get();
      if (res.data) {
        const raw = res.data;
        const normalized: BusinessConfiguration = {
          _id: raw._id,
          businessName: raw.businessName || 'Apex Innovations & Tech Labs',
          businessType: raw.businessType || 'Hybrid',
          tagline: raw.tagline || 'Custom Software Development & Enterprise Hardware',
          welcomeMessage:
            raw.welcomeMessage ||
            raw.welcomeGreeting ||
            'Hello! 👋 Welcome to [Business Name].\n\nHow can we help you today?',
          menuOptions: (raw.menuOptions || []).map((o: any, idx: number) => ({
            id: o.id || `opt_${idx}`,
            label: o.label || '',
            action: o.action || 'enquiry',
            enabled: o.enabled !== undefined ? o.enabled : o.isEnabled !== false,
          })),
          currency: raw.currency || '₹',
          appointmentSettings: {
            enabled: raw.appointmentSettings?.enabled ?? true,
            slotDurationMinutes: raw.appointmentSettings?.slotDurationMinutes || 45,
            availableDays: raw.appointmentSettings?.availableDays || [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
            ],
            availableHours: raw.appointmentSettings?.availableHours || '09:30 AM - 06:30 PM',
            advanceBookingDays: raw.appointmentSettings?.advanceBookingDays || 14,
          },
          contactInfo: {
            phone: raw.contactInfo?.phone || '+91 98765 43210',
            email: raw.contactInfo?.email || 'support@apexinnovations.in',
            address: raw.contactInfo?.address || '100 Innovation Park, Tech Corridor, Bangalore',
            supportHours: raw.contactInfo?.supportHours || 'Mon-Fri: 9:00 AM - 6:30 PM IST',
          },
        };
        setConfig(normalized);
      }
    } catch (e: any) {
      error('Failed to load configuration', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      setIsSaving(true);
      const res = await api.businessConfig.update(config);
      if (res.data) {
        setConfig(res.data);
        success('Business Profile Saved', 'Updated assistant configuration and welcome menu.');
      }
    } catch (e: any) {
      error('Failed to save settings', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMenuOption = (index: number) => {
    if (!config) return;
    const updated = [...config.menuOptions];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    setConfig({ ...config, menuOptions: updated });
  };

  const handleRemoveMenuOption = (index: number) => {
    if (!config) return;
    const updated = config.menuOptions.filter((_, i) => i !== index);
    setConfig({ ...config, menuOptions: updated });
  };

  const handleAddMenuOption = () => {
    if (!config || !newOptionLabel.trim()) return;
    const newOpt: BusinessMenuOption = {
      id: `opt_${Date.now()}`,
      label: newOptionLabel.trim(),
      action: newOptionAction,
      enabled: true,
    };
    setConfig({ ...config, menuOptions: [...config.menuOptions, newOpt] });
    setNewOptionLabel('');
    setShowAddOption(false);
    success('Menu Option Added', `Added "${newOpt.label}" to the welcome menu.`);
  };

  const handleToggleDay = (day: string) => {
    if (!config) return;
    const days = config.appointmentSettings.availableDays || [];
    const updated = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day];
    setConfig({
      ...config,
      appointmentSettings: {
        ...config.appointmentSettings,
        availableDays: updated,
      },
    });
  };

  if (isLoading || !config) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500">
          <Bot className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-sm font-medium">Loading Business Configuration...</span>
        </div>
      </div>
    );
  }

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Business Profile & WhatsApp Assistant Setup</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure your business identity, welcome greeting, main menu options, and appointment booking rules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={loadConfig}
          >
            Reset
          </Button>
          <Button
            variant="whatsapp"
            size="sm"
            icon={<Save className="w-4 h-4" />}
            isLoading={isSaving}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Configuration Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Business Identity & Type */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-emerald-700 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              1. Business Identity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={config.businessName}
                  onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                  placeholder="e.g. Apex Digital Solutions"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency Symbol / Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={config.currency}
                  onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                  placeholder="₹ or $ or EUR"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagline / Subheading
              </label>
              <input
                type="text"
                value={config.tagline}
                onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                placeholder="e.g. Premium web engineering, cloud infrastructure & enterprise consulting"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Business Nature / Offering Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    type: 'Services',
                    title: 'Services Only',
                    desc: 'Agencies, clinics, salons, consultancy',
                    icon: <Briefcase className="w-4 h-4 text-emerald-600" />,
                  },
                  {
                    type: 'Products',
                    title: 'Products Only',
                    desc: 'Hardware, retail goods, materials',
                    icon: <ShoppingBag className="w-4 h-4 text-blue-600" />,
                  },
                  {
                    type: 'Hybrid',
                    title: 'Hybrid (Both)',
                    desc: 'Products, services, packages & plans',
                    icon: <Layers className="w-4 h-4 text-purple-600" />,
                  },
                ].map((item) => {
                  const isSelected = config.businessType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setConfig({ ...config, businessType: item.type as any })}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="p-1.5 rounded-lg bg-white shadow-xs border border-slate-200">
                          {item.icon}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                      </div>
                      <p className="text-xs font-bold text-slate-800">{item.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Welcome Message & Interactive Options */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-emerald-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              2. Welcome Greeting & Interactive Menu
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Greeting Message (Shown when customer sends "Hi", "Hello", "Hey", "Start")
              </label>
              <textarea
                rows={3}
                value={config.welcomeMessage}
                onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tip: You can use <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700">[Business Name]</code> to automatically insert your business name.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  Interactive Menu Options (Buttons / List Choices)
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddOption(!showAddOption)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Option
                </button>
              </div>

              {showAddOption && (
                <div className="p-3.5 mb-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
                  <p className="text-xs font-bold text-emerald-950">Add Custom Menu Option</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Option Label (e.g. Pricing Packages)"
                      value={newOptionLabel}
                      onChange={(e) => setNewOptionLabel(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <select
                      value={newOptionAction}
                      onChange={(e) => setNewOptionAction(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="services">Our Services Flow</option>
                      <option value="catalog">View Catalog Flow</option>
                      <option value="book_appointment">Book Appointment Flow</option>
                      <option value="enquiry">General Enquiry</option>
                      <option value="track_booking">Track Booking / Order</option>
                      <option value="agent">Talk to an Agent</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowAddOption(false)}>
                      Cancel
                    </Button>
                    <Button variant="whatsapp" size="sm" onClick={handleAddMenuOption}>
                      Add to Menu
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {config.menuOptions.map((opt, idx) => (
                  <div
                    key={opt.id || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={opt.enabled}
                        onChange={() => handleToggleMenuOption(idx)}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                        <span className="ml-2 text-[10px] text-slate-400 font-mono">
                          action: {opt.action}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={opt.enabled ? 'whatsapp' : 'neutral'} size="sm">
                        {opt.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => handleRemoveMenuOption(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="Delete option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Appointment Booking Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                3. Appointment Booking Rules
              </h3>

              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-semibold text-slate-600">Enable Scheduling</span>
                <input
                  type="checkbox"
                  checked={config.appointmentSettings.enabled}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      appointmentSettings: {
                        ...config.appointmentSettings,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </label>
            </div>

            {config.appointmentSettings.enabled && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Slot Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      value={config.appointmentSettings.slotDurationMinutes}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          appointmentSettings: {
                            ...config.appointmentSettings,
                            slotDurationMinutes: Number(e.target.value) || 30,
                          },
                        })
                      }
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Operating Hours
                    </label>
                    <input
                      type="text"
                      value={config.appointmentSettings.availableHours}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          appointmentSettings: {
                            ...config.appointmentSettings,
                            availableHours: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. 09:30 AM - 06:30 PM"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Advance Booking (Days)
                    </label>
                    <input
                      type="number"
                      value={config.appointmentSettings.advanceBookingDays}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          appointmentSettings: {
                            ...config.appointmentSettings,
                            advanceBookingDays: Number(e.target.value) || 14,
                          },
                        })
                      }
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Working Days for Appointments
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allDays.map((day) => {
                      const isAvailable = config.appointmentSettings.availableDays?.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleToggleDay(day)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                            isAvailable
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Contact & Support Information */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-emerald-700 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              4. Contact & Support Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Support Phone
                </label>
                <input
                  type="text"
                  value={config.contactInfo.phone}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      contactInfo: { ...config.contactInfo, phone: e.target.value },
                    })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={config.contactInfo.email}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      contactInfo: { ...config.contactInfo, email: e.target.value },
                    })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Office Address
                </label>
                <input
                  type="text"
                  value={config.contactInfo.address}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      contactInfo: { ...config.contactInfo, address: e.target.value },
                    })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Support Hours
                </label>
                <input
                  type="text"
                  value={config.contactInfo.supportHours}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      contactInfo: { ...config.contactInfo, supportHours: e.target.value },
                    })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live WhatsApp Preview */}
        <div className="space-y-4">
          <div className="sticky top-20">
            <div className="bg-slate-900 rounded-3xl p-3 shadow-xl border border-slate-700 text-white">
              {/* Phone Header */}
              <div className="bg-[#075E54] rounded-2xl p-3.5 flex items-center justify-between mb-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs text-white">
                    {config.businessName.charAt(0) || 'B'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight truncate max-w-[150px]">
                      {config.businessName || 'Business Name'}
                    </h4>
                    <p className="text-[10px] text-emerald-200">WhatsApp Official Business</p>
                  </div>
                </div>
                <Badge variant="whatsapp" size="sm">Verified</Badge>
              </div>

              {/* Chat Canvas Preview */}
              <div className="bg-[#0b141a] rounded-2xl p-3.5 min-h-[360px] space-y-3 font-sans">
                {/* Simulated Customer Inbound */}
                <div className="flex justify-end">
                  <div className="bg-[#005c4b] text-white text-xs px-3 py-1.5 rounded-2xl rounded-tr-none shadow-xs">
                    Hi
                  </div>
                </div>

                {/* Simulated Bot Welcome Reply */}
                <div className="flex justify-start">
                  <div className="bg-[#202c33] text-slate-100 text-xs p-3 rounded-2xl rounded-tl-none space-y-2.5 shadow-sm max-w-[90%] border border-slate-700/60">
                    <p className="whitespace-pre-line leading-relaxed">
                      {(
                        config.welcomeMessage ||
                        'Hello! 👋 Welcome to [Business Name].\n\nHow can we help you today?'
                      ).replace(/\[Business Name\]/gi, config.businessName || 'Our Business')}
                    </p>

                    <div className="border-t border-slate-700/80 pt-2 space-y-1.5">
                      <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                        Quick Reply Options:
                      </p>
                      {config.menuOptions
                        .filter((o) => o.enabled)
                        .map((opt, i) => (
                          <div
                            key={i}
                            className="bg-[#2a3942] hover:bg-[#32444f] text-[#00a884] font-semibold text-xs py-1.5 px-2.5 rounded-lg text-center border border-slate-700/50 cursor-pointer shadow-2xs"
                          >
                            {opt.label}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2 text-center">
                <span className="text-[10px] text-slate-400">
                  📱 Live preview of customer greeting experience
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
