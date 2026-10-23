import mongoose from 'mongoose';
import { GROUP_KEYS, TITLES } from '@/lib/constants';

// One row = one place in a group. user === null → vacancy ("npc"), filled in later.
const MembershipSchema = new mongoose.Schema(
  {
    group: { type: String, enum: GROUP_KEYS, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, enum: TITLES, required: true },
    extraDepots: { type: [String], default: [] }, // depots granted by admin on top of the default
  },
  { timestamps: true }
);
MembershipSchema.index(
  { group: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } }
);

export default mongoose.models.Membership || mongoose.model('Membership', MembershipSchema);
