import { NextResponse } from "next/server";
import Depot from "@/models/Depot";
import { connect, DEFAULT_DEPOTS } from "@/lib/depotDb";

const MAX_COLUMNS = 30;
const MAX_ITEMS = 5000;
const str = (v, n = 200) => String(v ?? "").slice(0, n);

function sanitize(body) {
  const columns = (Array.isArray(body.columns) ? body.columns : [])
    .slice(0, MAX_COLUMNS)
    .map((c) => ({
      key: str(c.key, 40).replace(/[^\w-]/g, ""),
      label: str(c.label, 40).trim(),
    }))
    .filter((c) => c.key && c.label);

  const allowed = new Set(columns.map((c) => c.key));

  const items = (Array.isArray(body.items) ? body.items : [])
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

export async function PUT(req, { params }) {
  const { key } = await params; // Next 15: params — Promise
  if (!DEFAULT_DEPOTS.some((d) => d.key === key)) {
    return NextResponse.json({ error: "Неизвестное депо" }, { status: 404 });
  }
  try {
    await connect();
    const body = await req.json();
    const { columns, items } = sanitize(body);
    const depot = await Depot.findOneAndUpdate(
      { key },
      { $set: { columns, items } },
      { new: true },
    ).lean();
    if (!depot)
      return NextResponse.json({ error: "Депо не найдено" }, { status: 404 });
    return NextResponse.json({ ok: true, updatedAt: depot.updatedAt });
  } catch (e) {
    return NextResponse.json(
      { error: "Не удалось сохранить" },
      { status: 500 },
    );
  }
}

// sendBeacon при закрытии вкладки отправляет POST
export const POST = PUT;
