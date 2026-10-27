import Membership from '@/models/Membership';
import User from '@/models/User';
import { isRecipient, memberAsUser } from './taskUtils';

// Adds `progress` = { total, done, pending: [{id, name}], shared } to every task.
// Recipients are the real people (memberships with a user) the task is addressed to.
export async function addProgress(tasks) {
  if (!tasks.length) return tasks;
  const groups = [...new Set(tasks.map((t) => t.group).filter(Boolean))];
  const hasGlobal = tasks.some((t) => !t.group);
  const members = (await Membership.find(hasGlobal ? { user: { $ne: null } } : { user: { $ne: null }, group: { $in: groups } }).lean())
    .map(memberAsUser);

  const perTask = tasks.map((task) => {
    const seen = new Set();
    const recipients = members.filter((m) => {
      if (seen.has(m.id) || !isRecipient(task, m)) return false;
      seen.add(m.id);
      return true;
    });
    const marked = new Set((task.completedBy || []).map((c) => String(c.user?._id || c.user)));
    return { recipients, marked };
  });

  const pendingIds = new Set();
  perTask.forEach(({ recipients, marked }) => recipients.forEach((r) => !marked.has(r.id) && pendingIds.add(r.id)));
  const names = Object.fromEntries((await User.find({ _id: { $in: [...pendingIds] } }).select('name').lean()).map((u) => [String(u._id), u.name]));

  return tasks.map((task, i) => {
    const { recipients, marked } = perTask[i];
    const shared = task.completionType === 'SHARED';
    return {
      ...task,
      progress: {
        shared,
        total: recipients.length,
        done: shared ? Math.min(1, marked.size) : recipients.filter((r) => marked.has(r.id)).length,
        pending: shared ? [] : recipients.filter((r) => !marked.has(r.id)).map((r) => ({ id: r.id, name: names[r.id] || '—' })),
      },
    };
  });
}
