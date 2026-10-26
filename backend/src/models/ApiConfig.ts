import mongoose, { Document, Schema } from 'mongoose';

export interface IApiConfig extends Document {
  _id: any;
  mode: 'demo' | 'live' | 'qr';
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
  webhookVerifyToken: string;
  webhookCallbackUrl: string;
  isConnected: boolean;
  lastTestedAt?: Date;
  metaVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApiConfigSchema = new Schema<IApiConfig>(
  {
    _id: { type: String },
    mode: { type: String, enum: ['demo', 'live', 'qr'], default: 'demo' },
    wabaId: { type: String, default: 'waba_demo_1092837465' },
    phoneNumberId: { type: String, default: 'phone_demo_9876543210' },
    accessToken: { type: String, default: '' },
    webhookVerifyToken: { type: String, default: 'whatbot_secure_token_demo' },
    webhookCallbackUrl: { type: String, default: 'https://api.yourdomain.com/api/webhooks/whatsapp' },
    isConnected: { type: Boolean, default: false },
    lastTestedAt: { type: Date },
    metaVersion: { type: String, default: 'v20.0' },
  },
  { timestamps: true }
);

export const ApiConfig = mongoose.models.ApiConfig || mongoose.model<IApiConfig>('ApiConfig', ApiConfigSchema);
