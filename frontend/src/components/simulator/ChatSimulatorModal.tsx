import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, RotateCcw, Sparkles, User, Info } from 'lucide-react';
import { Modal } from '../common/Modal';
import { api } from '../../lib/api';
import { formatTime } from '../../lib/utils';

interface ChatSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SimMessage {
  id: string;
  sender: 'customer' | 'bot';
  text: string;
  time: string;
  matchedRule?: string;
  reason?: string;
  action?: string;
  options?: string[];
  state?: string;
}

export const ChatSimulatorModal: React.FC<ChatSimulatorModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<SimMessage[]>([
    {
      id: 'sim_welcome',
      sender: 'bot',
      text: '👋 Hello! Welcome to our WhatsApp Business support. How can we help you today?\n\nType "Hi" to see our Welcome Menu, or "Our Services" / "View Catalog".',
      time: formatTime(new Date()),
      action: 'welcome',
      options: ['Our Services', 'View Catalog', 'Book an Appointment', 'Talk to an Agent'],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isTyping) return;

    const userMsg: SimMessage = {
      id: `sim_usr_${Date.now()}`,
      sender: 'customer',
      text: textToSend,
      time: formatTime(new Date()),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.bot.testSimulator(textToSend);
      const decision = res.decision;

      setTimeout(() => {
        const botReply: SimMessage = {
          id: `sim_bot_${Date.now()}`,
          sender: 'bot',
          text: decision.responseText || "🤖 Sorry, I didn't get that.",
          time: formatTime(new Date()),
          matchedRule: decision.matchedRuleName,
          reason: decision.reason,
          action: decision.action,
          options: decision.options,
          state: decision.state,
        };
        setMessages((prev) => [...prev, botReply]);
        setIsTyping(false);
      }, 500);
    } catch (e) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `sim_err_${Date.now()}`,
            sender: 'bot',
            text: '🤖 Simulated response received.',
            time: formatTime(new Date()),
          },
        ]);
        setIsTyping(false);
      }, 400);
    }
  };

  const handleReset = async () => {
    try {
      await api.bot.testSimulator('CANCEL');
    } catch (e) {}
    setMessages([
      {
        id: 'sim_welcome_reset',
        sender: 'bot',
        text: '👋 Hello! Welcome to our WhatsApp Business support. How can we help you today?\n\nType "Hi" to see our Welcome Menu, or choose an option below:',
        time: formatTime(new Date()),
        action: 'welcome',
        options: ['Our Services', 'View Catalog', 'Book an Appointment', 'Talk to an Agent'],
      },
    ]);
  };

  const quickPrompts = [
    'Hi',
    'Our Services',
    'Website Development',
    'Business website',
    '₹20,000',
    'Next week',
    'YES',
    'View Catalog',
    'Ergonomic Mechanical Keyboard',
    '2',
    'Track My Booking',
    'Talk to an Agent',
    'MENU',
    'BACK',
    'CANCEL',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Interactive WhatsApp Bot Simulator"
      subtitle="Live testing sandbox — verify your keyword rules, fallback, and handoff triggers in real time"
      maxWidth="max-w-md"
    >
      <div className="flex flex-col h-[520px] rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-900">
        {/* Smartphone WhatsApp Header */}
        <div className="bg-[#075E54] px-4 py-3 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-700 border-2 border-emerald-400 flex items-center justify-center font-bold text-white shadow-sm">
                <Bot className="w-5 h-5 text-emerald-200" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#075E54]" />
            </div>
            <div>
              <h4 className="font-semibold text-sm leading-tight">WhatBot Assistant</h4>
              <p className="text-[11px] text-emerald-200 flex items-center gap-1">
                <span>WhatsApp Business Verified</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            title="Reset Simulator Chat"
            className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* WhatsApp Chat Canvas */}
        <div className="flex-1 whatsapp-chat-bg p-4 overflow-y-auto flex flex-col gap-3">
          <div className="text-center my-1">
            <span className="text-[10px] bg-white/80 backdrop-blur-sm text-slate-600 px-3 py-1 rounded-full shadow-sm">
              Today • End-to-end encrypted demo session
            </span>
          </div>

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'customer' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-sm relative break-words ${
                  m.sender === 'customer'
                    ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none'
                    : 'bg-white text-slate-900 rounded-tl-none border border-slate-200/60'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{m.text}</p>

                {/* Interactive Bot Options */}
                {m.sender === 'bot' && m.options && m.options.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-wrap gap-1">
                    {m.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(opt)}
                        className="text-[11px] font-semibold px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>👉 {opt}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                  <span>{m.time}</span>
                  {m.sender === 'customer' && <span className="text-emerald-600 font-bold">✓✓</span>}
                </div>
              </div>

              {/* Bot rule attribution pill */}
              {m.sender === 'bot' && (m.matchedRule || m.action) && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md font-medium shadow-xs">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>
                    {m.action === 'handoff'
                      ? 'Action: Human Agent Handoff'
                      : m.action === 'welcome'
                      ? 'Action: Welcome Greeting'
                      : m.matchedRule
                      ? `Rule: ${m.matchedRule}`
                      : `Decision: ${m.action}`}
                  </span>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 w-fit text-xs text-slate-500 shadow-sm animate-pulse">
              <Bot className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatBot is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt pills */}
        <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-medium text-slate-400 shrink-0">Try:</span>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors whitespace-nowrap shadow-xs"
            >
              "{prompt}"
            </button>
          ))}
        </div>

        {/* Bottom Input Area */}
        <div className="bg-white border-t border-slate-200 p-2.5 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a simulated message..."
            className="flex-1 bg-slate-100 border-none rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
