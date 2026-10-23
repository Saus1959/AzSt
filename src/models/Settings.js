import mongoose from 'mongoose';

// One document (key: "global") with app-wide settings managed on the Admin page.
const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    statusHours: { type: [Number], default: undefined }, // duration options of the "at work" status, in hours
    statusFree: { type: Boolean, default: false },       // true: everyone types how long they plan to work
    statusMaxHours: { type: Number, default: 24 },       // upper limit for that free input
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
