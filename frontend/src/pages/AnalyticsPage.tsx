import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  Zap,
  Bot,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const AnalyticsPage: React.FC = () => {
  // Realistic hourly traffic distribution
  const hourlyData = [
    { hour: '00:00', messages: 12 },
    { hour: '02:00', messages: 8 },
    { hour: '04:00', messages: 5 },
    { hour: '06:00', messages: 18 },
    { hour: '08:00', messages: 64 },
    { hour: '10:00', messages: 142 },
    { hour: '12:00', messages: 186 },
    { hour: '14:00', messages: 198 },
    { hour: '16:00', messages: 165 },
    { hour: '18:00', messages: 110 },
    { hour: '20:00', messages: 72 },
    { hour: '22:00', messages: 34 },
  ];

  // Weekly resolution rates
  const weeklyResolution = [
    { week: 'Week 1', botResolved: 82, humanResolved: 18 },
    { week: 'Week 2', botResolved: 85, humanResolved: 15 },
    { week: 'Week 3', botResolved: 89, humanResolved: 11 },
    { week: 'Week 4', botResolved: 92, humanResolved: 8 },
  ];

  const topRules = [
    { rank: 1, name: 'Pricing & Plans', category: 'Sales', hits: 142, rate: '96% resolution' },
    { rank: 2, name: 'Order Tracking & Shipping', category: 'Orders', hits: 118, rate: '91% resolution' },
    { rank: 3, name: 'Business Hours & Location', category: 'General', hits: 89, rate: '99% resolution' },
    { rank: 4, name: 'Discount Promo Code', category: 'Sales', hits: 75, rate: '88% resolution' },
    { rank: 5, name: 'Human Agent Handoff', category: 'Support', hits: 64, rate: '100% handoff' },
  ];

  const agents = [
    { name: 'WhatBot (Automated)', chats: 519, avgTime: '1.2s', csat: '4.9 / 5.0', type: 'bot' },
    { name: 'Sarah Connor', chats: 84, avgTime: '2.4m', csat: '4.8 / 5.0', type: 'human' },
    { name: 'Alex Rivera', chats: 64, avgTime: '1.9m', csat: '4.9 / 5.0', type: 'human' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Analytics & Intelligence</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time metrics on customer satisfaction, bot resolution efficiency, and peak WhatsApp traffic hours
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Average First Response</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900">1.4 seconds</h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">94% handled in under 2s</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Bot Resolution Rate</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900">84.5%</h3>
          <p className="text-[11px] text-teal-600 font-semibold mt-1">Queries closed without human</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Peak Hour Load</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900">2:00 PM EST</h3>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">198 inquiries / hour</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Customer CSAT</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900">4.9 / 5.0</h3>
          <p className="text-[11px] text-amber-700 font-semibold mt-1">Based on post-chat feedback</p>
        </Card>
      </div>

      {/* Charts: Hourly Distribution & Resolution Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">24-Hour WhatsApp Traffic Volume</h3>
              <p className="text-xs text-slate-500">Customer message distribution throughout the day</p>
            </div>
            <Badge variant="whatsapp">Peak: 12pm - 4pm</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="hour" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="messages" fill="#25D366" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Bot vs Human Resolution Trend</h3>
              <p className="text-xs text-slate-500">Percentage of tickets resolved autonomously over time</p>
            </div>
            <Badge variant="neutral">Monthly Progression</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyResolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="week" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="botResolved"
                  name="Bot Resolved (%)"
                  stroke="#25D366"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="humanResolved"
                  name="Human Resolved (%)"
                  stroke="#128C7E"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Leaderboards: Top Triggered Rules & Agent Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Rules Leaderboard */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Top Performing Bot Rules</h3>
            <span className="text-xs text-slate-400 font-medium">By Trigger Volume</span>
          </div>

          <div className="space-y-3">
            {topRules.map((rule) => (
              <div
                key={rule.rank}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                    #{rule.rank}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900">{rule.name}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{rule.category}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-slate-900 block">{rule.hits} triggers</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">{rule.rate}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Agent Performance Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Agent & Bot Efficiency</h3>
            <Badge variant="whatsapp">Live Multi-Agent Team</Badge>
          </div>

          <div className="space-y-3">
            {agents.map((ag, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      ag.type === 'bot'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {ag.type === 'bot' ? <Bot className="w-4 h-4" /> : ag.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{ag.name}</h4>
                    <span className="text-[10px] text-slate-400">Response time: {ag.avgTime}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-slate-900 block">{ag.chats} chats</span>
                  <span className="text-[10px] text-amber-700 font-semibold">★ {ag.csat}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
