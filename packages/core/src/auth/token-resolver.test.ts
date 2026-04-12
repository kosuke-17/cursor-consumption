import { describe, it, expect } from "vitest";
import { TokenResolverChain } from "./token-resolver.js";
import type { TokenResolver } from "./token-resolver.js";

function mockResolver(name: string, value: string | null): TokenResolver {
  return { name, resolve: async () => value };
}

describe("TokenResolverChain", () => {
  it("returns first non-null token", async () => {
    const chain = new TokenResolverChain([
      mockResolver("a", null),
      mockResolver("b", "token-b"),
      mockResolver("c", "token-c"),
    ]);
    expect(await chain.resolve()).toBe("token-b");
  });

  it("throws when all resolvers return null", async () => {
    const chain = new TokenResolverChain([
      mockResolver("a", null),
      mockResolver("b", null),
    ]);
    await expect(chain.resolve()).rejects.toThrow("No valid session token found");
  });

  it("returns token from first resolver if available", async () => {
    const chain = new TokenResolverChain([
      mockResolver("a", "token-a"),
    ]);
    expect(await chain.resolve()).toBe("token-a");
  });
});
