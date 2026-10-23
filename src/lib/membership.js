import mongoose from 'mongoose';
import User from '@/models/User';
import { GROUP_KEYS, TITLES, DEPOS } from './constants';

// Validates admin input for a membership. Returns { data } or { error }.
export async function readMembership(d, partial = false) {
  const out = {};
  if (!partial || d.group !== undefined) {
    if (!GROUP_KEYS.includes(d.group)) return { error: 'Invalid group' };
    out.group = d.group;
  }
  if (!partial || d.title !== undefined) {
    if (!TITLES.includes(d.title)) return { error: 'Invalid role' };
    out.title = d.title;
  }
  if (d.user !== undefined) {
    if (d.user === null || d.user === '') out.user = null;
    else {
      if (!mongoose.isValidObjectId(d.user) || !(await User.exists({ _id: d.user }))) return { error: 'User not found' };
      out.user = d.user;
    }
  }
  if (d.extraDepots !== undefined) {
    out.extraDepots = [...new Set((Array.isArray(d.extraDepots) ? d.extraDepots : []).filter((x) => DEPOS.includes(x)))];
  }
  return { data: out };
}

export const membershipView = (m) => ({
  id: String(m._id), group: m.group, user: m.user ? String(m.user) : null, title: m.title, extraDepots: m.extraDepots || [],
});
