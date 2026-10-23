import mongoose from 'mongoose';

// Account only. Role and group access live in Membership.
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    isAdmin: { type: Boolean, default: false }, // director: sees and manages every group
    // Profile photo (256×256 JPEG, ~20-40 KB). Never loaded with the user; served by /api/users/:id/avatar.
    avatar: { type: Buffer, select: false },
    // "At work" status: active while activeUntil is in the future. Expires by itself, nothing to switch off.
    activeUntil: { type: Date },
    avatarV: { type: Number, default: 0 }, // 0 = no photo; otherwise the upload time (used as cache-buster)
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
