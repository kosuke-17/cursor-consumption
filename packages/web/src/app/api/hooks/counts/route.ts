import { NextResponse } from "next/server";
import { getHookEventCounts } from "@cursor-consumption/core";

export async function GET() {
  try {
    const counts = await getHookEventCounts();
    return NextResponse.json(counts);
  } catch (err) {
    console.error("[GET /api/hooks/counts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
