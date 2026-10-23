// Simple in-memory limiter for login attempts (per server instance).
const hits = new Map();
const WINDOW = 15 * 60 * 1000;
const MAX = 8;

export function tooMany(id) {
  const e = hits.get(id);
  if (!e || Date.now() - e.t > WINDOW) return false;
  return e.n >= MAX;
}
export function recordFail(id) {
  const e = hits.get(id);
  if (!e || Date.now() - e.t > WINDOW) hits.set(id, { n: 1, t: Date.now() });
  else e.n++;
  if (hits.size > 5000) for (const [k, v] of hits) if (Date.now() - v.t > WINDOW) hits.delete(k);
}
export const clearFails = (id) => hits.delete(id);
