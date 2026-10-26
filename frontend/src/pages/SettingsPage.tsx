import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Key,
  Globe,
  Radio,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Save,
  Activity,
  HelpCircle,
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronUp,
  QrCode,
  Smartphone,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { api } from '../lib/api';
import { ApiSettings } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<ApiSettings | null>(null);
  const [formData, setFormData] = useState({
    mode: 'demo' as 'demo' | 'live' | 'qr',
    wabaId: '',
    phoneNumberId: '',
    accessToken: '',
    webhookVerifyToken: '',
    webhookCallbackUrl: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showMetaGuide, setShowMetaGuide] = useState(false);
  const [qrData, setQrData] = useState<{
    isConnected: boolean;
    user?: { id: string; name?: string } | null;
    qrRaw: string | null;
    qrDataUrl: string | null;
  } | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [isLoggingOutQr, setIsLoggingOutQr] = useState(false);

  const { success, error, info } = useToast();


  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const res = await api.settings.getSettings();
      if (res.data) {
        setSettings(res.data);
        setFormData({
          mode: res.data.mode || 'demo',
          wabaId: res.data.wabaId || '',
          phoneNumberId: res.data.phoneNumberId || '',
          accessToken: '', // Never populate token in clear text
          webhookVerifyToken: res.data.webhookVerifyToken || 'whatbot_secure_token',
          webhookCallbackUrl: res.data.webhookCallbackUrl || window.location.origin + '/api/webhooks/whatsapp',
        });
      }
    } catch (e: any) {
      error('Failed to load settings', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (formData.mode === 'qr') {
      fetchQR();
      interval = setInterval(fetchQR, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [formData.mode]);

  const fetchQR = async () => {
    try {
      setIsLoadingQr(true);
      const res = await api.settings.getQR();
      if (res.data) {
        setQrData(res.data);
      }
    } catch (e) {
      // silent polling error
    } finally {
      setIsLoadingQr(false);
    }
  };

  const handleLogoutQR = async () => {
    try {
      setIsLoggingOutQr(true);
      await api.settings.logoutQR();
      success('WhatsApp Web Logged Out', 'Generating a new QR code...');
      await fetchQR();
      loadSettings();
    } catch (err: any) {
      error('Logout failed', err.message);
    } finally {
      setIsLoggingOutQr(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.settings.updateSettings(formData);
      success('Configuration Saved', 'API settings and provider configuration saved securely.');
      loadSettings();
      if (formData.mode === 'qr') {
        fetchQR();
      }
    } catch (err: any) {
      error('Save failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      info('Testing connection...', 'Pinging provider endpoint.');

      const res = await api.settings.testConnection();
      setTestResult(res.data);

      if (res.data.connected) {
        success('Connection Verified', res.data.message);
      } else {
        error('Connection Test Failed', res.data.message);
      }
      loadSettings();
    } catch (err: any) {
      error('Connection error', err.message);
    } finally {

      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    success('Copied to Clipboard', `${label} copied.`);
  };

  if (isLoading || !settings) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="h-80 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">WhatsApp Business API Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure Meta Cloud API credentials, Webhook callbacks, and switch between Demo Sandbox and Live production
        </p>
      </div>

      {/* Mode & Health Status Banner */}
      <Card className="p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                settings.mode === 'live'
                  ? 'bg-[#128C7E]'
                  : settings.mode === 'qr'
                  ? 'bg-emerald-600'
                  : 'bg-[#25D366]'
              }`}
            >
              {settings.mode === 'live' ? (
                <Globe className="w-6 h-6" />
              ) : settings.mode === 'qr' ? (
                <QrCode className="w-6 h-6" />
              ) : (
                <Radio className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {settings.providerStatus.name}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    settings.isConnected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {settings.isConnected ? 'Connected & Verified' : 'Awaiting Connection'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                {settings.providerStatus.description}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            isLoading={isTesting}
            icon={<Activity className="w-4 h-4" />}
            onClick={handleTestConnection}
          >
            Test Connection
          </Button>
        </div>

        {/* Live Test Results Card */}
        {testResult && (
          <div
            className={`mt-4 p-4 rounded-xl border text-xs shadow-xs animate-slide-up flex items-start gap-3 ${
              testResult.connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            {testResult.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-1">
              <h4 className="font-bold text-sm">
                {testResult.connected ? 'Connection Success' : 'Connection Failed'}
              </h4>
              <p className="text-xs">{testResult.message}</p>
              {testResult.details && (
                <div className="mt-2 text-[11px] font-mono bg-white/80 p-2.5 rounded-lg border border-slate-200 space-y-0.5">
                  {Object.entries(testResult.details).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="font-semibold text-slate-500">{k}:</span>
                      <span className="text-slate-900">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Main Settings Form */}
      <Card className="p-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Integration Mode
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: WhatsApp Web QR Scan */}
              <label
                className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                  formData.mode === 'qr'
                    ? 'border-[#25D366] bg-emerald-50/40 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="qr"
                  checked={formData.mode === 'qr'}
                  onChange={() => setFormData({ ...formData, mode: 'qr' })}
                  className="mt-1 accent-[#25D366]"
                />
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900">WhatsApp Web QR</h4>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                      Skip Meta
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Scan QR code with your phone (Linked Devices). 100% free, zero Meta setup!
                  </p>
                </div>
              </label>

              {/* Option 2: Demo Sandbox */}
              <label
                className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                  formData.mode === 'demo'
                    ? 'border-[#25D366] bg-emerald-50/30 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="demo"
                  checked={formData.mode === 'demo'}
                  onChange={() => setFormData({ ...formData, mode: 'demo' })}
                  className="mt-1 accent-[#25D366]"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900">Demo Sandbox</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Simulate sending/receiving WhatsApp messages locally in the web simulator.
                  </p>
                </div>
              </label>

              {/* Option 3: Live Meta Cloud API */}
              <label
                className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                  formData.mode === 'live'
                    ? 'border-[#128C7E] bg-teal-50/30 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="live"
                  checked={formData.mode === 'live'}
                  onChange={() => setFormData({ ...formData, mode: 'live' })}
                  className="mt-1 accent-[#128C7E]"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-teal-700" />
                    <h4 className="text-sm font-bold text-slate-900">Meta Cloud API</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Connects directly to Meta Graph API v20.0 endpoints with permanent token.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Conditional Mode UI: QR Pairing View */}
          {formData.mode === 'qr' && (
            <div className="pt-4 border-t border-slate-100 space-y-4 animate-slide-up">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Left: QR Code Display Frame */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-56 h-56 bg-white rounded-2xl p-3 shadow-2xl flex items-center justify-center border-4 border-emerald-500/40 relative">
                      {qrData?.isConnected ? (
                        <div className="flex flex-col items-center justify-center text-center p-4">
                          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-inner">
                            <CheckCircle2 className="w-10 h-10" />
                          </div>
                          <p className="font-bold text-slate-900 text-sm">Device Linked!</p>
                          <p className="text-xs text-emerald-700 font-mono mt-1 font-semibold">
                            {qrData.user?.id || 'Connected'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {qrData.user?.name || 'WhatsApp Account'}
                          </p>
                        </div>
                      ) : qrData?.qrDataUrl ? (
                        <img
                          src={qrData.qrDataUrl}
                          alt="WhatsApp Web QR Code"
                          className="w-full h-full object-contain rounded-lg select-none"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4">
                          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                          <p className="text-xs text-slate-600 font-medium">Generating QR Code...</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-300 hover:text-white"
                        icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingQr ? 'animate-spin' : ''}`} />}
                        onClick={fetchQR}
                      >
                        Refresh Code
                      </Button>

                      {qrData?.isConnected && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          isLoading={isLoggingOutQr}
                          icon={<LogOut className="w-3.5 h-3.5" />}
                          onClick={handleLogoutQR}
                        >
                          Unlink Phone
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Right: Instructions & Status */}
                  <div className="space-y-4 text-left flex-1">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-base font-bold text-white">
                        {qrData?.isConnected
                          ? '🎉 WhatsApp Agent is Live & Listening!'
                          : 'Pair Your Phone with WhatsApp Web'}
                      </h3>
                    </div>

                    {qrData?.isConnected ? (
                      <div className="space-y-3 text-xs text-slate-300">
                        <div className="bg-emerald-900/40 border border-emerald-500/30 p-3.5 rounded-xl text-emerald-200">
                          ✅ Connected as <strong className="text-white font-mono">{qrData.user?.id}</strong> ({qrData.user?.name || 'WhatsApp Account'}).
                        </div>
                        <p className="leading-relaxed">
                          Your WhatBot agent is active! Send a WhatsApp message from any other phone to this number (try typing <code className="text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">Hi</code>, <code className="text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">Menu</code>, or <code className="text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">Catalog</code>) to test instant bot replies!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 text-xs text-slate-300">
                        <p className="text-slate-400">
                          Follow these quick steps on your phone to connect without any Meta developer account:
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                              1
                            </span>
                            <span>Open <strong>WhatsApp</strong> on your mobile phone.</span>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                              2
                            </span>
                            <span>
                              Tap <strong>Settings</strong> (iPhone) or <strong>Three dots ⋮</strong> (Android) → <strong>Linked Devices</strong>.
                            </span>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                              3
                            </span>
                            <span>
                              Tap <strong>Link a Device</strong> and point your camera at the QR code on the left!
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-emerald-400/80 pt-2 border-t border-slate-800">
                          💡 Note: The QR code is also printed in your backend terminal for quick scanning.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conditional Mode UI: Live Meta Cloud API Fields */}
          {formData.mode === 'live' && (
            <div className="space-y-6 animate-slide-up">
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp Business Account ID (WABA ID)
                  </label>
                  <input
                    type="text"
                    value={formData.wabaId}
                    onChange={(e) => setFormData({ ...formData, wabaId: e.target.value })}
                    placeholder="e.g. 109283746509182"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Found in Meta Business Manager → WhatsApp Accounts.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={formData.phoneNumberId}
                    onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                    placeholder="e.g. 108472918374652"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Found in Meta App Dashboard → WhatsApp → API Setup.
                  </span>
                </div>
              </div>

              {/* Access Token (Masked for Security) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Permanent System User Access Token
                  </label>
                  {settings.hasAccessToken && (
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Token stored securely: {settings.accessTokenMasked}
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  value={formData.accessToken}
                  onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                  placeholder={
                    settings.hasAccessToken
                      ? '•••••••••••••••••••••••••••••••• (Leave blank to keep current token)'
                      : 'Paste EAAG... permanent token here'
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <p className="text-[10px] text-slate-400">
                  Security note: Tokens are never logged or exposed in frontend responses. They are stored securely on the backend server.
                </p>
              </div>

              {/* Webhooks Section */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Webhook Verification & Callback URL
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Webhook Callback URL (Paste into Meta Dashboard)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={formData.webhookCallbackUrl}
                      className="flex-1 text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-mono select-all"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Copy className="w-3.5 h-3.5" />}
                      onClick={() => copyToClipboard(formData.webhookCallbackUrl, 'Webhook URL')}
                    >
                      Copy URL
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Webhook Verify Token
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.webhookVerifyToken}
                      onChange={(e) => setFormData({ ...formData, webhookVerifyToken: e.target.value })}
                      placeholder="e.g. whatbot_secure_token"
                      className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Copy className="w-3.5 h-3.5" />}
                      onClick={() => copyToClipboard(formData.webhookVerifyToken, 'Verify Token')}
                    >
                      Copy Token
                    </Button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Must match the verify token entered when configuring your Webhook subscription in Meta Developers portal.
                  </span>
                </div>
              </div>
            </div>
          )}


          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="submit"
              variant="whatsapp"
              isLoading={isSaving}
              icon={<Save className="w-4 h-4" />}
            >
              Save API Configuration
            </Button>
          </div>
        </form>
      </Card>

      {/* Accordion: Step-by-Step Meta WhatsApp Cloud API Setup Guide */}
      <Card className="p-0 overflow-hidden shadow-card">
        <div
          onClick={() => setShowMetaGuide(!showMetaGuide)}
          className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Official Meta Cloud API Connection Walkthrough (Future Production)
              </h3>
              <p className="text-xs text-slate-500">
                Four simple steps to connect your real WhatsApp Business number with WhatBot
              </p>
            </div>
          </div>
          {showMetaGuide ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {showMetaGuide && (
          <div className="p-6 space-y-4 text-xs text-slate-700 divide-y divide-slate-100">
            <div className="pt-2 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <h4 className="font-bold text-slate-900">Create a Meta Developer App</h4>
                <p className="text-slate-500 mt-0.5">
                  Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">developers.facebook.com</a> → <strong>My Apps</strong> → <strong>Create App</strong>. Select <strong>"Other"</strong> and choose the <strong>"Business"</strong> app type.
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <h4 className="font-bold text-slate-900">Add WhatsApp Product & Copy IDs</h4>
                <p className="text-slate-500 mt-0.5">
                  Under "Add products to your app", click <strong>Set Up WhatsApp</strong>. In the <strong>API Setup</strong> tab, you will find your temporary test number, <strong>Phone Number ID</strong>, and <strong>WhatsApp Business Account ID</strong>. Copy them into the settings form above.
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <h4 className="font-bold text-slate-900">Generate Permanent System User Token</h4>
                <p className="text-slate-500 mt-0.5">
                  In Meta Business Manager (<a href="https://business.facebook.com/settings" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">business.facebook.com/settings</a>), navigate to <strong>Users → System Users</strong>. Create a System User with Admin access and generate an access token with <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-emerald-800">whatsapp_business_messaging</code> and <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-emerald-800">whatsapp_business_management</code> permissions.
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <div>
                <h4 className="font-bold text-slate-900">Configure Webhook Callbacks</h4>
                <p className="text-slate-500 mt-0.5">
                  In the Meta App Dashboard under <strong>WhatsApp → Configuration</strong>, click <strong>Edit Webhook</strong>. Paste your <strong>Callback URL</strong> and <strong>Verify Token</strong> from above. Click <strong>Verify and Save</strong>. Then click <strong>Manage Webhook fields</strong> and subscribe to <strong>messages</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
