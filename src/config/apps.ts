import { exec } from "child_process";
import { promisify } from "util";
import type { Config } from "./schema.js";

const execAsync = promisify(exec);

// App bundle identifiers
const APPS = {
  elgato: { name: "Elgato Stream Deck", bundle: "com.elgato.StreamDeck" },
  btt: { name: "BetterTouchTool", bundle: "com.hegenberg.BetterTouchTool" },
};

/**
 * Check if an app is running
 */
export async function isAppRunning(bundle: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`pgrep -f "${bundle}"`);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Start an app
 */
export async function startApp(bundle: string): Promise<void> {
  await execAsync(`open -b "${bundle}"`);
}

/**
 * Quit an app gracefully
 */
export async function quitApp(name: string): Promise<void> {
  try {
    await execAsync(`osascript -e 'tell application "${name}" to quit'`);
  } catch {
    /* may not be running */
  }
}

/**
 * Get apps that should be running/stopped for a mode
 */
export function getAppsForMode(mode: Config["mode"]): {
  start: (typeof APPS)[keyof typeof APPS] | null;
  stop: (typeof APPS)[keyof typeof APPS][];
} {
  switch (mode) {
    case "standalone":
      return { start: null, stop: [APPS.elgato] }; // Stop Elgato, we take over USB
    case "elgato":
      return { start: APPS.elgato, stop: [] };
    case "btt":
      return { start: APPS.btt, stop: [] };
  }
}

/**
 * Check current app states for a mode switch
 */
export async function checkModeSwitch(newMode: Config["mode"]): Promise<{
  needsStart: string | null;
  needsStop: string[];
  isStartRunning: boolean;
  areStopRunning: boolean[];
}> {
  const { start, stop } = getAppsForMode(newMode);

  const isStartRunning = start ? await isAppRunning(start.bundle) : true;
  const areStopRunning = await Promise.all(stop.map((s) => isAppRunning(s.bundle)));

  return {
    needsStart: start?.name || null,
    needsStop: stop.map((s) => s.name),
    isStartRunning,
    areStopRunning,
  };
}

/**
 * Execute mode switch - start/stop apps as needed
 */
export async function executeModeSwitch(
  newMode: Config["mode"]
): Promise<{ started: string | null; stopped: string[] }> {
  const { start, stop } = getAppsForMode(newMode);
  const stopped: string[] = [];

  // Stop apps that conflict
  for (const app of stop) {
    if (await isAppRunning(app.bundle)) {
      await quitApp(app.name);
      stopped.push(app.name);
    }
  }

  // Wait for apps to quit
  if (stopped.length > 0) {
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Start required app
  let started: string | null = null;
  if (start && !(await isAppRunning(start.bundle))) {
    await startApp(start.bundle);
    started = start.name;
    await new Promise((r) => setTimeout(r, 2000)); // Wait for app to start
  }

  return { started, stopped };
}
