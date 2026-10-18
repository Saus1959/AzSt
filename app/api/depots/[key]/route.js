import { NextResponse } from "next/server";
import { route, body, fail } from "@/lib/api";
import { canSee } from "@/lib/constants";
import Depot from "@/models/Depot";
import { DEFAULT_DEPOTS } from "@/lib/depotDb";

const MAX_COLUMNS = 30;
const MAX_ITEMS = 5000;
const str = (v, n = 200) => String(v ?? "").slice(0, n);

function sanitize(data) {
  const columns = (Array.isArray(data.columns) ? data.columns : [])
    .slice(0, MAX_COLUMNS)
    .map((c) => ({
      key: str(c.key, 40).replace(/[^\w-]/g, ""),
      label: str(c.label, 40).trim(),
    }))
    .filter((c) => c.key && c.label);

  const allowed = new Set(columns.map((c) => c.key));

  const items = (Array.isArray(data.items) ? data.items : [])
    .slice(0, MAX_ITEMS)
    .map((it) => {
      const props = {};
      for (const [k, v] of Object.entries(it.props || {})) {
        if (allowed.has(k)) props[k] = str(v);
      }
      return {
        id: str(it.id, 40),
        stock: str(it.stock),
        seriya: str(it.seriya),
        name: str(it.name),
        position: str(it.position),
        active: Boolean(it.active),
        props,
      };
    });

  return { columns, items };
}

export const PUT = route(async (req, { user, params }) => {
  const { key } = params;
  if (!DEFAULT_DEPOTS.some((d) => d.key === key)) return fail("Not found", 404);
  if (!canSee(user, key)) return fail("Forbidden", 403);

  const { columns, items } = sanitize(await body(req));
  const depot = await Depot.findOneAndUpdate(
    { key },
    { $set: { columns, items } },
    { new: true },
  ).lean();
  if (!depot) return fail("Not found", 404);
  return NextResponse.json({ ok: true, updatedAt: depot.updatedAt });
});

// sendBeacon при закрытии вкладки отправляет POST
export const POST = PUT;
