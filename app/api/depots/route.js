]import { NextResponse } from 'next/server';
import { route } from '@/lib/api';
import { canSee } from '@/lib/constants';
import { ensureDepots } from '@/lib/depotDb';

export const dynamic = 'force-dynamic';

// Каждый видит только свои депо: Leadership — все три, Electronics/Mechanics — своё, Programming — ничего.
export const GET = route(async (_req, { user }) => {
  const depots = (await ensureDepots()).filter((d) => canSee(user, d.key));
  return NextResponse.json({ depots });
});