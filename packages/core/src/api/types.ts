import { z } from "zod";

export interface UsageItem {
  timestamp: Date;
  model: string;
  feature: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  chargedCents: number | null;
  calculatedCostCents: number;
}

export interface UsageData {
  items: UsageItem[];
  totalSpendCents: number;
  billingPeriod: { start: Date; end: Date };
}

export interface AccountInfo {
  email: string;
  plan: string;
  planAmountCents: number;
}

export const UsageItemSchema = z
  .object({
    timestamp: z.string(),
    model: z.string(),
    feature: z.string().default("unknown"),
    inputTokens: z.number().default(0),
    outputTokens: z.number().default(0),
    cacheReadTokens: z.number().default(0),
    cacheWriteTokens: z.number().default(0),
    chargedCents: z.number().nullable().default(null),
  })
  .passthrough();

export const UsageResponseSchema = z
  .object({
    items: z.array(UsageItemSchema),
    totalSpendCents: z.number().default(0),
    billingPeriod: z
      .object({
        start: z.string(),
        end: z.string(),
      })
      .optional(),
  })
  .passthrough();

export type RawUsageResponse = z.infer<typeof UsageResponseSchema>;
