import type { PricingEntry } from "./pricing-table.js";
import type { UsageItem } from "../storage/queries.js";

export class CostCalculator {
  private pricingMap: Map<string, PricingEntry>;

  constructor(pricingTable: PricingEntry[]) {
    this.pricingMap = new Map(pricingTable.map((p) => [p.model, p]));
  }

  calculate(item: UsageItem): number {
    if (item.chargedCents !== null) {
      return item.chargedCents;
    }

    const pricing = this.pricingMap.get(item.model);
    if (!pricing) {
      console.warn(`Unknown model "${item.model}", cost set to 0`);
      return 0;
    }

    return (
      (item.inputTokens * pricing.inputPer1M +
        item.outputTokens * pricing.outputPer1M +
        item.cacheReadTokens * pricing.cacheReadPer1M +
        item.cacheWriteTokens * pricing.cacheWritePer1M) /
      1_000_000
    );
  }

  enrichItems(items: UsageItem[]): UsageItem[] {
    return items.map((item) => ({
      ...item,
      calculatedCostCents: this.calculate(item),
    }));
  }
}
