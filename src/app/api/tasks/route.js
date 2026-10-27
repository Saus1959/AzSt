import { NextResponse } from 'next/server';
import { route, body, fail } from '@/lib/api';
import { POSITIONS, DEPOS } from '@/lib/constants';
import { canSeeTask, canCreateTask, canEditTask, isRecipient } from '@/lib/taskUtils';
import { addProgress } from '@/lib/taskProgress';
import Task from '@/models/Task';

export const dynamic = 'force-dynamic';

export const GET = route(async (_req, { user }) => {
  let tasks = await Task.find({ $or: [{ group: null }, { group: user.group }] })
    .populate('createdBy', 'name')
    .populate('completedBy.user', 'name')
    .sort('-createdAt')
    .lean();
  tasks = tasks.filter((t) => canSeeTask(t, user));
  if (canCreateTask(user)) tasks = await addProgress(tasks); // "5 of 9 done" + who is missing: managers only
  tasks = tasks.map((t) => ({ ...t, mine: isRecipient(t, user), canEdit: canEditTask(t, user) }));
  return NextResponse.json({ tasks });
});

export const POST = route(async (req, { user }) => {
  if (!canCreateTask(user)) return fail('Forbidden', 403);
  const d = await body(req);

  const title = String(d.title || '').trim();
  if (!title) return fail('Title is required');
  if (!['GLOBAL', 'GROUP', 'AREA', 'DEPO'].includes(d.targetScope)) return fail('Invalid target');
  if (d.targetScope === 'GLOBAL' && !user.isAdmin) return fail('Only admins can create global tasks', 403);
  if (d.targetScope === 'AREA' && !POSITIONS.includes(d.targetArea)) return fail('Invalid area');
  if (d.targetScope === 'DEPO' && !DEPOS.includes(d.targetDepot)) return fail('Invalid depot');

  const task = await Task.create({
    title,
    description: String(d.description || ''),
    dueDate: d.dueDate ? new Date(d.dueDate) : null,
    group: d.targetScope === 'GLOBAL' ? null : user.group,
    targetScope: d.targetScope,
    targetArea: d.targetScope === 'AREA' ? d.targetArea : null,
    targetDepot: d.targetScope === 'DEPO' ? d.targetDepot : null,
    completionType: d.completionType === 'SHARED' ? 'SHARED' : 'INDIVIDUAL',
    createdBy: user.id,
  });
  return NextResponse.json({ task }, { status: 201 });
});
