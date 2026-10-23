import { NextResponse } from 'next/server';
import { route } from '@/lib/api';
import { memberView } from '@/lib/auth';
import { ROLES, TITLES } from '@/lib/constants';
import Membership from '@/models/Membership';

// Members of the CURRENT group (no passwords) + vacant places ("npc").
export const GET = route(async (_req, { user }) => {
  const ms = await Membership.find({ group: user.group }).populate('user', 'username name isAdmin').lean();
  const byRole = (a, b) => TITLES.indexOf(a.title) - TITLES.indexOf(b.title);
  const users = ms.filter((m) => m.user).map((m) => memberView(m.user, m))
    .sort((a, b) => byRole(a, b) || a.name.localeCompare(b.name));
  const vacancies = ms.filter((m) => !m.user)
    .map((m) => ({ id: String(m._id), title: m.title, position: ROLES[m.title] })).sort(byRole);
  return NextResponse.json({ users, vacancies });
});
