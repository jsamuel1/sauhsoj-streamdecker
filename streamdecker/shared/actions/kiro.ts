import { getTerminalBackend } from "../terminal/factory.js";
import { getConfig, addRecentAgent } from "../config/loader.js";
import { KIRO_AGENTS_DIR, getScriptsDir } from "../config/paths.js";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Find and focus the terminal tab running kiro-cli.
 */
export async function focusKiro(): Promise<boolean> {
  const backend = await getTerminalBackend();
  return (await backend.focus()) === "ok";
}

/**
 * Cycle to the next kiro-cli tab/surface.
 */
export async function cycleKiroTabs(): Promise<void> {
  await (await getTerminalBackend()).cycleTab();
}

/**
 * Jump to the next tab/surface needing attention.
 */
export async function alertIdleKiro(): Promise<void> {
  await (await getTerminalBackend()).nextAlertTab();
}

export async function sendYes(): Promise<void> {
  await (await getTerminalBackend()).send("y");
}

export async function sendNo(): Promise<void> {
  await (await getTerminalBackend()).send("n");
}

export async function sendTrust(): Promise<void> {
  await (await getTerminalBackend()).send("t");
}

export async function switchAgent(name: string): Promise<void> {
  await (await getTerminalBackend()).send(`/agent switch ${name}`);
  addRecentAgent(name);
}

/**
 * Get list of available agents.
 */
export function getAgentList(): string[] {
  const config = getConfig();
  try {
    const files = readdirSync(KIRO_AGENTS_DIR).filter(
      (f) => f.endsWith(".json") && !f.endsWith(".bak")
    );
    const agents: string[] = [];
    for (const file of files) {
      try {
        const data = JSON.parse(readFileSync(join(KIRO_AGENTS_DIR, file), "utf-8"));
        if (data.name) agents.push(data.name);
      } catch {
        /* skip invalid */
      }
    }
    return agents.length > 0 ? agents : config.agents.favorites;
  } catch {
    return config.agents.favorites;
  }
}

export async function launchKiro(): Promise<void> {
  await (await getTerminalBackend()).openTab("kiro-cli chat");
}

/**
 * Launch kiro-cli with folder picker.
 */
export async function launchKiroWithPicker(): Promise<void> {
  const pickerScript = join(getScriptsDir(), "launch-kiro-picker.sh");
  await (await getTerminalBackend()).openTab(pickerScript);
}

/**
 * Launch kiro-cli in a specific folder.
 */
export async function launchKiroInFolder(folder: string): Promise<void> {
  await (await getTerminalBackend()).openTab(`cd "${folder}" && kiro-cli chat`);
}
