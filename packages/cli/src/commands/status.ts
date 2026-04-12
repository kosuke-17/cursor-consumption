import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import {
  getUsageSummary,
  getConfig,
  disconnect,
} from "@cursor-consumption/core";
import { formatTokens, formatCost, renderProgressBar } from "../formatters/table.js";

export const statusCommand = new Command("status")
  .description("Show current usage summary")
  .action(async () => {
    try {
      const planType = (await getConfig("plan_type")) ?? "Pro";
      const planAmountCents = Number(
        (await getConfig("plan_amount_cents")) ?? "2000"
      );

      const now = new Date();
      const billingStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const billingEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const totalDays = billingEnd.getDate();
      const daysElapsed = now.getDate();
      const daysRemaining = totalDays - daysElapsed;

      const summary = await getUsageSummary(billingStart, now);
      const totalCost = summary.totalCostCents;

      const projectedCents =
        daysElapsed > 0
          ? (totalCost / daysElapsed) * totalDays
          : 0;

      const monthName = now.toLocaleString("en", { month: "long" });
      const year = now.getFullYear();

      console.log();
      console.log(
        chalk.bold(`  Cursor Usage - ${monthName} ${year}`)
      );
      console.log(chalk.gray("  " + "─".repeat(45)));
      console.log(
        `  Plan: ${planType} (${formatCost(planAmountCents)}/mo)`
      );
      console.log(
        `  Billing Period: ${billingStart.toLocaleDateString("en", { month: "short", day: "numeric" })} - ${billingEnd.toLocaleDateString("en", { month: "short", day: "numeric" })}`
      );
      console.log(`  Days Remaining: ${daysRemaining}`);
      console.log();
      console.log(
        `  Credits Used:    ${formatCost(totalCost)} / ${formatCost(planAmountCents)}  ${renderProgressBar(totalCost, planAmountCents)}`
      );
      console.log(`  Requests Today:  ${summary.requestCount}`);

      if (summary.models.length > 0) {
        console.log();
        console.log(chalk.bold("  Top Models (Current Period):"));

        const table = new Table({
          head: ["Model", "Reqs", "Cost"],
          style: { head: ["cyan"], "padding-left": 2 },
        });

        for (const m of summary.models.slice(0, 5)) {
          table.push([m.model, String(m.requestCount), formatCost(m.costCents)]);
        }

        console.log(table.toString());
      }

      if (projectedCents > planAmountCents) {
        console.log();
        console.log(
          chalk.yellow(
            `  ⚠ Projected month-end spend: ${formatCost(projectedCents)} (exceeds plan by ${formatCost(projectedCents - planAmountCents)})`
          )
        );
      }

      console.log();
    } catch (error) {
      console.error(
        chalk.red(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      );
      console.error(
        chalk.gray("  Have you run `ccm sync` yet? Is DATABASE_URL set?")
      );
      process.exitCode = 1;
    } finally {
      await disconnect();
    }
  });
