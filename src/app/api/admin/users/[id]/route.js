import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { route, body, fail, validId } from '@/lib/api';
import { publicUser } from '@/lib/auth';
import User from '@/models/User';
import Doc from '@/models/Doc';
import Membership from '@/models/Membership';

export const PATCH = route(
  async (req, { params }) => {
    if (!validId(params.id)) return fail('Not found', 404);
    const target = await User.findById(params.id).select('+passwordHash');
    if (!target) return fail('Not found', 404);
    const d = await body(req);

    if (d.username !== undefined) {
      const username = String(d.username).toLowerCase().trim();
      if (!/^[a-z0-9._-]{3,32}$/.test(username)) return fail('Invalid username (3–32: a-z, 0-9, . _ -)');
      target.username = username;
    }
    if (d.name !== undefined) {
      if (!String(d.name).trim()) return fail('Name is required');
      target.name = String(d.name).trim();
    }
    if (d.isAdmin !== undefined && !!d.isAdmin !== target.isAdmin) {
      if (!d.isAdmin) {
        const admins = await User.countDocuments({ isAdmin: true });
        if (admins <= 1) return fail('At least one admin is required');
      }
      target.isAdmin = !!d.isAdmin;
    }
    if (d.password) {
      if (String(d.password).length < 6) return fail('Password must be at least 6 characters');
      target.passwordHash = await bcrypt.hash(String(d.password), 10);
    }
    await target.save();
    return NextResponse.json({ user: publicUser(target) });
  },
  { admin: true, noGroup: true },
);

export const DELETE = route(
  async (_req, { user, params }) => {
    if (!validId(params.id)) return fail('Not found', 404);
    if (params.id === user.id) return fail('You cannot delete yourself', 400);
    const target = await User.findById(params.id);
    if (!target) return fail('Not found', 404);
    // Docs need an author: hand them to the admin. Roster places stay as vacancies.
    await Doc.updateMany({ author: target._id }, { author: user.id });
    await Membership.updateMany({ user: target._id }, { user: null, extraDepots: [] });
    await target.deleteOne();
    return NextResponse.json({ ok: true });
  },
  { admin: true, noGroup: true },
);
