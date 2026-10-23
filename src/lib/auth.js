import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { connectDB } from './db';
import User from '@/models/User';
import Membership from '@/models/Membership';
import { GROUP_KEYS, ROLES } from './constants';

export const COOKIE_NAME = 'token';
export const GROUP_COOKIE = 'group';
export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};
const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(process.env.JWT_SECRET);
};

export const signToken = (user) =>
  new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(String(user._id)).setExpirationTime('7d').sign(secret());

export const publicUser = (u) => ({
  id: String(u._id), username: u.username, name: u.name, isAdmin: !!u.isAdmin,
});

// A user as seen inside one group (account + membership).
export const memberView = (u, m) => ({
  ...publicUser(u), title: m.title, position: ROLES[m.title], extraDepots: m.extraDepots || [],
});

// JWT keeps only the user id. The chosen group lives in a separate cookie and is
// re-checked against Membership on every request, so access changes apply at once.
export async function getUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    await connectDB();
    const u = await User.findById(payload.sub).lean();
    if (!u) return null;
    const base = { ...publicUser(u), group: null, title: null, position: null, extraDepots: [] };
    const group = jar.get(GROUP_COOKIE)?.value;
    if (!GROUP_KEYS.includes(group)) return base;
    const m = await Membership.findOne({ group, user: u._id }).lean();
    if (m) return { ...base, group, title: m.title, position: ROLES[m.title], extraDepots: m.extraDepots || [] };
    // Admin may enter every group; acts as leadership there.
    if (u.isAdmin) return { ...base, group, title: 'Director', position: 'leadership' };
    return base;
  } catch {
    return null;
  }
}
