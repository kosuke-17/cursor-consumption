import { describe, it, expect } from "vitest";
import { formatTokens, formatCost, renderProgressBar } from "./table.js";

describe("formatTokens", () => {
  it("formats millions", () => {
    expect(formatTokens(1_500_000)).toBe("1.5M");
  });

  it("formats thousands", () => {
    expect(formatTokens(2_500)).toBe("2.5K");
  });

  it("formats small numbers as-is", () => {
    expect(formatTokens(42)).toBe("42");
  });

  it("formats exactly 1M", () => {
    expect(formatTokens(1_000_000)).toBe("1.0M");
  });

  it("formats exactly 1K", () => {
    expect(formatTokens(1_000)).toBe("1.0K");
  });
});

describe("formatCost", () => {
  it("converts cents to dollars", () => {
    expect(formatCost(1050)).toBe("$10.50");
  });

  it("handles zero", () => {
    expect(formatCost(0)).toBe("$0.00");
  });

  it("handles fractional cents", () => {
    expect(formatCost(99)).toBe("$0.99");
  });
});

describe("renderProgressBar", () => {
  it("shows 0% for zero usage", () => {
    const bar = renderProgressBar(0, 100);
    expect(bar).toContain("0%");
  });

  it("shows 100% when at max", () => {
    const bar = renderProgressBar(100, 100);
    expect(bar).toContain("100%");
  });

  it("caps at 100% when over max", () => {
    const bar = renderProgressBar(150, 100);
    expect(bar).toContain("100%");
  });

  it("shows correct percentage", () => {
    const bar = renderProgressBar(50, 100);
    expect(bar).toContain("50%");
  });
});
