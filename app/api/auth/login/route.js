import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { signToken, publicUser, COOKIE_NAME, cookieOptions } from '@/lib/auth';
import { fail, body } from '@/lib/api';
import User from '@/models/User';

export async function POST(req) {
  const { username, password } = await body(req);
  if (!username || !password) return fail('Missing credentials');
  await connectDB();
  const user = await User.findOne({ username: String(username).toLowerCase().trim() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) return fail('Invalid username or password', 401);

  const res = NextResponse.json({ user: publicUser(user) });
  res.cookies.set(COOKIE_NAME, await signToken(user), cookieOptions);
  return res;
}
