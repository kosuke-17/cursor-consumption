import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { EnvTokenReader } from "./env-token-reader.js";

describe("EnvTokenReader", () => {
  const reader = new EnvTokenReader();
  let original: string | undefined;

  beforeEach(() => {
    original = process.env["CURSOR_SESSION_TOKEN"];
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env["CURSOR_SESSION_TOKEN"];
    } else {
      process.env["CURSOR_SESSION_TOKEN"] = original;
    }
  });

  it("returns token when env var is set", async () => {
    process.env["CURSOR_SESSION_TOKEN"] = "test-token-123";
    expect(await reader.resolve()).toBe("test-token-123");
  });

  it("returns null when env var is not set", async () => {
    delete process.env["CURSOR_SESSION_TOKEN"];
    expect(await reader.resolve()).toBeNull();
  });

  it("returns null when env var is empty string", async () => {
    process.env["CURSOR_SESSION_TOKEN"] = "";
    expect(await reader.resolve()).toBeNull();
  });

  it("has correct name", () => {
    expect(reader.name).toBe("EnvTokenReader");
  });
});
