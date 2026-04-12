import { createInterface } from "node:readline";
import type { TokenResolver } from "./token-resolver.js";

export class ManualTokenInput implements TokenResolver {
  readonly name = "ManualTokenInput";

  async resolve(): Promise<string | null> {
    if (!process.stdin.isTTY) {
      return null;
    }

    const rl = createInterface({
      input: process.stdin,
      output: process.stderr,
    });

    return new Promise((resolve) => {
      rl.question(
        "Enter Cursor session token (from cursor.com/settings cookie): ",
        (answer) => {
          rl.close();
          const trimmed = answer.trim();
          resolve(trimmed.length > 0 ? trimmed : null);
        }
      );
    });
  }
}
