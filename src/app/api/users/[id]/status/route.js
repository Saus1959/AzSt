import { NextResponse } from 'next/server';
import { route, body, fail, validId } from '@/lib/api';
import { isLeader } from '@/lib/constants';
import { getSettings } from '@/lib/settings';
import User from '@/models/User';
import Membership from '@/models/Membership';

// Mark yourself "at work", counted from now. Only for yourself.
//   { hours }    one of the options the admin set (Admin → Work status)
//   { minutes }  any duration up to the admin's maximum, when free choice is on; admins: up to 24 h always
export const PUT = route(async (req, { user, params }) => {
  if (!validId(params.id)) return fail('Not found', 404);
  if (params.id !== user.id) return fail('Forbidden', 403);
  const d = await body(req);
  const s = await getSettings();
  let min;
  if (d.minutes !== undefined) {
    min = Math.round(Number(d.minutes));
    const limit = (user.isAdmin ? 24 : s.statusFree ? s.statusMaxHours : 0) * 60;
    if (!Number.isFinite(min) || min < 1 || min > limit) return fail('Invalid duration');
  } else {
    const h = Math.round(Number(d.hours) * 100) / 100;
    if (!s.statusHours.includes(h)) return fail('Invalid duration');
    min = Math.round(h * 60);
  }
  const until = new Date(Date.now() + min * 60e3);
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
