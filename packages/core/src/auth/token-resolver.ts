export interface TokenResolver {
  readonly name: string;
  resolve(): Promise<string | null>;
}

export class TokenResolverChain {
  constructor(private resolvers: TokenResolver[]) {}

  async resolve(): Promise<string> {
    for (const resolver of this.resolvers) {
      const token = await resolver.resolve();
      if (token) {
        return token;
      }
    }
    throw new Error(
      "No valid session token found. Tried: " +
        this.resolvers.map((r) => r.name).join(", ")
    );
  }
}
