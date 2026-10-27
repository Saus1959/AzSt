import mongoose from 'mongoose';
import { GROUP_KEYS, POSITIONS, DEPOS } from '@/lib/constants';

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    dueDate: { type: Date, default: null },
    // group key ('roket', 'ika', ...) or null for a global task
    group: { type: String, enum: [...GROUP_KEYS, null], default: null, index: true },
    targetScope: { type: String, enum: ['GLOBAL', 'GROUP', 'AREA', 'DEPO', 'USERS'], required: true },
    targetArea: { type: String, enum: [...POSITIONS, null], default: null },
    targetDepot: { type: String, enum: [...DEPOS, null], default: null },
    targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    completionType: { type: String, enum: ['INDIVIDUAL', 'SHARED'], default: 'INDIVIDUAL' },
    completedBy: [
      {
        _id: false,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        date: { type: Date, default: Date.now },
        comment: { type: String, default: '' },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// In dev, hot reload keeps the old compiled model (and its old schema/enum) in memory; rebuild it.
if (process.env.NODE_ENV !== 'production' && mongoose.models.Task) mongoose.deleteModel('Task');
export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
