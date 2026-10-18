import { NextResponse } from 'next/server';
import { route, body, pick, fail, validId, depoFilter } from '@/lib/api';
import { canSee } from '@/lib/constants';
import Resource from '@/models/Resource';

const FIELDS = ['name', 'category', 'quantity', 'status', 'location', 'notes', 'depo'];
const find = (id, user) => (validId(id) ? Resource.findOne({ _id: id, ...depoFilter(user) }) : null);

export const PATCH = route(async (req, { user, params }) => {
  const r = await find(params.id, user);
  if (!r) return fail('Not found', 404);
  const data = pick(await body(req), FIELDS);
  if (data.depo && !canSee(user, data.depo)) return fail('Forbidden', 403);
  r.set({ ...data, updatedBy: user.id });
  await r.save();
  return NextResponse.json({ resource: r });
});

export const DELETE = route(async (_req, { user, params }) => {
  const r = await find(params.id, user);
  if (!r) return fail('Not found', 404);
  await r.deleteOne();
  return NextResponse.json({ ok: true });
});
