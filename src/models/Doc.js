import mongoose from 'mongoose';
import { POSITIONS, GROUP_KEYS } from '@/lib/constants';

const DocSchema = new mongoose.Schema(
  {
    group: { type: String, enum: GROUP_KEYS, required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' }, // text / description
    tags: [String],
    department: { type: String, enum: ['all', ...POSITIONS], default: 'all' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Optional attached file: metadata is listed everywhere, the bytes live in `data` (never selected by default).
    file: { type: new mongoose.Schema({ name: String, mime: String, size: Number }, { _id: false }), default: undefined },
    data: { type: Buffer, select: false },
  },
  { timestamps: true }
);

// In dev, hot reload keeps the old compiled model (and its old schema/enum) in memory; rebuild it.
if (process.env.NODE_ENV !== 'production' && mongoose.models.Doc) mongoose.deleteModel('Doc');
export default mongoose.models.Doc || mongoose.model('Doc', DocSchema);
