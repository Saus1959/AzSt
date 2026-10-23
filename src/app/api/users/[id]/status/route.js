import { NextResponse } from 'next/server';
import { route, body, fail, validId } from '@/lib/api';
import { STATUS_HOURS, isLeader } from '@/lib/constants';
import User from '@/models/User';
import Membership from '@/models/Membership';

// The status never outlives the day: it is cut at midnight Baku time (UTC+4, no DST).
const BAKU_MS = 4 * 3600e3;
const endOfDay = (now) => Math.floor((now + BAKU_MS) / 864e5) * 864e5 + 864e5 - BAKU_MS;

// Mark yourself "at work" for N hours (counted from now). Only for yourself.
export const PUT = route(async (req, { user, params }) => {
  if (!validId(params.id)) return fail('Not found', 404);
  if (params.id !== user.id) return fail('Forbidden', 403);
  const hours = Number((await body(req)).hours);
  if (!STATUS_HOURS.includes(hours)) return fail('Invalid duration');
  const now = Date.now();
  const until = new Date(Math.min(now + hours * 3600e3, endOfDay(now)));
  await User.updateOne({ _id: user.id }, { $set: { activeUntil: until } });
  return NextResponse.json({ activeUntil: until.toISOString() });
});

// Switch off: yourself, an admin, or a leader of the current group (for its members).
export const DELETE = route(async (_req, { user, params }) => {
  if (!validId(params.id)) return fail('Not found', 404);
  if (params.id !== user.id && !user.isAdmin) {
    const ok = isLeader(user) && (await Membership.exists({ group: user.group, user: params.id }));
    if (!ok) return fail('Forbidden', 403);
  }
  await User.updateOne({ _id: params.id }, { $unset: { activeUntil: 1 } });
  return NextResponse.json({ activeUntil: null });
});
