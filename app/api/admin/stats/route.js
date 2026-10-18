import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { ensureDepots } from "@/lib/depotDb";
import User from "@/models/User";
import Doc from "@/models/Doc";
import Resource from "@/models/Resource";

export const dynamic = "force-dynamic";

export const GET = route(
  async () => {
    const [users, docs, resources, depots] = await Promise.all([
      User.countDocuments(),
      Doc.countDocuments(),
      Resource.countDocuments(),
      ensureDepots(),
    ]);
    return NextResponse.json({
      users,
      docs,
      resources,
      depots: depots.map((d) => {
        const active = d.items.filter((i) => i.active).length;
        return {
          key: d.key,
          items: d.items.length,
          active,
          passive: d.items.length - active,
          columns: d.columns.length,
        };
      }),
    });
  },
  { admin: true },
);
