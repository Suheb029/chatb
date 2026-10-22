import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Check,
  CheckCheck,
  Bot,
  User,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Tag,
  FileText,
  RotateCcw,
  PlusCircle,
  HelpCircle,
  Shield,
  Image as ImageIcon,
  FileUp,
} from 'lucide-react';
import { api } from '../lib/api';
import { Conversation, Message, Contact } from '../types';
import { formatTime, formatRelativeTime } from '../lib/utils';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';

export const LiveChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);
  const [customSimText, setCustomSimText] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { success, error, info } = useToast();

  useEffect(() => {
    loadConversations();
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    if (selectedConvId) {
      loadConversationDetails(selectedConvId);
    }
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const res = await api.conversations.getList({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      if (res.data) {
        setConversations(res.data);
        if (!selectedConvId && res.data.length > 0) {
          setSelectedConvId(res.data[0]._id);
        }
      }
    } catch (e: any) {
      console.error('Error fetching conversations:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationDetails = async (id: string) => {
    try {
      const res = await api.conversations.getById(id);
      if (res.data) {
        setActiveMessages(res.data.messages || []);
        setActiveContact(res.data.contact || null);
        setInternalNotes(res.data.conversation?.internalNotes || '');
      }
    } catch (e: any) {
      console.error('Error loading chat details:', e);
    }
  };

  const handleSendMessage = async (textToSend?: string, type: 'text' | 'image' | 'document' = 'text', mediaUrl?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() && !mediaUrl) return;

    try {
      setIsSending(true);
      const res = await api.conversations.sendMessage(selectedConvId, {
        text,
        messageType: type,
        mediaUrl,
      });

      if (res.data) {
        setActiveMessages((prev) => [...prev, res.data]);
        setInputMessage('');
        // Update last message in list
        setConversations((prev) =>
          prev.map((c) =>
            c._id === selectedConvId
              ? { ...c, lastMessageText: text, lastMessageTimestamp: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (e: any) {
      error('Failed to send message', e.message);
    } finally {
      setIsSending(false);
      setShowAttachments(false);
    }
  };

  const handleSimulateIncoming = async (text: string) => {
    try {
      setShowSimulateMenu(false);
      setCustomSimText('');
      info('Simulating customer message...', text);

      const res = await api.conversations.simulateIncoming(selectedConvId, text);
      if (res.data) {
        // Append customer message
        setActiveMessages((prev) => [...prev, res.data.customerMessage]);

        // If bot triggered a reply, add it after a short delay
        if (res.data.botReply) {
          setTimeout(() => {
            setActiveMessages((prev) => [...prev, res.data.botReply]);
            success('Chatbot Replied', `Matched: ${res.data.botDecision.matchedRuleName || res.data.botDecision.reason}`);
          }, 700);
        }

        // Refresh conversation list to update last message
        loadConversations();
      }
    } catch (e: any) {
      error('Simulation failed', e.message);
    }
  };

  const handleStatusChange = async (newStatus: 'open' | 'pending' | 'resolved') => {
    try {
      await api.conversations.updateStatus(selectedConvId, newStatus);
      setConversations((prev) =>
        prev.map((c) => (c._id === selectedConvId ? { ...c, status: newStatus } : c))
      );
      success('Status Updated', `Conversation marked as ${newStatus.toUpperCase()}`);
    } catch (e: any) {
      error('Update failed', e.message);
    }
  };

  const handleAgentChange = async (agentName: string) => {
    try {
      await api.conversations.assignAgent(selectedConvId, agentName);
      setConversations((prev) =>
        prev.map((c) => (c._id === selectedConvId ? { ...c, assignedAgent: agentName } : c))
      );
      success('Agent Assigned', `Assigned to ${agentName}`);
    } catch (e: any) {
      error('Assignment failed', e.message);
    }
  };

  const handleResumeBot = async () => {
    try {
      await api.conversations.resumeBot(selectedConvId);
      setConversations((prev) =>
        prev.map((c) =>
          c._id === selectedConvId ? { ...c, status: 'open', assignedAgent: 'Chatbot' } : c
        )
      );
      success('Chatbot Resumed', 'Automated chatbot replies are now active again for this conversation.');
      loadConversationDetails(selectedConvId);
    } catch (e: any) {
      error('Failed to resume bot', e.message);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await api.conversations.updateNotes(selectedConvId, internalNotes);
      success('Notes Saved', 'Internal notes updated successfully.');
    } catch (e: any) {
      error('Save failed', e.message);
    }
  };

  const selectedConv = conversations.find((c) => c._id === selectedConvId);

  return (
    <div className="flex h-[calc(100vh-73px)] overflow-hidden bg-slate-100">
      {/* COLUMN 1: Conversation List */}
      <div className="w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0">
        {/* Header Search & Filter */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Conversations</h2>
            <Badge variant="whatsapp">{conversations.length} total</Badge>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search chats, numbers, text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 rounded-xl text-xs text-slate-900 border-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {(['all', 'open', 'pending', 'resolved'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  statusFilter === tab
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No conversations found.
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = conv._id === selectedConvId;
              const contact = conv.contact || {
                name: 'Customer',
                phoneNumber: '+1555000000',
                avatar: '',
              };

              return (
                <div
                  key={conv._id}
                  onClick={() => setSelectedConvId(conv._id)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative ${
                    isSelected ? 'bg-emerald-50/80 border-r-4 border-[#25D366]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={contact.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${contact.name}`}
                      alt={contact.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        conv.status === 'open'
                          ? 'bg-emerald-500'
                          : conv.status === 'pending'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{contact.name}</h4>
                      <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                        {formatRelativeTime(conv.lastMessageTimestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 truncate mb-1">{conv.lastMessageText || 'No messages'}</p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          conv.status === 'open'
                            ? 'bg-emerald-100 text-emerald-800'
                            : conv.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {conv.status}
                      </span>

                      {conv.assignedAgent && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {conv.assignedAgent}
                        </span>
                      )}

                      {conv.unreadCount > 0 && (
                        <span className="ml-auto w-4 h-4 rounded-full bg-[#25D366] text-white text-[10px] font-bold flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* COLUMN 2: WhatsApp Chat Window */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {selectedConv ? (
          <>
            {/* Chat Top Navigation Bar */}
            <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-white z-10 shadow-xs">
              <div className="flex items-center gap-3">
                <img
                  src={
                    activeContact?.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${activeContact?.name || 'User'}`
                  }
                  alt={activeContact?.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{activeContact?.name}</h3>
                    <Badge variant="whatsapp" size="sm">WhatsApp Business</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{activeContact?.phoneNumber}</p>
                </div>
              </div>

              {/* Status and Agent Controls */}
              <div className="flex items-center gap-2.5">
                {/* Agent Assignment Selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={selectedConv.assignedAgent || 'Chatbot'}
                    onChange={(e) => handleAgentChange(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="Chatbot">🤖 Chatbot</option>
                    <option value="Sarah Connor">Sarah Connor (Admin)</option>
                    <option value="Alex Rivera">Alex Rivera (Agent)</option>
                  </select>
                </div>

                {/* Status Selector */}
                <select
                  value={selectedConv.status}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${
                    selectedConv.status === 'open'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : selectedConv.status === 'pending'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  <option value="open">🟢 Open</option>
                  <option value="pending">🟡 Pending</option>
                  <option value="resolved">⚪ Resolved</option>
                </select>

                {/* Simulate Customer Reply CTA Dropdown */}
                <div className="relative">
                  <Button
                    variant="whatsapp"
                    size="sm"
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                    onClick={() => setShowSimulateMenu(!showSimulateMenu)}
                  >
                    Simulate Customer
                  </Button>

                  {showSimulateMenu && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-modal border border-slate-200 p-3.5 z-50 animate-slide-up max-h-[460px] overflow-y-auto">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-900">Simulate Customer Inbound</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          Multi-Step Flows
                        </span>
                      </div>

                      <div className="space-y-3 mb-3 text-xs">
                        {/* Flow 1: Services & Booking */}
                        <div>
                          <p className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider mb-1">
                            Flow 1: Service Booking
                          </p>
                          <div className="grid grid-cols-2 gap-1">
                            {[
                              { label: '1. Send "Hi"', val: 'Hi' },
                              { label: '2. "Our Services"', val: 'Our Services' },
                              { label: '3. Website Dev', val: 'Website Development' },
                              { label: '4. Business site', val: 'Business website' },
                              { label: '5. Budget ₹20k', val: '₹20,000' },
                              { label: '6. Next week', val: 'Next week' },
                              { label: '7. Confirm: YES', val: 'YES' },
                            ].map((step, i) => (
                              <button
                                key={i}
                                onClick={() => handleSimulateIncoming(step.val)}
                                className="text-left text-[11px] p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-200/60 truncate transition-colors"
                              >
                                {step.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Flow 2: Catalog & Product Order */}
                        <div>
                          <p className="text-[10px] font-bold uppercase text-blue-700 tracking-wider mb-1">
                            Flow 2: Product Catalog Order
                          </p>
                          <div className="grid grid-cols-2 gap-1">
                            {[
                              { label: '1. "View Catalog"', val: 'View Catalog' },
                              { label: '2. Keyboard Item', val: 'Ergonomic Mechanical Keyboard' },
                              { label: '3. Qty: 2', val: '2' },
                              { label: '4. Confirm: YES', val: 'YES' },
                            ].map((step, i) => (
                              <button
                                key={i}
                                onClick={() => handleSimulateIncoming(step.val)}
                                className="text-left text-[11px] p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-800 text-slate-700 border border-slate-200/60 truncate transition-colors"
                              >
                                {step.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Commands & Handoff */}
                        <div>
                          <p className="text-[10px] font-bold uppercase text-purple-700 tracking-wider mb-1">
                            Commands & Handoff
                          </p>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { label: 'MENU', val: 'MENU' },
                              { label: 'BACK', val: 'BACK' },
                              { label: 'CANCEL', val: 'CANCEL' },
                              { label: 'HELP', val: 'HELP' },
                              { label: 'Agent', val: 'Talk to an Agent' },
                              { label: 'Track BK', val: 'Track My Booking' },
                            ].map((step, i) => (
                              <button
                                key={i}
                                onClick={() => handleSimulateIncoming(step.val)}
                                className="text-center text-[11px] p-1.5 rounded-lg bg-slate-50 hover:bg-purple-50 hover:text-purple-800 text-slate-700 border border-slate-200/60 truncate transition-colors font-semibold"
                              >
                                {step.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex gap-1">
                        <input
                          type="text"
                          placeholder="Type custom text..."
                          value={customSimText}
                          onChange={(e) => setCustomSimText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && customSimText && handleSimulateIncoming(customSimText)}
                          className="flex-1 text-xs px-2.5 py-1.5 bg-slate-100 rounded-lg border-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          onClick={() => customSimText && handleSimulateIncoming(customSimText)}
                          className="text-xs font-bold px-2 py-1.5 bg-[#25D366] text-white rounded-lg hover:bg-emerald-600"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Human Agent Handoff Active Banner */}
            {selectedConv && (selectedConv.status === 'pending' || selectedConv.assignedAgent !== 'Chatbot') && (
              <div className="bg-amber-50 border-b border-amber-200/90 px-6 py-2.5 flex items-center justify-between gap-3 text-amber-900 text-xs shadow-2xs z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="font-bold">
                    ⚠️ Human Agent Handoff Active
                  </span>
                  <span className="text-slate-600 hidden sm:inline">
                    — Automated chatbot replies are paused for this customer.
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100 font-bold shrink-0"
                  onClick={handleResumeBot}
                >
                  🤖 Resume Chatbot Automation
                </Button>
              </div>
            )}

            {/* Chat Messages Canvas with WhatsApp pattern */}
            <div className="flex-1 whatsapp-chat-bg p-6 overflow-y-auto space-y-3">
              <div className="text-center my-2">
                <span className="text-[11px] bg-white/80 backdrop-blur-sm text-slate-600 px-3 py-1 rounded-full shadow-xs border border-slate-200/50">
                  🔒 WhatsApp End-to-End Encrypted Simulation • Demo Provider
                </span>
              </div>

              {activeMessages.map((msg) => {
                const isCustomer = msg.sender === 'customer';
                const isBot = msg.sender === 'bot';
                const isAgent = msg.sender === 'agent';

                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm text-sm relative break-words ${
                        isCustomer
                          ? 'bg-white text-slate-900 rounded-tl-none border border-slate-200/60'
                          : isBot
                          ? 'bg-[#E7FFDB] text-slate-900 rounded-tr-none border border-emerald-200/60'
                          : 'bg-[#d9fdd3] text-slate-900 rounded-tr-none border border-emerald-300/60'
                      }`}
                    >
                      {/* Sender label for bot or agent */}
                      {!isCustomer && (
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-emerald-800">
                          {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                          <span>{isBot ? 'WhatBot (Automated)' : 'Alex Rivera (Agent)'}</span>
                        </div>
                      )}

                      {/* Message Content */}
                      <p className="whitespace-pre-line leading-relaxed text-sm text-slate-800">{msg.text}</p>

                      {/* Interactive Options / Buttons from Bot */}
                      {isBot && msg.metadata?.options && msg.metadata.options.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-emerald-200/80 flex flex-wrap gap-1.5">
                          {msg.metadata.options.map((opt, i) => (
                            <button
                              key={i}
                              onClick={() => handleSimulateIncoming(opt)}
                              className="text-xs font-semibold px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>👉 {opt}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Image preview if image */}
                      {msg.mediaUrl && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 max-h-48">
                          <img src={msg.mediaUrl} alt="Attachment" className="object-cover w-full h-full" />
                        </div>
                      )}

                      {/* Timestamp & Status checks */}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                        <span>{formatTime(msg.timestamp)}</span>
                        {!isCustomer && (
                          <span className="text-emerald-600 font-bold">
                            {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bot Rule tag */}
                    {isBot && msg.metadata?.matchedRule && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md font-semibold">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>Rule: {msg.metadata.matchedRule}</span>
                        {msg.metadata?.state && (
                          <span className="font-mono text-[9px] bg-white/70 px-1 rounded">
                            {msg.metadata.state}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Canned Responses Bar */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Canned:</span>
              {[
                'Hello! How can I assist you?',
                'Thank you for your patience.',
                'We have resolved this ticket.',
                'Can I confirm your order number?',
              ].map((canned, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(canned)}
                  className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors whitespace-nowrap shadow-xs"
                >
                  "{canned}"
                </button>
              ))}
            </div>

            {/* Bottom Message Input Area */}
            <div className="p-3.5 bg-white border-t border-slate-200 relative">
              {/* Attachment Picker Popover */}
              {showAttachments && (
                <div className="absolute bottom-16 left-6 bg-white rounded-2xl shadow-modal border border-slate-200 p-2 flex gap-2 z-50 animate-slide-up">
                  <button
                    onClick={() =>
                      handleSendMessage(
                        'Here is our product catalog brochure:',
                        'image',
                        'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=600'
                      )
                    }
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <span>Photo / Graphic</span>
                  </button>

                  <button
                    onClick={() =>
                      handleSendMessage(
                        'Attached: Official SLA & API Specifications Document.pdf',
                        'document',
                        'https://example.com/spec.pdf'
                      )
                    }
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-800 text-xs font-semibold"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                      <FileUp className="w-5 h-5" />
                    </div>
                    <span>Document PDF</span>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAttachments(!showAttachments)}
                  className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Attach Media or Documents"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  placeholder="Type an outgoing agent message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <Button
                  variant="whatsapp"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isSending}
                  icon={<Send className="w-4 h-4" />}
                >
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Bot className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-sm">Select a conversation from the list to start chatting.</p>
          </div>
        )}
      </div>

      {/* COLUMN 3: Customer Details & Internal Notes */}
      {selectedConv && activeContact && (
        <div className="w-80 bg-white border-l border-slate-200 p-5 flex flex-col overflow-y-auto shrink-0 space-y-6">
          <div className="text-center pb-4 border-b border-slate-100">
            <img
              src={activeContact.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${activeContact.name}`}
              alt={activeContact.name}
              className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-emerald-500 shadow-sm mb-2"
            />
            <h3 className="text-base font-bold text-slate-900">{activeContact.name}</h3>
            <p className="text-xs text-slate-500">{activeContact.phoneNumber}</p>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact Info</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{activeContact.phoneNumber}</span>
              </div>
              {activeContact.email && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{activeContact.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Last chat: {formatRelativeTime(activeContact.lastInteractionAt)}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tags</h4>
            <div className="flex flex-wrap gap-1.5">
              {(activeContact.tags || ['Customer']).map((tag, i) => (
                <Badge key={i} variant="whatsapp" size="sm">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Internal Notes */}
          <div className="space-y-2 flex-1 flex flex-col">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Internal Agent Notes</h4>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Add private agent notes about this client..."
              rows={4}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <Button variant="outline" size="sm" onClick={handleSaveNotes} className="w-full">
              Save Notes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
