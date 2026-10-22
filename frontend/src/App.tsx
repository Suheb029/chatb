import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { LiveChatPage } from './pages/LiveChatPage';
import { ContactsPage } from './pages/ContactsPage';
import { BotBuilderPage } from './pages/BotBuilderPage';
import { AutoRepliesPage } from './pages/AutoRepliesPage';
import { FaqPage } from './pages/FaqPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { BusinessProfilePage } from './pages/BusinessProfilePage';
import { CatalogServicesPage } from './pages/CatalogServicesPage';
import { BookingsOrdersPage } from './pages/BookingsOrdersPage';
import { ChatSimulatorModal } from './components/simulator/ChatSimulatorModal';
import { Button } from './components/common/Button';
import { MessageSquare, ShieldCheck, UserCheck } from 'lucide-react';

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { user, isAuthenticated, demoLogin } = useAuth();

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const getPageInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return { title: 'Dashboard Overview', subtitle: 'WhatsApp Business conversation metrics & automation throughput' };
      case 'business':
        return { title: 'Business Profile & Assistant Setup', subtitle: 'Configure business identity, welcome greeting, interactive menu, and appointment slots' };
      case 'catalog':
        return { title: 'Products & Services Catalog', subtitle: 'Manage offerings, custom follow-up questions, and fulfillment requirements' };
      case 'bookings':
        return { title: 'Bookings & Product Orders', subtitle: 'Real-time customer requests, scheduling slots, and order fulfilment' };
      case 'chats':
        return { title: 'Live Chat Inbox', subtitle: 'Manage customer support chats, handoff routing, and responses' };
      case 'contacts':
        return { title: 'Contacts Management', subtitle: 'Directory of registered WhatsApp customer profiles and tags' };
      case 'builder':
        return { title: 'Chatbot Builder', subtitle: 'Visual workflow rules, business hours, and automated handoffs' };
      case 'replies':
        return { title: 'Automated Replies', subtitle: 'Configure keyword trigger rules and match conditions' };
      case 'faqs':
        return { title: 'FAQ Management', subtitle: 'Automated knowledge base answers for common questions' };
      case 'templates':
        return { title: 'Message Templates', subtitle: 'Approved WhatsApp HSM broadcast templates with variables' };
      case 'campaigns':
        return { title: 'Broadcast Campaigns', subtitle: 'Send targeted WhatsApp updates to tagged audience lists' };
      case 'analytics':
        return { title: 'Analytics & Reports', subtitle: 'Response times, resolution rates, and traffic intelligence' };
      case 'settings':
        return { title: 'WhatsApp API Settings', subtitle: 'Meta Graph API credentials, webhook verification, and mode' };
      default:
        return { title: 'WhatBot Platform', subtitle: 'WhatsApp Business Dashboard' };
    }
  };

  const pageInfo = getPageInfo();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-modal text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#075E54] to-[#25D366] flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/20">
            <MessageSquare className="w-8 h-8 fill-white" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">WhatBot Platform</h2>
            <p className="text-xs text-slate-500 mt-1">
              WhatsApp Business Chatbot Integration & Management Dashboard
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              variant="whatsapp"
              size="lg"
              className="w-full"
              icon={<ShieldCheck className="w-5 h-5" />}
              onClick={() => demoLogin('admin')}
            >
              Sign In as Demo Admin
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              icon={<UserCheck className="w-5 h-5" />}
              onClick={() => demoLogin('agent')}
            >
              Sign In as Demo Agent
            </Button>
          </div>

          <p className="text-[11px] text-slate-400">
            Demo Mode Sandbox • No password or Meta credentials required
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          onRefresh={handleRefresh}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage onNavigateToChats={() => setCurrentTab('chats')} key={refreshKey} />
          )}
          {currentTab === 'business' && <BusinessProfilePage key={refreshKey} />}
          {currentTab === 'catalog' && <CatalogServicesPage key={refreshKey} />}
          {currentTab === 'bookings' && <BookingsOrdersPage key={refreshKey} />}
          {currentTab === 'chats' && <LiveChatPage key={refreshKey} />}
          {currentTab === 'contacts' && <ContactsPage key={refreshKey} onStartChat={() => setCurrentTab('chats')} />}
          {currentTab === 'builder' && (
            <BotBuilderPage onOpenSimulator={() => setIsSimulatorOpen(true)} key={refreshKey} />
          )}
          {currentTab === 'replies' && <AutoRepliesPage key={refreshKey} />}
          {currentTab === 'faqs' && <FaqPage key={refreshKey} />}
          {currentTab === 'templates' && <TemplatesPage key={refreshKey} />}
          {currentTab === 'campaigns' && <CampaignsPage key={refreshKey} />}
          {currentTab === 'analytics' && <AnalyticsPage key={refreshKey} />}
          {currentTab === 'settings' && <SettingsPage key={refreshKey} />}
        </main>
      </div>

      {/* Floating / Global WhatsApp Simulator Modal */}
      <ChatSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainLayout />
      </ToastProvider>
    </AuthProvider>
  );
}
