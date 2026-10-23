import { connectDB } from './db';
import Membership from '@/models/Membership';
import { GROUPS } from './constants';

// Which groups can this user enter? Admin: all of them.
export async function groupAccess(user) {
  await connectDB();
  const ms = await Membership.find({ user: user.id }).lean();
  return GROUPS.map((g) => {
    const m = ms.find((x) => x.group === g.key);
    return { key: g.key, name: g.name, allowed: !!m || user.isAdmin, title: m?.title ?? (user.isAdmin ? 'Director' : null) };
  });
}
