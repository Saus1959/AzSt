import { NextResponse } from 'next/server';
import { route, body, pick, fail, depoFilter } from '@/lib/api';
import { canSee } from '@/lib/constants';
import Resource from '@/models/Resource';

const FIELDS = ['name', 'category', 'quantity', 'status', 'location', 'notes', 'depo'];

export const GET = route(async (_req, { user }) => {
  const resources = await Resource.find(depoFilter(user)).sort('category name').lean();
  return NextResponse.json({ resources });
});

export const POST = route(async (req, { user }) => {
  const data = pick(await body(req), FIELDS);
  if (!canSee(user, data.depo)) return fail('Forbidden', 403);
  const resource = await Resource.create({ ...data, updatedBy: user.id });
  return NextResponse.json({ resource }, { status: 201 });
});
