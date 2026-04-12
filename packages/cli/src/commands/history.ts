import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import { getDailyBreakdown, disconnect } from "@cursor-consumption/core";
import { formatCost, formatTokens } from "../formatters/table.js";

export const historyCommand = new Command("history")
  .description("Show historical usage data")
  .option("-d, --days <n>", "Number of days to show", "7")
  .option("-m, --model <name>", "Filter by model name")
  .option("-f, --format <fmt>", "Output format: table, json, csv", "table")
  .action(async (opts) => {
    try {
      const days = parseInt(opts.days, 10);
      const rows = await getDailyBreakdown(days, opts.model);

      if (rows.length === 0) {
        console.log(chalk.gray("No data found for the specified period."));
        return;
      }

      if (opts.format === "json") {
        console.log(JSON.stringify(rows, null, 2));
        return;
      }

      if (opts.format === "csv") {
        console.log("date,cost_cents,requests,input_tokens,output_tokens");
        for (const r of rows) {
          console.log(
            `${r.date},${r.totalCostCents.toFixed(2)},${r.requestCount},${r.totalInputTokens},${r.totalOutputTokens}`
          );
        }
        return;
      }

      const table = new Table({
        head: ["Date", "Cost", "Requests", "Input", "Output"],
        style: { head: ["cyan"] },
      });

      for (const r of rows) {
        table.push([
          r.date,
          formatCost(r.totalCostCents),
          String(r.requestCount),
          formatTokens(r.totalInputTokens),
          formatTokens(r.totalOutputTokens),
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
