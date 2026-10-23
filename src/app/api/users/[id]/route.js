import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { route, body, pick, fail, validId } from '@/lib/api';
import { publicUser } from '@/lib/auth';
import User from '@/models/User';

// Admin: name / password reset for anyone. Any user: change own password (needs currentPassword).
// Roles, groups and depot access are managed on the Admin page.
export const PATCH = route(async (req, { user, params }) => {
  if (!validId(params.id)) return fail('Not found', 404);
  const isSelf = params.id === user.id;
  if (!user.isAdmin && !isSelf) return fail('Forbidden', 403);

  const data = await body(req);
  const target = await User.findById(params.id).select('+passwordHash');
  if (!target) return fail('Not found', 404);

  if (user.isAdmin) target.set(pick(data, ['name']));
  if (data.password) {
    if (String(data.password).length < 6) return fail('Password must be at least 6 characters');
    if (isSelf && !(await bcrypt.compare(String(data.currentPassword || ''), target.passwordHash))) {
      return fail('Current password is wrong', 403);
    }
    target.passwordHash = await bcrypt.hash(String(data.password), 10);
  }
  await target.save();
  return NextResponse.json({ user: publicUser(target) });
});
