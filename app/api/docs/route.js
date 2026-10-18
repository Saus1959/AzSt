import { NextResponse } from 'next/server';
import { route, body, pick, fail, docFilter } from '@/lib/api';
import { canSee } from '@/lib/constants';
import Doc from '@/models/Doc';

export const GET = route(async (_req, { user }) => {
  const docs = await Doc.find(docFilter(user)).populate('author', 'name').sort('-updatedAt').lean();
  return NextResponse.json({ docs });
});

export const POST = route(async (req, { user }) => {
  const data = pick(await body(req), ['title', 'content', 'tags', 'department']);
  if (!canSee(user, data.department ?? 'all')) return fail('Forbidden', 403);
  const doc = await Doc.create({ ...data, author: user.id });
  return NextResponse.json({ doc }, { status: 201 });
});
