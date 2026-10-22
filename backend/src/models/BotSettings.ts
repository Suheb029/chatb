import mongoose, { Document, Schema } from 'mongoose';

export interface IBotSettings extends Document {
  _id: any;
  isEnabled: boolean;
  botName: string;
  welcomeMessage: string;
  fallbackMessage: string;
  businessHoursEnabled: boolean;
  businessHours: {
    start: string;
    end: string;
    timezone: string;
    workDays: number[];
  };
  afterHoursMessage: string;
  handoffEnabled: boolean;
  handoffKeywords: string[];
  handoffMessage: string;
  confidenceThreshold: number;
  responseDelaySeconds: number;
}

const BotSettingsSchema = new Schema<IBotSettings>(
  {
    _id: { type: String },
    isEnabled: { type: Boolean, default: true },
    botName: { type: String, default: 'WhatBot Assistant' },
    welcomeMessage: {
      type: String,
      default: '👋 Hello! Welcome to our WhatsApp Business support. How can we help you today? You can type "menu" or ask any question about pricing, products, or orders.',
    },
    fallbackMessage: {
      type: String,
      default: "🤖 I didn't quite catch that. Could you please rephrase, or type 'agent' to speak with a human support specialist?",
    },
    businessHoursEnabled: { type: Boolean, default: true },
    businessHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
      timezone: { type: String, default: 'UTC+05:30' },
      workDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    },
    afterHoursMessage: {
      type: String,
      default: '🌙 Thank you for reaching out! Our team is currently offline. Business hours are Mon-Fri 9:00 AM - 6:00 PM. We will get back to you as soon as we open.',
    },
    handoffEnabled: { type: Boolean, default: true },
    handoffKeywords: { type: [String], default: ['agent', 'human', 'support', 'representative', 'helpdesk', 'speak to person'] },
    handoffMessage: {
      type: String,
      default: '👤 Sure! I am transferring you to a human agent right now. A member of our support team will reply shortly.',
    },
    confidenceThreshold: { type: Number, default: 0.7 },
    responseDelaySeconds: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const BotSettings = mongoose.models.BotSettings || mongoose.model<IBotSettings>('BotSettings', BotSettingsSchema);
