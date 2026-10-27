import { NextResponse } from 'next/server';
import { route, body, fail, validId } from '@/lib/api';
import { canSeeTask, canEditTask } from '@/lib/taskUtils';
import Task from '@/models/Task';

// Edit / delete: the author or an admin. Returns [task, errorResponse].
async function load(id, user) {
  if (!validId(id)) return [null, fail('Not found', 404)];
  const task = await Task.findById(id);
  if (!task || !canSeeTask(task, user)) return [null, fail('Not found', 404)];
  if (!canEditTask(task, user)) return [null, fail('Forbidden', 403)];
  return [task, null];
}

export const PATCH = route(async (req, { user, params }) => {
  const [task, err] = await load(params.id, user);
  if (err) return err;
  const d = await body(req);

  if (d.title !== undefined) {
    const title = String(d.title).trim();
    if (!title) return fail('Title is required');
    task.title = title;
  }
  if (d.description !== undefined) task.description = String(d.description);
  if (d.dueDate !== undefined) task.dueDate = d.dueDate ? new Date(d.dueDate) : null;
  if (d.completionType !== undefined) task.completionType = d.completionType === 'SHARED' ? 'SHARED' : 'INDIVIDUAL';

  await task.save();
  return NextResponse.json({ ok: true });
});

export const DELETE = route(async (_req, { user, params }) => {
  const [task, err] = await load(params.id, user);
  if (err) return err;
  await task.deleteOne();
  return NextResponse.json({ ok: true });
});
