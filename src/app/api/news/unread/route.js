import { NextResponse } from 'next/server';
import { route } from '@/lib/api';
import { unreadNews } from '@/lib/newsUtils';

export const dynamic = 'force-dynamic';

// Lightweight counter for the navbar badge.
export const GET = route(async (_req, { user }) => {
  return NextResponse.json({ count: (await unreadNews(user)).length });
});
