import { NextResponse } from 'next/server';
import { route, body, fail, validId } from '@/lib/api';
import { readMembership, membershipView } from '@/lib/membership';
import Membership from '@/models/Membership';

// Change role, assign / free the place, grant extra depots.
export const PATCH = route(
  async (req, { params }) => {
    if (!validId(params.id)) return fail('Not found', 404);
    const m = await Membership.findById(params.id);
    if (!m) return fail('Not found', 404);
    const { data, error } = await readMembership(await body(req), true);
    if (error) return fail(error);
    m.set(data);
    await m.save();
    return NextResponse.json({ membership: membershipView(m) });
  },
  { admin: true, noGroup: true },
);

export const DELETE = route(
  async (_req, { params }) => {
    if (!validId(params.id)) return fail('Not found', 404);
    const m = await Membership.findById(params.id);
    if (!m) return fail('Not found', 404);
    await m.deleteOne();
    return NextResponse.json({ ok: true });
  },
  { admin: true, noGroup: true },
);
