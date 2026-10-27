import { NextResponse } from 'next/server';
import { route, body, fail, validId } from '@/lib/api';
import { canSeeTask, canEditTask } from '@/lib/taskUtils';
import News from '@/models/News';

// Edit / delete: the author or an admin.
async function load(id, user) {
  if (!validId(id)) return [null, fail('Not found', 404)];
  const item = await News.findById(id);
  if (!item || !canSeeTask(item, user)) return [null, fail('Not found', 404)];
  if (!canEditTask(item, user)) return [null, fail('Forbidden', 403)];
  return [item, null];
}

export const PATCH = route(async (req, { user, params }) => {
  const [item, err] = await load(params.id, user);
  if (err) return err;
  const d = await body(req);
  if (d.title !== undefined) {
    const title = String(d.title).trim();
    if (!title) return fail('Title is required');
    item.title = title;
  }
  if (d.body !== undefined) item.body = String(d.body).slice(0, 10000);
  await item.save();
  return NextResponse.json({ ok: true });
});

export const DELETE = route(async (_req, { user, params }) => {
  const [item, err] = await load(params.id, user);
  if (err) return err;
  await item.deleteOne();
  return NextResponse.json({ ok: true });
});
