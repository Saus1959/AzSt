import { NextResponse } from 'next/server';
import { route } from '@/lib/api';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

// Read by every signed-in user (the status popup needs the duration options).
export const GET = route(async () => NextResponse.json(await getSettings()), { noGroup: true });
