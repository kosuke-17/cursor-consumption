#!/usr/bin/env node
/**
 * Cursor Hook: append stdin JSON (one event) to audit.json as a JSON array.
 * Always exits 0 so Cursor is never blocked.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stdin } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = join(__dirname, "audit.json");

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

  try {
    let entries = [];
    try {
      const existing = readFileSync(LOG_PATH, "utf8");
      entries = JSON.parse(existing);
    } catch {
      // File doesn't exist or invalid JSON — start fresh
    }
    entries.push(entry);
    writeFileSync(LOG_PATH, JSON.stringify(entries, null, 2) + "\n", "utf8");
  } catch (err) {
    console.error("[audit.mjs] write failed:", err?.message ?? err);
  }

  // Send to API (fire-and-forget, silent failure)
  try {
    await fetch("http://localhost:3000/api/hooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Silent failure — audit.json serves as backup
  }
}

main()
  .catch((err) => {
    console.error("[audit.mjs]", err);
  })
  .finally(() => process.exit(0));
