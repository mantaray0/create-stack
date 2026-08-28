import { spawnSync } from "node:child_process";

export type StepResult = {
  ok: boolean;
  /** Present when the step failed, so the caller can print a hint instead of a stack. */
  reason?: string;
};

function run(command: string, args: string[], cwd: string): StepResult {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });

  if (result.error) {
    const code = (result.error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return { ok: false, reason: `"${command}" is not installed` };
    return { ok: false, reason: result.error.message };
  }
  if (result.status !== 0) {
    return {
      ok: false,
      reason: `"${command} ${args.join(" ")}" exited with code ${result.status}`,
    };
  }
  return { ok: true };
}

/** Cheap availability probe that never inherits stdio, so it stays silent. */
export function commandExists(command: string): boolean {
  const result = spawnSync(command, ["--version"], { stdio: "ignore" });
  return !result.error && result.status === 0;
}

export function installDependencies(targetDir: string): StepResult {
  return run("bun", ["install"], targetDir);
}

/** Initialise a repository and record the generated state as the first commit. */
export function initGitRepository(targetDir: string): StepResult {
  const init = run("git", ["init", "-b", "main"], targetDir);
  if (!init.ok) return init;

  const add = run("git", ["add", "-A"], targetDir);
  if (!add.ok) return add;

  const commit = run(
    "git",
    ["commit", "-m", "chore: scaffold project from the create-stack boilerplate"],
    targetDir,
  );
  if (!commit.ok) {
    return {
      ok: false,
      reason: `${commit.reason} — the repository exists, only the first commit is missing (check your git user.name / user.email)`,
    };
  }
  return { ok: true };
}
