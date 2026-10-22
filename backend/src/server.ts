import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// Local development server runner
const startServer = async () => {
  console.log('----------------------------------------------------');
  console.log('🚀 Starting WhatBot WhatsApp Business Platform Backend');
  console.log('----------------------------------------------------');

  await connectDB();

  app.listen(PORT, () => {
    console.log(`✅ Backend server running on http://localhost:${PORT}`);
    console.log(`📡 WhatsApp Webhook URL: http://localhost:${PORT}/api/webhooks/whatsapp`);
    console.log(`🧪 Mode: ${process.env.WHATSAPP_MODE || 'demo'} (Meta Cloud API credentials optional)`);
  });
};

startServer();
