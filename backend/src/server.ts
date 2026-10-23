import app from './app.js';
import { connectDB } from './config/db.js';
import { validateConfigAtStartup } from './config/whatsappConfig.js';

const PORT = process.env.PORT || 5000;

// Local development server runner
const startServer = async () => {
  console.log('----------------------------------------------------');
  console.log('🚀 Starting WhatBot WhatsApp Business Platform Backend');
  console.log('----------------------------------------------------');

  await connectDB();
  const config = await validateConfigAtStartup();

  app.listen(PORT, () => {
    console.log(`✅ Backend server running on http://localhost:${PORT}`);
    console.log(`📡 WhatsApp Webhook URL: http://localhost:${PORT}/api/webhooks/whatsapp`);
    console.log(
      `🧪 Mode: ${config.mode.toUpperCase()} (${
        config.mode === 'live' ? 'Meta Cloud API' : 'Sandbox Simulation'
      })`
    );
  });
};

startServer();
