import { describe, it, expect } from "vitest";
import { SqliteTokenReader } from "./sqlite-token-reader.js";

describe("SqliteTokenReader", () => {
  it("returns null when db file does not exist", async () => {
    const reader = new SqliteTokenReader("/nonexistent/path/state.vscdb");
    expect(await reader.resolve()).toBeNull();
  });

  it("has correct name", () => {
    const reader = new SqliteTokenReader();
    expect(reader.name).toBe("SqliteTokenReader");
  });
});
