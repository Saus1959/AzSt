import { NextResponse } from "next/server";
import { connect, ensureDepots } from "@/lib/depotDb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connect();
    const depots = await ensureDepots();
    return NextResponse.json({ depots });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to load depots" },
      { status: 500 },
    );
  }
}
