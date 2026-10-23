import Settings from '@/models/Settings';
import { STATUS_HOURS } from './constants';

// Global settings with defaults for anything the admin has not changed.
export async function getSettings() {
  const s = await Settings.findOne({ key: 'global' }).lean();
  return {
    statusHours: s?.statusHours?.length ? s.statusHours : STATUS_HOURS,
    statusFree: !!s?.statusFree,
    statusMaxHours: s?.statusMaxHours || 24,
  };
}
