import { NextResponse } from 'next/server';
import { route, body, fail } from '@/lib/api';
import { groupAccess } from '@/lib/groups';
import { GROUP_COOKIE, cookieOptions } from '@/lib/auth';

// Choose the group to work in. Only groups the user has a membership in (admin: all).
export const POST = route(
  async (req, { user }) => {
    const { group } = await body(req);
    const access = (await groupAccess(user)).find((g) => g.key === group);
    if (!access?.allowed) return fail('Forbidden', 403);
    const res = NextResponse.json({ ok: true, group });
    res.cookies.set(GROUP_COOKIE, group, cookieOptions);
    return res;
  },
  { noGroup: true },
);
