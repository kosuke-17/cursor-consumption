import { NextResponse } from "next/server";
import { saveHookEvent, TABLE_MAP } from "@cursor-consumption/core";

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.hook_event_name as string | undefined;
  if (!eventName || !TABLE_MAP[eventName]) {
    return NextResponse.json(
      { error: `Unknown hook event: ${eventName}` },
      { status: 400 }
    );
  }

  try {
    await saveHookEvent(payload);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/hooks]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
