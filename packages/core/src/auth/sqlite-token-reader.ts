import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir, platform } from "node:os";
import initSqlJs from "sql.js";
import type { TokenResolver } from "./token-resolver.js";

function getCursorDbPath(): string {
  const home = homedir();
  switch (platform()) {
    case "darwin":
      return join(
        home,
        "Library",
        "Application Support",
        "Cursor",
        "User",
        "globalStorage",
        "state.vscdb"
      );
    case "win32":
      return join(
        process.env["APPDATA"] ?? join(home, "AppData", "Roaming"),
        "Cursor",
        "User",
        "globalStorage",
        "state.vscdb"
      );
    default:
      return join(
        home,
        ".config",
        "Cursor",
        "User",
        "globalStorage",
        "state.vscdb"
      );
  }
}

export class SqliteTokenReader implements TokenResolver {
  readonly name = "SqliteTokenReader";

  constructor(private dbPath?: string) {}

  async resolve(): Promise<string | null> {
    try {
      const path = this.dbPath ?? getCursorDbPath();
      const buffer = readFileSync(path);
      const SQL = await initSqlJs();
      const db = new SQL.Database(buffer);

      try {
        const result = db.exec(
          "SELECT value FROM ItemTable WHERE key = 'cursorAuth/accessToken'"
        );
        if (result.length > 0 && result[0].values.length > 0) {
          const value = result[0].values[0][0];
          if (typeof value === "string" && value.length > 0) {
            return value;
          }
        }
        return null;
      } finally {
        db.close();
      }
    } catch {
      return null;
    }
  }
}
