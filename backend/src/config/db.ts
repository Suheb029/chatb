import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export let isDbConnected = false;

// Cached connection promise across serverless function invocations
let cachedPromise: Promise<boolean> | null = null;

export const connectDB = async (): Promise<boolean> => {
  // If already connected, reuse existing connection (Mongoose readyState 1 = connected)
  if (mongoose.connection.readyState === 1) {
    isDbConnected = true;
    return true;
  }

  // If a connection is already being established (readyState 2 = connecting), wait for it
  if (mongoose.connection.readyState === 2 && cachedPromise) {
    return cachedPromise;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn('[MongoDB] MONGODB_URI not configured. Operating in in-memory persistence fallback mode.');
    isDbConnected = false;
    return false;
  }

  const sanitizedUri = mongoUri.replace(/:([^@/]+)@/, ':****@');

  cachedPromise = (async () => {
    try {
      mongoose.set('strictQuery', false);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        bufferCommands: false,
      });

      isDbConnected = true;
      console.log(`[MongoDB] Connected successfully to ${sanitizedUri}`);

      mongoose.connection.on('error', (err) => {
        console.error('[MongoDB] Runtime connection error:', err.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('[MongoDB] Disconnected from database');
        isDbConnected = false;
      });

      return true;
    } catch (error: any) {
      console.warn(`[MongoDB] Connection warning: ${error.message}`);
      console.log('[MongoDB] Running with in-memory persistence fallback so all features remain functional.');
      isDbConnected = false;
      return false;
    } finally {
      cachedPromise = null;
    }
  })();

  return cachedPromise;
};
