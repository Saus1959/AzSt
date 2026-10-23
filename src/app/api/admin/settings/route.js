import { NextResponse } from 'next/server';
import { route, body, fail } from '@/lib/api';
import { getSettings } from '@/lib/settings';
import Settings from '@/models/Settings';

const round2 = (n) => Math.round(n * 100) / 100;

// Admin: duration options of the "at work" status, free-input mode and its upper limit.
export const PUT = route(async (req) => {
  const d = await body(req);
  const hours = [...new Set((Array.isArray(d.statusHours) ? d.statusHours : [])
    .map(Number).filter((n) => Number.isFinite(n) && n >= 0.1 && n <= 24).map(round2))]
    .sort((a, b) => a - b).slice(0, 8);
  if (!hours.length) return fail('Add at least one duration (0.1–24 hours)');
  const max = Number(d.statusMaxHours);
  if (!Number.isFinite(max) || max < 1 || max > 24) return fail('Maximum must be between 1 and 24 hours');

  await Settings.updateOne(
    { key: 'global' },
    { $set: { statusHours: hours, statusFree: !!d.statusFree, statusMaxHours: round2(max) } },
    { upsert: true },
  );
  return NextResponse.json(await getSettings());
}, { admin: true, noGroup: true });
