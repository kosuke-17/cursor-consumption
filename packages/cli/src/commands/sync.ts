import { Command } from "commander";
import ora from "ora";
import {
  TokenResolverChain,
  SqliteTokenReader,
  EnvTokenReader,
  CursorApiClient,
  CostCalculator,
  loadPricingTable,
  saveUsageEvents,
  upsertDailySummaries,
  saveSyncLog,
  disconnect,
} from "@cursor-consumption/core";

export const syncCommand = new Command("sync")
  .description("Fetch latest usage data from Cursor API and save to database")
  .action(async () => {
    const spinner = ora("Resolving session token...").start();

    try {
      const chain = new TokenResolverChain([
        new SqliteTokenReader(),
        new EnvTokenReader(),
      ]);
      const token = await chain.resolve();
      spinner.text = "Fetching usage data from Cursor API...";

      const client = new CursorApiClient(token);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const usage = await client.getUsage(startOfMonth, now);

      spinner.text = "Calculating costs...";
      const pricingTable = loadPricingTable();
      const calculator = new CostCalculator(pricingTable);
      const enrichedItems = calculator.enrichItems(usage.items);

      spinner.text = "Saving to database...";
      const savedCount = await saveUsageEvents(enrichedItems);
      await upsertDailySummaries(enrichedItems);
      await saveSyncLog("success", savedCount);

      spinner.succeed(
        `Synced ${savedCount} new events (${usage.items.length} total from API)`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      await saveSyncLog("error", 0, message).catch(() => {});
      spinner.fail(`Sync failed: ${message}`);
      process.exitCode = 1;
    } finally {
      await disconnect();
    }
  });
