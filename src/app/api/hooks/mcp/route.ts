import { NextResponse } from "next/server";
import { getMcpEvents } from "@/lib";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  try {
    const events = await getMcpEvents(limit);
    return NextResponse.json(events);
  } catch (err) {
    console.error("[GET /api/hooks/mcp]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
