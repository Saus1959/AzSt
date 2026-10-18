import mongoose from 'mongoose';
import { DEPOS, STATUSES } from '@/lib/constants';

const ResourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: '', trim: true },
    quantity: { type: Number, default: 1, min: 0 },
    status: { type: String, enum: STATUSES, default: 'ok' },
    location: { type: String, default: '' },
    notes: { type: String, default: '' },
    depo: { type: String, enum: DEPOS, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.Resource || mongoose.model('Resource', ResourceSchema);
