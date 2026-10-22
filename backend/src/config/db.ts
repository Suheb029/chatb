import mongoose from 'mongoose';

export let isDbConnected = false;

export const connectDB = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/whatsapp_chatbot';
  const sanitizedUri = mongoUri.replace(/:([^@/]+)@/, ':****@');
  
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 20000,
    });
    isDbConnected = true;
    console.log(`[MongoDB] Connected successfully to Atlas/database: ${sanitizedUri}`);

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected from database');
      isDbConnected = false;
    });

    return true;
  } catch (error: any) {
    console.warn(`[MongoDB] Connection warning: ${error.message}`);
    console.log('[MongoDB] Running with in-memory persistence fallback so all features remain functional in demo/development mode.');
    isDbConnected = false;
    return false;
  }
};
