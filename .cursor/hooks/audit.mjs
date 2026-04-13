#!/usr/bin/env node
/**
 * Cursor Hook: append stdin JSON (one event) to audit.json as a JSON array.
 * Always exits 0 so Cursor is never blocked.
 */
import { stdin } from "node:process";

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stdin.on("data", (c) => chunks.push(c));
    stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stdin.on("error", reject);
  });
}

async function main() {
  const raw = await readStdin();
  let payload;
  try {
    payload = raw.trim() === "" ? {} : JSON.parse(raw);
  } catch {
    payload = { _parseError: true, _raw: raw };
  }

  const entry = {
    _loggedAt: new Date().toISOString(),
    ...payload,
  };

  // Send to API (fire-and-forget, silent failure)
  try {
    await fetch("http://localhost:3000/api/hooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    const eventName = payload?.hook_event_name ?? "unknown";
    console.error(
      `[audit.mjsファイル] ${eventName}のhookイベントでエラーが発生しました`,
      err,
    );
  }
}

main()
  .catch((err) => {
    console.error("[audit.mjs]", err);
  })
  .finally(() => process.exit(0));
