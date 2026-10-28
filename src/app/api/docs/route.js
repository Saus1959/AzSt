import { NextResponse } from 'next/server';
import { route, fail, docFilter } from '@/lib/api';
import { canSee } from '@/lib/constants';
import { readDocInput, prepareFile } from '@/lib/docInput';
import Doc from '@/models/Doc';

export const dynamic = 'force-dynamic';

export const GET = route(async (_req, { user }) => {
  const docs = await Doc.find(docFilter(user)).select('-data').populate('author', 'name').sort('-updatedAt').lean();
  return NextResponse.json({ docs });
});

// JSON (text doc) or multipart/form-data (text + optional file). Every member may add documents.
export const POST = route(async (req, { user }) => {
  const { data, file, error } = await readDocInput(req);
  if (error) return fail(error);

  const extra = {};
  if (file) {
    const r = await prepareFile(file);
    if (r.error) return fail(r.error);
    extra.file = r.meta;
    extra.data = r.buf;
    if (!data.title) data.title = r.meta.name.replace(/\.[^.]+$/, '');
  }
  if (!data.title) return fail('Title is required');
  data.department ??= 'all';
  if (!canSee(user, data.department)) return fail('Forbidden', 403);

  const doc = await Doc.create({ ...data, ...extra, group: user.group, author: user.id });
  return NextResponse.json({ doc: { _id: doc._id } }, { status: 201 });
});
