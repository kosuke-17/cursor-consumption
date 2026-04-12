import type { TokenResolver } from "./token-resolver.js";

export class EnvTokenReader implements TokenResolver {
  readonly name = "EnvTokenReader";

  async resolve(): Promise<string | null> {
    const token = process.env["CURSOR_SESSION_TOKEN"];
    return token && token.length > 0 ? token : null;
  }
}
