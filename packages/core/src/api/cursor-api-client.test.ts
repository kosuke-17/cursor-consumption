import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CursorApiClient,
  AuthError,
  RateLimitError,
  ApiError,
} from "./cursor-api-client.js";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
}

describe("CursorApiClient", () => {
  const client = new CursorApiClient("test-token");

  describe("getUsage", () => {
    it("parses usage response", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          items: [
            {
              timestamp: "2026-04-01T00:00:00Z",
              model: "gpt-4o",
              feature: "chat",
              inputTokens: 100,
              outputTokens: 50,
              cacheReadTokens: 0,
              cacheWriteTokens: 0,
              chargedCents: 10,
            },
          ],
          totalSpendCents: 10,
          billingPeriod: {
            start: "2026-04-01T00:00:00Z",
            end: "2026-05-01T00:00:00Z",
          },
        })
      );

      const start = new Date("2026-04-01");
      const end = new Date("2026-04-30");
      const result = await client.getUsage(start, end);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].model).toBe("gpt-4o");
      expect(result.totalSpendCents).toBe(10);
      expect(result.billingPeriod.start).toBeInstanceOf(Date);
    });

    it("sends auth cookie in request", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ items: [], totalSpendCents: 0 })
      );

      await client.getUsage(new Date(), new Date());

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/usage"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Cookie: "WorkosCursorSessionToken=test-token",
          }),
        })
      );
    });
  });

  describe("getAccountInfo", () => {
    it("parses account info", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          email: "test@example.com",
          plan: "pro",
          planAmountCents: 2000,
        })
      );

      const info = await client.getAccountInfo();
      expect(info.email).toBe("test@example.com");
      expect(info.plan).toBe("pro");
      expect(info.planAmountCents).toBe(2000);
    });

    it("uses defaults for missing fields", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      const info = await client.getAccountInfo();
      expect(info.email).toBe("unknown");
      expect(info.plan).toBe("unknown");
      expect(info.planAmountCents).toBe(0);
    });
  });

  describe("error handling", () => {
    it("throws AuthError on 401", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, 401));
      await expect(client.getAccountInfo()).rejects.toThrow(AuthError);
    });

    it("throws RateLimitError on 429 after exhausting retries", async () => {
      vi.useFakeTimers();
      // 4 responses: initial + 3 retries
      for (let i = 0; i < 4; i++) {
        mockFetch.mockResolvedValueOnce(jsonResponse({}, 429));
      }

      let caughtError: unknown;
      const promise = client.getAccountInfo().catch((e) => {
        caughtError = e;
      });

      await vi.runAllTimersAsync();
      await promise;

      expect(caughtError).toBeInstanceOf(RateLimitError);
      vi.useRealTimers();
    });

    it("throws ApiError on other status codes", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, 500));
      await expect(client.getAccountInfo()).rejects.toThrow(ApiError);
    });
  });
});
