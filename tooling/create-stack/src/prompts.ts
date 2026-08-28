import { stdin, stdout } from "node:process";
import { createInterface, type Interface } from "node:readline/promises";

/**
 * The scaffolder only prompts when both streams are a TTY. Piped or CI runs
 * fall back to flags and defaults instead of hanging on a question.
 */
export function isInteractive(): boolean {
  return Boolean(stdin.isTTY && stdout.isTTY);
}

export type Choice<TValue> = {
  value: TValue;
  label: string;
  hint?: string;
};

export class Prompter {
  private readonly rl: Interface;

  constructor() {
    this.rl = createInterface({ input: stdin, output: stdout });
    // Without this the process keeps running after the user aborts a question.
    this.rl.on("SIGINT", () => {
      stdout.write("\nAborted.\n");
      process.exit(130);
    });
  }

  close(): void {
    this.rl.close();
  }

  async text(question: string, defaultValue: string): Promise<string> {
    const answer = await this.rl.question(`${question} (${defaultValue}) `);
    return answer.trim() || defaultValue;
  }

  /** Yes/no question; the default is shown in uppercase. */
  async confirm(question: string, defaultValue: boolean): Promise<boolean> {
    const hint = defaultValue ? "Y/n" : "y/N";
    const answer = (await this.rl.question(`${question} (${hint}) `)).trim().toLowerCase();
    if (!answer) return defaultValue;
    return answer === "y" || answer === "yes";
  }

  /** Numbered single choice list; invalid input re-asks instead of guessing. */
  async select<TValue>(
    question: string,
    choices: readonly Choice<TValue>[],
    defaultIndex = 0,
  ): Promise<TValue> {
    stdout.write(`${question}\n`);
    for (const [index, choice] of choices.entries()) {
      const hint = choice.hint ? ` — ${choice.hint}` : "";
      stdout.write(`  ${index + 1}) ${choice.label}${hint}\n`);
    }

    while (true) {
      const answer = (
        await this.rl.question(`Select (1-${choices.length}) [${defaultIndex + 1}] `)
      ).trim();
      const index = answer ? Number.parseInt(answer, 10) - 1 : defaultIndex;
      const choice = choices[index];
      if (choice) return choice.value;
      stdout.write(`Please enter a number between 1 and ${choices.length}.\n`);
    }
  }
}
