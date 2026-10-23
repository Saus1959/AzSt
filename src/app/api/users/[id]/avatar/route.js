import { NextResponse } from 'next/server';
import { route, body, fail, validId } from '@/lib/api';
import User from '@/models/User';

const MAX_BYTES = 200 * 1024; // the browser sends ~20-40 KB; this is just a safety cap
const PREFIX = 'data:image/jpeg;base64,';

// Photo bytes. Any signed-in user may view any photo. The URL carries ?v=<avatarV>,
// so the browser can cache it "forever" and a new upload gets a new URL.
export const GET = route(async (_req, { params }) => {
  if (!validId(params.id)) return fail('Not found', 404);
  const u = await User.findById(params.id).select('+avatar');
  if (!u?.avatar?.length) return fail('Not found', 404);
  return new Response(new Uint8Array(u.avatar), {
    headers: {
      'Content-Type': 'image/jpeg',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  });
}, { noGroup: true });

// Own photo, or any photo for an admin. Body: { image: "data:image/jpeg;base64,..." }
export const PUT = route(async (req, { user, params }) => {
  if (!validId(params.id)) return fail('Not found', 404);
  if (!user.isAdmin && params.id !== user.id) return fail('Forbidden', 403);

  const { image } = await body(req);
  if (typeof image !== 'string' || !image.startsWith(PREFIX)) return fail('Invalid image');
  const buf = Buffer.from(image.slice(PREFIX.length), 'base64');
  if (buf.length < 100 || buf.length > MAX_BYTES) return fail('Image is too large');
  if (!(buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)) return fail('Invalid image'); // JPEG signature

  const avatarV = Date.now();
  const r = await User.updateOne({ _id: params.id }, { $set: { avatar: buf, avatarV } });
  if (!r.matchedCount) return fail('Not found', 404);
  return NextResponse.json({ avatarV });
}, { noGroup: true });

export const DELETE = route(async (_req, { user, params }) => {
  if (!validId(params.id)) return fail('Not found', 404);
  if (!user.isAdmin && params.id !== user.id) return fail('Forbidden', 403);
  await User.updateOne({ _id: params.id }, { $unset: { avatar: 1 }, $set: { avatarV: 0 } });
  return NextResponse.json({ avatarV: 0 });
}, { noGroup: true });
