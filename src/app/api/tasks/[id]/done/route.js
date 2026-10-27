import { NextResponse } from 'next/server';
import { route, body, fail, validId } from '@/lib/api';
import { canSeeTask } from '@/lib/taskUtils';
import Task from '@/models/Task';

export const POST = route(async (req, { user, params }) => {
  if (!validId(params.id)) return fail('Not found', 404);
  const task = await Task.findById(params.id);
  if (!task || !canSeeTask(task, user)) return fail('Not found', 404);

  const { comment = '', isDone } = await body(req);
  const i = task.completedBy.findIndex((c) => String(c.user) === user.id);

  if (isDone) {
    const text = String(comment).slice(0, 1000);
    if (i > -1) task.completedBy[i].comment = text; // edit comment
    else task.completedBy.push({ user: user.id, comment: text }); // new mark
  } else if (i > -1) {
    task.completedBy.splice(i, 1); // remove mark
  }

  await task.save();
  return NextResponse.json({ ok: true });
});
