import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { route, body, fail } from '@/lib/api';
import { publicUser } from '@/lib/auth';
import User from '@/models/User';

export const GET = route(
  async () => {
    const users = await User.find().sort('name').lean();
    return NextResponse.json({ users: users.map(publicUser) });
  },
  { admin: true, noGroup: true },
);

export const POST = route(
  async (req) => {
    const d = await body(req);
    const username = String(d.username || '').toLowerCase().trim();
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) return fail('Invalid username (3–32: a-z, 0-9, . _ -)');
    if (!String(d.name || '').trim()) return fail('Name is required');
    if (String(d.password || '').length < 6) return fail('Password must be at least 6 characters');

    const user = await User.create({
      username,
      name: String(d.name).trim(),
      isAdmin: !!d.isAdmin,
      passwordHash: await bcrypt.hash(String(d.password), 10),
    });
    return NextResponse.json({ user: publicUser(user) }, { status: 201 });
  },
  { admin: true, noGroup: true },
);
