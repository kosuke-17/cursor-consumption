import { describe, it, expect } from "vitest";
import { loadPricingTable } from "./pricing-table";
import { resolve } from "node:path";

const PRICING_PATH = resolve(
  import.meta.dirname,
  "../../../pricing/models.json"
);

describe("loadPricingTable", () => {
  it("loads default pricing table", () => {
    const table = loadPricingTable(PRICING_PATH);
    expect(table.length).toBeGreaterThan(0);
  });

  it("each entry has required fields", () => {
    const table = loadPricingTable(PRICING_PATH);
    for (const entry of table) {
      expect(entry).toHaveProperty("model");
      expect(entry).toHaveProperty("inputPer1M");
      expect(entry).toHaveProperty("outputPer1M");
      expect(entry).toHaveProperty("cacheReadPer1M");
      expect(entry).toHaveProperty("cacheWritePer1M");
      expect(typeof entry.model).toBe("string");
      expect(typeof entry.inputPer1M).toBe("number");
    }
  });

  it("throws on invalid path", () => {
    expect(() => loadPricingTable("/nonexistent/file.json")).toThrow();
  });
});
