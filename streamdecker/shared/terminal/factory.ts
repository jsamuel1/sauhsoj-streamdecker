import { execFile } from "child_process";
import { promisify } from "util";
import type { TerminalBackend, BackendName } from "./types.js";
import { CmuxBackend } from "./cmux-backend.js";
import { AppleScriptBackend } from "./applescript-backend.js";
import { getConfig } from "../config/loader.js";

const execFileAsync = promisify(execFile);

const APPLESCRIPT_TERMINALS: Exclude<BackendName, "cmux">[] = [
  "iTerm",
  "Terminal",
  "Warp",
  "WezTerm",
];

export interface BackendProbe {
  cmuxRunning: boolean;
  cmuxOnPath: boolean;
  running: BackendName[];
}

/** Pure selection logic: given the configured app and runtime probe, pick a backend name. */
export function resolveBackendName(app: string, probe: BackendProbe): BackendName {
  if (app !== "auto") return app as BackendName;
  if (probe.cmuxRunning && probe.cmuxOnPath) return "cmux";
  for (const term of APPLESCRIPT_TERMINALS) {
    if (probe.running.includes(term)) return term;
  }
  return "iTerm";
}

async function isRunning(proc: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync("pgrep", ["-x", proc]);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function isCmuxOnPath(): Promise<boolean> {
  try {
    await execFileAsync("which", ["cmux"]);
    return true;
  } catch {
    return false;
  }
}

async function buildProbe(): Promise<BackendProbe> {
  const [cmuxRunning, cmuxOnPath, ...rest] = await Promise.all([
    isRunning("cmux"),
    isCmuxOnPath(),
    ...APPLESCRIPT_TERMINALS.map((t) => isRunning(t)),
  ]);
  const running = APPLESCRIPT_TERMINALS.filter((_, i) => rest[i]);
  return { cmuxRunning, cmuxOnPath, running };
}

let cached: TerminalBackend | null = null;

export async function getTerminalBackend(): Promise<TerminalBackend> {
  if (cached) return cached;
  const config = getConfig();
  const name = resolveBackendName(config.terminal.app, await buildProbe());
  cached =
    name === "cmux"
      ? new CmuxBackend()
      : new AppleScriptBackend(name, config.terminal.detectCommand);
  return cached;
}

/** Reset the cached backend (used by tests and after config changes). */
export function resetBackendCache(): void {
  cached = null;
}
