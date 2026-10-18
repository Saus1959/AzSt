import mongoose from 'mongoose';
import { POSITIONS } from '@/lib/constants';

const DocSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    tags: [String],
    department: { type: String, enum: ['all', ...POSITIONS], default: 'all' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Doc || mongoose.model('Doc', DocSchema);
