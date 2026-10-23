import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { signToken, publicUser, COOKIE_NAME, GROUP_COOKIE, cookieOptions } from '@/lib/auth';
import { fail, body } from '@/lib/api';
import { tooMany, recordFail, clearFails } from '@/lib/rateLimit';
import User from '@/models/User';

export async function POST(req) {
  const { username, password } = await body(req);
  if (!username || !password) return fail('Missing credentials');

  const name = String(username).toLowerCase().trim();
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  const id = `${ip}|${name}`;
  if (tooMany(id)) return fail('Too many attempts. Try again in 15 minutes.', 429);

  await connectDB();
  const user = await User.findOne({ username: name }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    recordFail(id);
    return fail('Invalid username or password', 401);
  }
  clearFails(id);

  const res = NextResponse.json({ user: publicUser(user) });
  res.cookies.set(COOKIE_NAME, await signToken(user), cookieOptions);
  res.cookies.set(GROUP_COOKIE, '', { ...cookieOptions, maxAge: 0 }); // always choose the group again after login
  return res;
}
