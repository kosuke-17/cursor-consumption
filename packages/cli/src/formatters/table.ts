import chalk from "chalk";

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function renderProgressBar(
  current: number,
  max: number,
  width = 20
): string {
  const ratio = Math.min(current / max, 1);
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  const pct = Math.round(ratio * 100);

  const color = ratio > 0.9 ? chalk.red : ratio > 0.7 ? chalk.yellow : chalk.green;
  const bar = color("█".repeat(filled)) + chalk.gray("░".repeat(empty));
  return `[${bar}] ${pct}%`;
}
