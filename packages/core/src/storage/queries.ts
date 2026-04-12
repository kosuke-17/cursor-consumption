import { getPrisma } from "./prisma.js";

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

export async function saveUsageEvents(events: UsageItem[]): Promise<number> {
  const prisma = getPrisma();
  const result = await prisma.usageEvent.createMany({
    data: events.map((e) => ({
      timestamp: e.timestamp,
      model: e.model,
      feature: e.feature,
      inputTokens: e.inputTokens,
      outputTokens: e.outputTokens,
      cacheReadTokens: e.cacheReadTokens,
      cacheWriteTokens: e.cacheWriteTokens,
      chargedCents: e.chargedCents,
      calculatedCostCents: e.calculatedCostCents,
      syncedAt: new Date(),
    })),
    skipDuplicates: true,
  });
  return result.count;
}

export async function getUsageSummary(
  billingStart: Date,
  billingEnd: Date
): Promise<{
  totalCostCents: number;
  requestCount: number;
  models: { model: string; costCents: number; requestCount: number }[];
}> {
  const prisma = getPrisma();
  const events = await prisma.usageEvent.groupBy({
    by: ["model"],
    where: { timestamp: { gte: billingStart, lte: billingEnd } },
    _sum: { calculatedCostCents: true },
    _count: true,
  });

  const models = events.map((e) => ({
    model: e.model,
    costCents: e._sum.calculatedCostCents ?? 0,
    requestCount: e._count,
  }));

  return {
    totalCostCents: models.reduce((sum, m) => sum + m.costCents, 0),
    requestCount: models.reduce((sum, m) => sum + m.requestCount, 0),
    models: models.sort((a, b) => b.costCents - a.costCents),
  };
}

export async function getDailyBreakdown(
  days: number,
  modelFilter?: string
): Promise<
  {
    date: string;
    totalCostCents: number;
    requestCount: number;
    totalInputTokens: number;
    totalOutputTokens: number;
  }[]
> {
  const prisma = getPrisma();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: Record<string, unknown> = {
    date: { gte: since },
  };
  if (modelFilter) {
    where["model"] = modelFilter;
  }

  const rows = await prisma.dailySummary.groupBy({
    by: ["date"],
    where,
    _sum: {
      totalCostCents: true,
      requestCount: true,
      totalInputTokens: true,
      totalOutputTokens: true,
    },
    orderBy: { date: "asc" },
  });

  return rows.map((r) => ({
    date: r.date.toISOString().split("T")[0],
    totalCostCents: r._sum.totalCostCents ?? 0,
    requestCount: r._sum.requestCount ?? 0,
    totalInputTokens: r._sum.totalInputTokens ?? 0,
    totalOutputTokens: r._sum.totalOutputTokens ?? 0,
  }));
}

export async function getModelBreakdown(
  days: number
): Promise<
  {
    model: string;
    costCents: number;
    requestCount: number;
    inputTokens: number;
    outputTokens: number;
  }[]
> {
  const prisma = getPrisma();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await prisma.usageEvent.groupBy({
    by: ["model"],
    where: { timestamp: { gte: since } },
    _sum: {
      calculatedCostCents: true,
      inputTokens: true,
      outputTokens: true,
    },
    _count: true,
  });

  return rows
    .map((r) => ({
      model: r.model,
      costCents: r._sum.calculatedCostCents ?? 0,
      requestCount: r._count,
      inputTokens: r._sum.inputTokens ?? 0,
      outputTokens: r._sum.outputTokens ?? 0,
    }))
    .sort((a, b) => b.costCents - a.costCents);
}

export async function upsertDailySummaries(
  events: UsageItem[]
): Promise<void> {
  const prisma = getPrisma();
  const grouped = new Map<
    string,
    {
      date: Date;
      model: string;
      feature: string;
      inputTokens: number;
      outputTokens: number;
      costCents: number;
      count: number;
    }
  >();

  for (const e of events) {
    const dateStr = e.timestamp.toISOString().split("T")[0];
    const key = `${dateStr}:${e.model}:${e.feature}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.inputTokens += e.inputTokens;
      existing.outputTokens += e.outputTokens;
      existing.costCents += e.calculatedCostCents;
      existing.count += 1;
    } else {
      grouped.set(key, {
        date: new Date(dateStr),
        model: e.model,
        feature: e.feature,
        inputTokens: e.inputTokens,
        outputTokens: e.outputTokens,
        costCents: e.calculatedCostCents,
        count: 1,
      });
    }
  }

  for (const entry of grouped.values()) {
    await prisma.dailySummary.upsert({
      where: {
        date_model_feature: {
          date: entry.date,
          model: entry.model,
          feature: entry.feature,
        },
      },
      create: {
        date: entry.date,
        model: entry.model,
        feature: entry.feature,
        totalInputTokens: entry.inputTokens,
        totalOutputTokens: entry.outputTokens,
        totalCostCents: entry.costCents,
        requestCount: entry.count,
      },
      update: {
        totalInputTokens: { increment: entry.inputTokens },
        totalOutputTokens: { increment: entry.outputTokens },
        totalCostCents: { increment: entry.costCents },
        requestCount: { increment: entry.count },
      },
    });
  }
}

export async function getConfig(key: string): Promise<string | null> {
  const prisma = getPrisma();
  const row = await prisma.config.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setConfig(key: string, value: string): Promise<void> {
  const prisma = getPrisma();
  await prisma.config.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function listConfig(): Promise<{ key: string; value: string }[]> {
  const prisma = getPrisma();
  return prisma.config.findMany({ orderBy: { key: "asc" } });
}
