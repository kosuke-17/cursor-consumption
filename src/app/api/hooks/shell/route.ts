import { NextResponse } from "next/server";
import { getShellEvents } from "@/lib";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  try {
    const events = await getShellEvents(limit);
    return NextResponse.json(events);
  } catch (err) {
    console.error("[GET /api/hooks/shell]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
