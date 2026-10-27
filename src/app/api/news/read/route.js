import { NextResponse } from 'next/server';
import { route, body, validId } from '@/lib/api';
import { canSeeTask } from '@/lib/taskUtils';
import { unreadNews } from '@/lib/newsUtils';
import News from '@/models/News';

// { ids: [...] } marks those news as read, { all: true } marks everything addressed to me.
export const POST = route(async (req, { user }) => {
  const d = await body(req);
  let ids;
  if (d.all) {
    ids = (await unreadNews(user)).map((n) => n._id);
  } else {
    const wanted = (Array.isArray(d.ids) ? d.ids : []).filter(validId).slice(0, 200);
    const found = await News.find({ _id: { $in: wanted } }).select('group targetScope targetArea targetDepot').lean();
    ids = found.filter((n) => canSeeTask(n, user)).map((n) => n._id);
  }
  if (ids.length) await News.updateMany({ _id: { $in: ids } }, { $addToSet: { readBy: user.id } });
  return NextResponse.json({ ok: true, marked: ids.length });
});
