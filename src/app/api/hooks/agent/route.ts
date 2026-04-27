import { NextResponse } from "next/server";
import { getAgentEvents } from "@/lib";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  try {
    const events = await getAgentEvents(limit);
    return NextResponse.json(events);
  } catch (err) {
    console.error("[GET /api/hooks/agent]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
