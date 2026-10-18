import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { fail } from '@/lib/api';

export async function GET() {
  const user = await getUser();
  return user ? NextResponse.json({ user }) : fail('Unauthorized', 401);
}
