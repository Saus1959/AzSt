import mongoose from 'mongoose';
import { GROUP_KEYS, POSITIONS, DEPOS } from '@/lib/constants';

// Same addressing fields as Task, so lib/taskUtils (canSeeTask / isRecipient) works for news too.
const NewsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '' },
    group: { type: String, enum: [...GROUP_KEYS, null], default: null, index: true }, // null = global
    targetScope: { type: String, enum: ['GLOBAL', 'GROUP', 'AREA', 'DEPO'], required: true },
    targetArea: { type: String, enum: [...POSITIONS, null], default: null },
    targetDepot: { type: String, enum: [...DEPOS, null], default: null },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// In dev, hot reload keeps the old compiled model (and its old schema/enum) in memory; rebuild it.
if (process.env.NODE_ENV !== 'production' && mongoose.models.News) mongoose.deleteModel('News');
export default mongoose.models.News || mongoose.model('News', NewsSchema);
