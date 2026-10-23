import mongoose from 'mongoose';

// Account only. Role and group access live in Membership.
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    isAdmin: { type: Boolean, default: false }, // director: sees and manages every group
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
