import { NextResponse } from 'next/server';
import { route } from '@/lib/api';
import { ensureDepots } from '@/lib/depotDb';
import User from '@/models/User';
import Doc from '@/models/Doc';
import Membership from '@/models/Membership';

export const dynamic = 'force-dynamic';

// Numbers for the CURRENT group (users = all accounts).
export const GET = route(
  async (_req, { user }) => {
    const g = user.group;
    const [users, members, vacancies, docs, depots] = await Promise.all([
      User.countDocuments(),
      Membership.countDocuments({ group: g, user: { $ne: null } }),
      Membership.countDocuments({ group: g, user: null }),
      Doc.countDocuments({ group: g }),
      ensureDepots(g),
    ]);
    return NextResponse.json({
      users, members, vacancies, docs,
      depots: depots.map((d) => {
        const active = d.items.filter((i) => i.active).length;
        return { key: d.key, items: d.items.length, active, passive: d.items.length - active, columns: d.columns.length };
      }),
    });
  },
  { admin: true },
);
