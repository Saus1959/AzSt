import { isLeader, canSeeDepot, ROLES } from './constants';

// u = user from getUser() or a member-shaped object (id, group, position, extraDepots, isAdmin)

// May the user SEE the task (leadership sees everything in its group, to monitor progress).
export const canSeeTask = (task, u) => {
  if (task.targetScope === 'GLOBAL') return true;
  if (task.group !== u.group) return false; // task of another group
  if (u.isAdmin || isLeader(u)) return true;
  return isRecipient(task, u);
};

// Is the task ADDRESSED to this person (counts in "x of y done", shows in their "to do")?
export const isRecipient = (task, u) => {
  if (task.targetScope === 'GLOBAL') return true;
  if (task.group !== u.group) return false;
  switch (task.targetScope) {
    case 'GROUP': return true;
    case 'AREA': return task.targetArea === u.position;
    // leadership has all depots by default, but a depot task is meant for the depot's own people
    case 'DEPO': return !isLeader(u) && canSeeDepot(u, task.targetDepot);
    case 'USERS': return (task.targetUsers || []).some((x) => String(x) === u.id);
    default: return false;
  }
};

export const canCreateTask = (u) => !!u.isAdmin || isLeader(u);
export const canEditTask = (task, u) => !!u.isAdmin || String(task.createdBy?._id || task.createdBy) === u.id;

// A member row (Membership) → object shaped like a user for isRecipient()
export const memberAsUser = (m) => ({
  id: String(m.user), group: m.group, title: m.title, position: ROLES[m.title], extraDepots: m.extraDepots || [], isAdmin: false,
});

const markedBy = (task, id) => (task.completedBy || []).some((c) => String(c.user?._id || c.user) === id);

// Is the task closed for this person? INDIVIDUAL: own mark. SHARED: any mark.
export const isDoneFor = (task, id) =>
  task.completionType === 'SHARED' ? (task.completedBy || []).length > 0 : markedBy(task, id);
export const markedByMe = markedBy;

// dueDate is a calendar day: it is overdue only after that day has ended.
export const isOverdue = (task) =>
  !!task.dueDate && new Date(task.dueDate).getTime() + 86400000 < Date.now();
