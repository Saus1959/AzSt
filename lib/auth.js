import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { connectDB } from './db';
import User from '@/models/User';

export const COOKIE_NAME = 'token';
export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET);

export const signToken = (user) =>
  new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(String(user._id)).setExpirationTime('7d').sign(secret());

export const publicUser = (u) => ({
  id: String(u._id), username: u.username, name: u.name, position: u.position, title: u.title, isAdmin: !!u.isAdmin,
});

// JWT хранит только id — актуальные position/title берутся из БД (смена позиции действует сразу)
export async function getUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    await connectDB();
    const u = await User.findById(payload.sub).lean();
    return u ? publicUser(u) : null;
  } catch {
    return null;
  }
}
