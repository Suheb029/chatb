import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: any;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'agent';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'agent'], default: 'admin' },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
