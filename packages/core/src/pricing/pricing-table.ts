import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

export interface PricingEntry {
  model: string;
  inputPer1M: number;
  outputPer1M: number;
  cacheReadPer1M: number;
  cacheWritePer1M: number;
}

const PricingEntrySchema = z.object({
  model: z.string(),
  inputPer1M: z.number(),
  outputPer1M: z.number(),
  cacheReadPer1M: z.number(),
  cacheWritePer1M: z.number(),
});

const PricingTableSchema = z.array(PricingEntrySchema);

export function loadPricingTable(customPath?: string): PricingEntry[] {
  const defaultPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../pricing/models.json"
  );
  const filePath = customPath ?? defaultPath;
  const raw = readFileSync(filePath, "utf-8");
  return PricingTableSchema.parse(JSON.parse(raw));
}
