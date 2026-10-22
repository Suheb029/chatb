import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Zap,
  Bot,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Megaphone,
  Radio,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../lib/api';
import { DashboardOverview } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const DashboardPage: React.FC<{ onNavigateToChats: () => void }> = ({ onNavigateToChats }) => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.dashboard.getOverview();
      setData(res);
    } catch (e) {
      console.error('Failed to load dashboard stats', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200/70 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-slate-200/70 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const { stats, charts, recentActivity } = data;

  const statCards = [
    {
      title: 'Total Conversations',
      value: stats.totalConversations,
      change: '+14% this week',
      icon: <MessageSquare className="w-5 h-5 text-emerald-600" />,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'Messages Received',
      value: stats.messagesReceived,
      change: 'Incoming customer chats',
      icon: <ArrowDownLeft className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Messages Sent',
      value: stats.messagesSent,
      change: 'Outgoing replies & HSMs',
      icon: <ArrowUpRight className="w-5 h-5 text-teal-600" />,
      color: 'bg-teal-50 text-teal-700',
    },
    {
      title: 'Active Contacts',
      value: stats.activeContacts,
      change: 'Registered WhatsApp leads',
      icon: <Users className="w-5 h-5 text-indigo-600" />,
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      title: 'Automated Replies',
      value: stats.automatedReplies,
      change: 'Triggered by bot rules',
      icon: <Zap className="w-5 h-5 text-amber-600" />,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Bot Response Rate',
      value: `${stats.chatbotResponseRate}%`,
      change: `${stats.avgResponseTime} avg response`,
      icon: <Bot className="w-5 h-5 text-emerald-600" />,
      color: 'bg-emerald-50 text-emerald-700',
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Demo Mode Notice Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">WhatsApp Cloud API Demo Environment Active</h4>
              <Badge variant="whatsapp">Sandbox Active</Badge>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              All incoming and outgoing conversations are simulated locally without requiring Meta API credentials. You can trigger automated replies, test keyword rules, or connect your real Meta credentials anytime in WhatsApp API Settings.
            </p>
          </div>
        </div>
        <button
          onClick={onNavigateToChats}
          className="text-xs font-bold text-[#128C7E] hover:text-[#075E54] bg-white border border-emerald-200 px-3.5 py-2 rounded-xl shadow-xs transition-colors shrink-0"
        >
          Open Live Chats →
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="p-5 flex flex-col justify-between hover" hover>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">{card.title}</span>
              <div className={`p-2 rounded-xl ${card.color}`}>{card.icon}</div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{card.value}</h3>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">{card.change}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section: Daily Traffic & Automated vs Human Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Volume Area Chart (2 cols) */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Daily Message Volume & Automation</h3>
              <p className="text-xs text-slate-500">Breakdown of customer queries, automated bot replies, and agent responses</p>
            </div>
            <Badge variant="whatsapp">Past 7 Days</Badge>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.dailyVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAutomated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25D366" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#25D366" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="automated"
                  name="Bot Automated"
                  stroke="#25D366"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorAutomated)"
                />
                <Area
                  type="monotone"
                  dataKey="incoming"
                  name="Incoming Customer"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncoming)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Reply Breakdown Pie Chart (1 col) */}
        <Card className="p-6 flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-base font-bold text-slate-900">Bot vs Human Handling</h3>
            <p className="text-xs text-slate-500">Distribution of customer resolutions</p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.replyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.replyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-2xl font-extrabold text-slate-900">{stats.chatbotResponseRate}%</span>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Automated</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#25D366]" />
                <span className="text-slate-600">Chatbot Automated</span>
              </div>
              <span className="font-bold text-slate-900">519 replies</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#128C7E]" />
                <span className="text-slate-600">Human Agent Handled</span>
              </div>
              <span className="font-bold text-slate-900">148 replies</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Two Column Layout: Conversation Categories & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Top Query Categories</h3>
            <Badge variant="neutral">Auto-classified</Badge>
          </div>

          <div className="space-y-4">
            {charts.categories.map((cat, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">{cat.name}</span>
                  <span className="text-slate-900">{cat.count} inquiries ({cat.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Real-time Activity Feed */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Recent Bot & Live Activity</h3>
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Stream
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivity.map((act) => (
              <div key={act.id} className="py-3 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-100 mt-0.5 shrink-0">
                  {act.type === 'bot' && <Zap className="w-4 h-4 text-emerald-600" />}
                  {act.type === 'agent' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  {act.type === 'faq' && <HelpCircle className="w-4 h-4 text-amber-600" />}
                  {act.type === 'campaign' && <Megaphone className="w-4 h-4 text-teal-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{act.title}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{act.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
