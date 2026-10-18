import { NextResponse } from 'next/server';
import { route, body, pick, fail, validId, docFilter } from '@/lib/api';
import { canSee, isLeader } from '@/lib/constants';
import Doc from '@/models/Doc';

// Редактировать/удалять: автор или Leadership
async function load(id, user) {
  if (!validId(id)) return [null, fail('Not found', 404)];
  const doc = await Doc.findOne({ _id: id, ...docFilter(user) });
  if (!doc) return [null, fail('Not found', 404)];
  if (!isLeader(user) && String(doc.author) !== user.id) return [null, fail('Forbidden', 403)];
  return [doc, null];
}

export const PATCH = route(async (req, { user, params }) => {
  const [doc, err] = await load(params.id, user);
  if (err) return err;
  const data = pick(await body(req), ['title', 'content', 'tags', 'department']);
  if (data.department && !canSee(user, data.department)) return fail('Forbidden', 403);
  doc.set(data);
  await doc.save();
  return NextResponse.json({ doc });
});

export const DELETE = route(async (_req, { user, params }) => {
  const [doc, err] = await load(params.id, user);
  if (err) return err;
  await doc.deleteOne();
  return NextResponse.json({ ok: true });
});
