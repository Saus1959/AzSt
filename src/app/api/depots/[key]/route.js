import { NextResponse } from 'next/server';
import { route, body, fail } from '@/lib/api';
import { DEPOS, canSeeDepot } from '@/lib/constants';
import Depot from '@/models/Depot';

const MAX_COLUMNS = 30;
const MAX_ITEMS = 5000;
const MAX_OPS = 500;
const BASE_KEYS = ['stock', 'seriya', 'name', 'position', 'active'];
const str = (v, n = 200) => String(v ?? '').slice(0, n);

function cleanColumns(cols) {
  const seen = new Set();
  return (Array.isArray(cols) ? cols : [])
    .slice(0, MAX_COLUMNS)
    .map((c) => ({ key: str(c?.key, 40).replace(/[^\w-]/g, ''), label: str(c?.label, 40).trim() }))
    .filter((c) => c.key && c.label && !seen.has(c.key) && seen.add(c.key));
}

// Renamed headers of the built-in columns. Empty / missing = default label.
function cleanLabels(labels) {
  const out = {};
  for (const k of BASE_KEYS) {
    const s = str(labels?.[k], 40).trim();
    if (s) out[k] = s;
  }
  return out;
}

function cleanItem(it, allowed) {
  const props = {};
  for (const [k, v] of Object.entries(it?.props || {})) if (allowed.has(k)) props[k] = str(v);
  return {
    id: str(it?.id, 40), stock: str(it?.stock), seriya: str(it?.seriya), name: str(it?.name),
    position: str(it?.position), active: Boolean(it?.active), props,
  };
}

// Changes arrive as small operations (one row / the column list / the header labels),
// so two people editing different rows of the same depot do not overwrite each other.
//   { op: 'item', item }      add or replace one row
//   { op: 'removeItem', id }  delete one row
//   { op: 'columns', columns} replace custom columns (values of removed ones are dropped)
//   { op: 'labels', labels }  rename built-in column headers
export const PATCH = route(async (req, { user, params }) => {
  const { key } = params;
  const group = user.group;
  if (!DEPOS.includes(key)) return fail('Not found', 404);
  if (!canSeeDepot(user, key)) return fail('Forbidden', 403);

  const { ops } = await body(req);
  if (!Array.isArray(ops)) return fail('Bad request');

  const depot = await Depot.findOne({ group, key }).select('columns').lean();
  if (!depot) return fail('Not found', 404);
  let allowed = new Set(depot.columns.map((c) => c.key));

  const col = Depot.collection; // native driver: exact operators, no casting surprises
  const now = { $currentDate: { updatedAt: true } };

  for (const o of ops.slice(0, MAX_OPS)) {
    if (o?.op === 'columns') {
      const columns = cleanColumns(o.columns);
      const next = new Set(columns.map((c) => c.key));
      const dropped = [...allowed].filter((k) => !next.has(k));
      const update = { $set: { columns }, ...now };
      if (dropped.length) update.$unset = Object.fromEntries(dropped.map((k) => [`items.$[].props.${k}`, '']));
      await col.updateOne({ group, key }, update);
      allowed = next;
    } else if (o?.op === 'labels') {
      await col.updateOne({ group, key }, { $set: { labels: cleanLabels(o.labels) }, ...now });
    } else if (o?.op === 'removeItem') {
      await col.updateOne({ group, key }, { $pull: { items: { id: str(o.id, 40) } }, ...now });
    } else if (o?.op === 'item') {
      const item = cleanItem(o.item, allowed);
      if (!item.id) continue;
      const r = await col.updateOne({ group, key, 'items.id': item.id }, { $set: { 'items.$': item }, ...now });
      if (!r.matchedCount) {
        await col.updateOne(
          { group, key, 'items.id': { $ne: item.id }, [`items.${MAX_ITEMS - 1}`]: { $exists: false } },
          { $push: { items: item }, ...now },
        );
      }
    }
  }
  return NextResponse.json({ ok: true });
});

// sendBeacon (tab closing) can only POST
export const POST = PATCH;
