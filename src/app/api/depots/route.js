import { NextResponse } from 'next/server';
import { route } from '@/lib/api';
import { canSeeDepot } from '@/lib/constants';
import { ensureDepots } from '@/lib/depotDb';

export const dynamic = 'force-dynamic';

// Depots of the current group that this user may see:
// leadership — all three; others — their own area plus depots granted by an admin.
export const GET = route(async (_req, { user }) => {
  const depots = (await ensureDepots(user.group)).filter((d) => canSeeDepot(user, d.key));
  return NextResponse.json({ depots });
});
