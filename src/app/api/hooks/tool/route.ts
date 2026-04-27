import { NextResponse } from "next/server";
import { getToolEvents } from "@/lib";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  try {
    const events = await getToolEvents(limit);
    return NextResponse.json(events);
  } catch (err) {
    console.error("[GET /api/hooks/tool]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
