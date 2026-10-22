import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Bot,
  Zap,
  HelpCircle,
  FileText,
  Megaphone,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Building2,
  Package,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

export type NavTab =
  | 'dashboard'
  | 'business'
  | 'catalog'
  | 'bookings'
  | 'chats'
  | 'contacts'
  | 'builder'
  | 'replies'
  | 'faqs'
  | 'templates'
  | 'campaigns'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSimulator: () => void;
  unreadTotal?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSimulator,
  unreadTotal = 3,
}) => {
  const { user, logout, switchRole } = useAuth();

  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'business', label: 'Business Profile', icon: <Building2 className="w-5 h-5" /> },
    { id: 'catalog', label: 'Products & Services', icon: <Package className="w-5 h-5" /> },
    { id: 'bookings', label: 'Bookings & Orders', icon: <Calendar className="w-5 h-5" /> },
    {
      id: 'chats',
      label: 'Live Chats',
      icon: <MessageSquare className="w-5 h-5" />,
      badge: unreadTotal > 0 ? unreadTotal : undefined,
    },
    { id: 'contacts', label: 'Contacts', icon: <Users className="w-5 h-5" /> },
    { id: 'builder', label: 'Chatbot Builder', icon: <Bot className="w-5 h-5" /> },
    { id: 'replies', label: 'Automated Replies', icon: <Zap className="w-5 h-5" /> },
    { id: 'faqs', label: 'FAQ Management', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'templates', label: 'Message Templates', icon: <FileText className="w-5 h-5" /> },
    { id: 'campaigns', label: 'Campaigns', icon: <Megaphone className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settings', label: 'WhatsApp API Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Logo & Name */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#075E54] to-[#25D366] flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <MessageSquare className="w-5 h-5 fill-white text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">WhatBot</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">WhatsApp Business Platform</p>
          </div>
        </div>
      </div>

      {/* Simulator Shortcut CTA Banner */}
      <div className="p-3 mx-3 my-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-emerald-950">Bot Simulator</span>
          </div>
          <button
            onClick={onOpenSimulator}
            className="text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg transition-colors shadow-xs"
          >
            Test Bot
          </button>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#128C7E]/10 text-[#075E54] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-[#128C7E]' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500 text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile & Role Switcher */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500">Active Role:</span>
            <button
              onClick={() => switchRole(user?.role === 'admin' ? 'agent' : 'admin')}
              className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200"
            >
              {user?.role === 'admin' ? <ShieldCheck className="w-3 h-3 text-emerald-600" /> : <UserCheck className="w-3 h-3 text-blue-600" />}
              {user?.role === 'admin' ? 'Admin' : 'Agent'} (Switch)
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@whatbot.io'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
