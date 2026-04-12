import { describe, it, expect } from "vitest";
import { CostCalculator } from "./cost-calculator.js";
import type { PricingEntry } from "./pricing-table.js";
import type { UsageItem } from "../storage/queries.js";

const testPricing: PricingEntry[] = [
  {
    model: "gpt-4o",
    inputPer1M: 250,
    outputPer1M: 1000,
    cacheReadPer1M: 125,
    cacheWritePer1M: 250,
  },
];

function makeItem(overrides: Partial<UsageItem> = {}): UsageItem {
  return {
    timestamp: new Date(),
    model: "gpt-4o",
    feature: "chat",
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    chargedCents: null,
    calculatedCostCents: 0,
    ...overrides,
  };
}

describe("CostCalculator", () => {
  const calc = new CostCalculator(testPricing);

  it("uses chargedCents when available", () => {
    const item = makeItem({ chargedCents: 42 });
    expect(calc.calculate(item)).toBe(42);
  });

  it("calculates cost from token counts", () => {
    const item = makeItem({
      inputTokens: 1_000_000,
      outputTokens: 500_000,
    });
    // (1M * 250 + 500K * 1000) / 1M = 250 + 500 = 750
    expect(calc.calculate(item)).toBe(750);
  });

  it("returns 0 for unknown model", () => {
    const item = makeItem({ model: "unknown-model" });
    expect(calc.calculate(item)).toBe(0);
  });

  it("enrichItems fills calculatedCostCents", () => {
    const items = [makeItem({ inputTokens: 1_000_000 })];
    const enriched = calc.enrichItems(items);
    expect(enriched[0].calculatedCostCents).toBe(250);
  });
});
