import mongoose from 'mongoose';
import { POSITIONS, TITLES } from '@/lib/constants';

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    position: { type: String, enum: POSITIONS, required: true },
    title: { type: String, enum: TITLES, required: true },
    isAdmin: { type: Boolean, default: false }, // director
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
