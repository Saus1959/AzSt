import { NextResponse } from 'next/server';
import { route, body, fail } from '@/lib/api';
import { POSITIONS, DEPOS } from '@/lib/constants';
import { canSeeTask, canCreateTask, canEditTask, isRecipient } from '@/lib/taskUtils';
import News from '@/models/News';

export const dynamic = 'force-dynamic';

export const GET = route(async (_req, { user }) => {
  const docs = await News.find({ $or: [{ group: null }, { group: user.group }] })
    .populate('createdBy', 'name')
    .sort('-createdAt')
    .limit(200)
    .lean();
  const news = docs
    .filter((n) => canSeeTask(n, user))
    .map(({ readBy = [], ...n }) => ({
      ...n,
      mine: isRecipient(n, user), // addressed to me (leadership also SEES other areas' news)
      read: readBy.some((x) => String(x) === user.id) || String(n.createdBy?._id) === user.id,
      canEdit: canEditTask(n, user),
    }));
  return NextResponse.json({ news });
});

export const POST = route(async (req, { user }) => {
  if (!canCreateTask(user)) return fail('Forbidden', 403);
  const d = await body(req);

  const title = String(d.title || '').trim();
  if (!title) return fail('Title is required');
  if (!['GLOBAL', 'GROUP', 'AREA', 'DEPO'].includes(d.targetScope)) return fail('Invalid target');
  if (d.targetScope === 'GLOBAL' && !user.isAdmin) return fail('Only admins can post global news', 403);
  if (d.targetScope === 'AREA' && !POSITIONS.includes(d.targetArea)) return fail('Invalid area');
  if (d.targetScope === 'DEPO' && !DEPOS.includes(d.targetDepot)) return fail('Invalid depot');

  const news = await News.create({
    title,
    body: String(d.body || '').slice(0, 10000),
    group: d.targetScope === 'GLOBAL' ? null : user.group,
    targetScope: d.targetScope,
    targetArea: d.targetScope === 'AREA' ? d.targetArea : null,
    targetDepot: d.targetScope === 'DEPO' ? d.targetDepot : null,
    createdBy: user.id,
  });
  return NextResponse.json({ news: { _id: news._id } }, { status: 201 });
});
