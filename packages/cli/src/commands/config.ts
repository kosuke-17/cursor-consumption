import { Command } from "commander";
import chalk from "chalk";
import { getConfig, setConfig, listConfig, disconnect } from "@cursor-consumption/core";

export const configCommand = new Command("config").description(
  "Manage configuration"
);

configCommand
  .command("set <key> <value>")
  .description("Set a config value")
  .action(async (key: string, value: string) => {
    try {
      await setConfig(key, value);
      console.log(chalk.green(`Set ${key} = ${value}`));
    } catch (error) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
      process.exitCode = 1;
    } finally {
      await disconnect();
    }
  });

configCommand
  .command("get <key>")
  .description("Get a config value")
  .action(async (key: string) => {
    try {
      const value = await getConfig(key);
      if (value === null) {
        console.log(chalk.gray(`${key} is not set`));
      } else {
        console.log(`${key} = ${value}`);
      }
    } catch (error) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
      process.exitCode = 1;
    } finally {
      await disconnect();
    }
  });

configCommand
  .command("list")
  .description("List all config values")
  .action(async () => {
    try {
      const configs = await listConfig();
      if (configs.length === 0) {
        console.log(chalk.gray("No configuration set."));
        return;
      }
      for (const c of configs) {
        console.log(`${c.key} = ${c.value}`);
      }
    } catch (error) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
      process.exitCode = 1;
    } finally {
      await disconnect();
    }
  });
