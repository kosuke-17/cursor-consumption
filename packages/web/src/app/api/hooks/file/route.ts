import { NextResponse } from "next/server";
import { getFileEvents } from "@cursor-consumption/core";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  try {
    const events = await getFileEvents(limit);
    return NextResponse.json(events);
  } catch (err) {
    console.error("[GET /api/hooks/file]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
