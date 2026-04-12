import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import { getModelBreakdown, disconnect } from "@cursor-consumption/core";
import { formatCost, formatTokens } from "../formatters/table.js";

export const modelsCommand = new Command("models")
  .description("Show model-by-model usage breakdown")
  .option("-d, --days <n>", "Number of days to show", "30")
  .action(async (opts) => {
    try {
      const days = parseInt(opts.days, 10);
      const rows = await getModelBreakdown(days);

      if (rows.length === 0) {
        console.log(chalk.gray("No data found."));
        return;
      }

      const totalCost = rows.reduce((s, r) => s + r.costCents, 0);

      const table = new Table({
        head: ["Model", "Reqs", "Input", "Output", "Cost", "% Total"],
        style: { head: ["cyan"] },
      });

      for (const r of rows) {
        const pct = totalCost > 0 ? ((r.costCents / totalCost) * 100).toFixed(1) : "0.0";
        table.push([
          r.model,
          String(r.requestCount),
          formatTokens(r.inputTokens),
          formatTokens(r.outputTokens),
          formatCost(r.costCents),
          `${pct}%`,
        ]);
      }

      console.log(table.toString());
    } catch (error) {
      console.error(
        chalk.red(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      );
      process.exitCode = 1;
    } finally {
      await disconnect();
    }
  });
