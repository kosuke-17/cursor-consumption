#!/usr/bin/env node

import { Command } from "commander";
import { syncCommand } from "./commands/sync.js";
import { statusCommand } from "./commands/status.js";
import { historyCommand } from "./commands/history.js";
import { modelsCommand } from "./commands/models.js";
import { configCommand } from "./commands/config.js";

const program = new Command();

program
  .name("ccm")
  .description("Cursor Consumption Monitor - Track your Cursor AI token usage and costs")
  .version("0.0.1");

program.addCommand(syncCommand);
program.addCommand(statusCommand);
program.addCommand(historyCommand);
program.addCommand(modelsCommand);
program.addCommand(configCommand);

program.parseAsync(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
});
