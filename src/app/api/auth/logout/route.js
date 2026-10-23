import { NextResponse } from 'next/server';
import { COOKIE_NAME, GROUP_COOKIE, cookieOptions } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { ...cookieOptions, maxAge: 0 });
  res.cookies.set(GROUP_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return res;
}
