import { UsageResponseSchema } from "./types.js";
import type { UsageData, UsageItem, AccountInfo } from "./types.js";

const BASE_URL = "https://api2.cursor.sh";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export class AuthError extends Error {
  constructor(message = "Authentication failed (401)") {
    super(message);
    this.name = "AuthError";
  }
}

export class RateLimitError extends Error {
  constructor(message = "Rate limited (429)") {
    super(message);
    this.name = "RateLimitError";
  }
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message?: string
  ) {
    super(message ?? `API error (${statusCode})`);
    this.name = "ApiError";
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class CursorApiClient {
  constructor(private token: string) {}

  private async fetchWithRetry(
    url: string,
    init?: RequestInit
  ): Promise<Response> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          Cookie: `WorkosCursorSessionToken=${this.token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) return response;

      if (response.status === 401) {
        throw new AuthError();
      }

      if (response.status === 429 && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
        lastError = new RateLimitError();
        continue;
      }

      if (response.status === 429) {
        throw new RateLimitError();
      }

      throw new ApiError(response.status, await response.text());
    }

    throw lastError ?? new Error("Unexpected fetch failure");
  }

  async getUsage(startDate: Date, endDate: Date): Promise<UsageData> {
    const url = new URL("/api/usage", BASE_URL);
    url.searchParams.set("startDate", startDate.toISOString());
    url.searchParams.set("endDate", endDate.toISOString());

    const response = await this.fetchWithRetry(url.toString());
    const json: unknown = await response.json();
    const parsed = UsageResponseSchema.parse(json);

    const now = new Date();
    const billingStart = parsed.billingPeriod
      ? new Date(parsed.billingPeriod.start)
      : startDate;
    const billingEnd = parsed.billingPeriod
      ? new Date(parsed.billingPeriod.end)
      : endDate;

    const items: UsageItem[] = parsed.items.map((item) => ({
      timestamp: new Date(item.timestamp),
      model: item.model,
      feature: item.feature,
      inputTokens: item.inputTokens,
      outputTokens: item.outputTokens,
      cacheReadTokens: item.cacheReadTokens,
      cacheWriteTokens: item.cacheWriteTokens,
      chargedCents: item.chargedCents,
      calculatedCostCents: 0, // will be filled by CostCalculator
    }));

    return {
      items,
      totalSpendCents: parsed.totalSpendCents,
      billingPeriod: { start: billingStart, end: billingEnd },
    };
  }

  async getAccountInfo(): Promise<AccountInfo> {
    const response = await this.fetchWithRetry(
      `${BASE_URL}/api/auth/stripe`
    );
    const json = (await response.json()) as Record<string, unknown>;

    return {
      email: (json["email"] as string) ?? "unknown",
      plan: (json["plan"] as string) ?? "unknown",
      planAmountCents: (json["planAmountCents"] as number) ?? 0,
    };
  }
}
