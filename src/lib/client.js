import { useCallback, useEffect, useState } from 'react';

export async function api(url, { method = 'GET', body } = {}) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Error'), { status: res.status });
  return data;
}

export function useApi(url) {
  const [data, setData] = useState(null);
  const load = useCallback(() => api(url).then(setData).catch(() => setData({})), [url]);
  useEffect(() => { load(); }, [load]);
  return { data, reload: load };
}

// Photo URL of a user, or null (→ initials). `v` busts the browser cache after a change.
export const avatarUrl = (u) => (u?.avatarV ? `/api/users/${u.id}/avatar?v=${u.avatarV}` : null);

// Centre-crops any image to a square, scales it to 256×256 and returns a JPEG data URL (~20-40 KB).
export async function fileToAvatar(file, size = 256) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(bmp.width, bmp.height);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  return c.toDataURL('image/jpeg', 0.85);
}

// Is this person marked "at work" right now? (u.activeUntil is an ISO string or null)
export const isActive = (u, now = Date.now()) => !!u?.activeUntil && new Date(u.activeUntil).getTime() > now;
