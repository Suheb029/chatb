import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, isDbConnected } from './config/db.js';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure DB is connected for incoming API requests (serverless-friendly)
app.use(async (req, res, next) => {
  if (!isDbConnected && process.env.MONGODB_URI) {
    try {
      await connectDB();
    } catch (e) {
      // Continue with in-memory fallback
    }
  }
  next();
});

// Root Service Info
app.get('/', (req, res) => {
  res.json({
    service: 'WhatBot WhatsApp Business Integration Engine',
    status: 'online',
    database: isDbConnected ? 'MongoDB Connected' : 'In-Memory Persistence Fallback',
    endpoints: {
      health: '/api/health',
      webhooks: '/api/webhooks/whatsapp',
      apiDocs: '/api',
    },
    timestamp: new Date().toISOString(),
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: process.env.WHATSAPP_MODE || 'demo',
    database: isDbConnected ? 'MongoDB Connected' : 'In-Memory Persistence Fallback',
    service: 'WhatBot WhatsApp Business Integration Engine',
    timestamp: new Date().toISOString(),
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

export default app;
export { app };
