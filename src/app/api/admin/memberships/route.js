import { NextResponse } from 'next/server';
import { route, body, fail } from '@/lib/api';
import { readMembership, membershipView } from '@/lib/membership';
import Membership from '@/models/Membership';

export const GET = route(
  async () => {
    const ms = await Membership.find().lean();
    return NextResponse.json({ memberships: ms.map(membershipView) });
  },
  { admin: true, noGroup: true },
);

// Add a place to a group. No user → vacancy (npc).
export const POST = route(
  async (req) => {
    const { data, error } = await readMembership(await body(req));
    if (error) return fail(error);
    const m = await Membership.create(data);
    return NextResponse.json({ membership: membershipView(m) }, { status: 201 });
  },
  { admin: true, noGroup: true },
);
