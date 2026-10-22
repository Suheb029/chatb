import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, isDbConnected } from './config/db.js';
import { seedDatabase } from './seed/seedData.js';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: process.env.WHATSAPP_MODE || 'demo',
    database: isDbConnected ? 'MongoDB Connected' : 'In-Memory Persistence Fallback',
    timestamp: new Date().toISOString(),
    service: 'WhatBot WhatsApp Business Integration Engine',
  });
});

// API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ServerError]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
const startServer = async () => {
  console.log('----------------------------------------------------');
  console.log('🚀 Starting WhatBot WhatsApp Business Platform Backend');
  console.log('----------------------------------------------------');

  const dbOk = await connectDB();
  if (dbOk) {
    await seedDatabase();
  }

  app.listen(PORT, () => {
    console.log(`✅ Backend server running on http://localhost:${PORT}`);
    console.log(`📡 WhatsApp Webhook URL: http://localhost:${PORT}/api/webhooks/whatsapp`);
    console.log(`🧪 Mode: ${process.env.WHATSAPP_MODE || 'demo'} (Meta Cloud API credentials optional)`);
  });
};

startServer();
