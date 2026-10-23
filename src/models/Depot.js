import mongoose from 'mongoose';
import { GROUP_KEYS } from '@/lib/constants';

// Custom column: key is a stable id, label is the header shown in the table.
const ColumnSchema = new mongoose.Schema(
  { key: { type: String, required: true }, label: { type: String, required: true } },
  { _id: false },
);

// № is computed from the row order. Values of custom columns live in props: { [column.key]: "value" }.
const ItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    stock: { type: String, default: '' },
    seriya: { type: String, default: '' },
    name: { type: String, default: '' },
    position: { type: String, default: '' },
    active: { type: Boolean, default: true },
    props: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false, minimize: false },
);

const DepotSchema = new mongoose.Schema(
  {
    group: { type: String, enum: GROUP_KEYS, required: true },
    key: { type: String, required: true },
    name: { type: String, required: true },
    // Renamed headers of the built-in columns: { stock, seriya, name, position, active }.
    // A missing key means "use the default translated label".
    labels: { type: mongoose.Schema.Types.Mixed, default: {} },
    columns: { type: [ColumnSchema], default: [] },
    items: { type: [ItemSchema], default: [] },
  },
  { timestamps: true, minimize: false },
);
DepotSchema.index({ group: 1, key: 1 }, { unique: true });

export default mongoose.models.Depot || mongoose.model('Depot', DepotSchema);
