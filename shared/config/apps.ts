import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, cpSync, rmSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Config } from "./schema.js";

const execAsync = promisify(exec);

// App bundle identifiers
const APPS = {
  elgato: { name: "Elgato Stream Deck", bundle: "com.elgato.StreamDeck" },
  btt: { name: "BetterTouchTool", bundle: "com.hegenberg.BetterTouchTool" },
};

// Elgato plugin paths
const ELGATO_PLUGINS_DIR = join(
  process.env.HOME || "",
  "Library/Application Support/com.elgato.StreamDeck/Plugins"
);
const PLUGIN_NAME = "wtf.sauhsoj.streamdecker.sdPlugin";

/**
 * Get bundled plugin installer path (.streamDeckPlugin)
 */
function getBundledPluginInstallerPath(): string {
  const execPath = process.execPath;
  if (execPath.includes(".app/Contents/MacOS")) {
    return join(dirname(execPath), "..", "Resources", "wtf.sauhsoj.streamdecker.streamDeckPlugin");
  }
  // Dev mode - generate on the fly or use pre-built
  const __dirname = dirname(fileURLToPath(import.meta.url));
  return join(__dirname, "../..", "wtf.sauhsoj.streamdecker.streamDeckPlugin");
}

/**
 * Get bundled plugin path (for version checking)
 */
function getBundledPluginPath(): string {
  const execPath = process.execPath;
  if (execPath.includes(".app/Contents/MacOS")) {
    return join(dirname(execPath), "..", "Resources", PLUGIN_NAME);
  }
  // Dev mode
  const __dirname = dirname(fileURLToPath(import.meta.url));
  return join(__dirname, "../..", PLUGIN_NAME);
}

/**
 * Get version from a plugin's manifest.json
 */
function getPluginVersion(pluginPath: string): string | null {
  try {
    const manifest = JSON.parse(readFileSync(join(pluginPath, "manifest.json"), "utf-8"));
    return manifest.Version || null;
  } catch {
    return null;
  }
}

/**
 * Check if Elgato plugin is installed and up to date
 */
export function getPluginStatus(): { installed: boolean; currentVersion: string | null; bundledVersion: string | null; needsUpdate: boolean } {
  const installedPath = join(ELGATO_PLUGINS_DIR, PLUGIN_NAME);
  const bundledPath = getBundledPluginPath();
  
  const installed = existsSync(installedPath);
  const currentVersion = installed ? getPluginVersion(installedPath) : null;
  const bundledVersion = getPluginVersion(bundledPath);
  const needsUpdate = !installed || currentVersion !== bundledVersion;
  
  return { installed, currentVersion, bundledVersion, needsUpdate };
}

/**
 * Check if Elgato plugin is installed
 */
export function isPluginInstalled(): boolean {
  return existsSync(join(ELGATO_PLUGINS_DIR, PLUGIN_NAME));
}

/**
 * Install Elgato plugin via official .streamDeckPlugin installer
 */
export async function installPlugin(): Promise<{ installed: boolean; version: string | null }> {
  const installerPath = getBundledPluginInstallerPath();
  const pluginPath = getBundledPluginPath();

  if (!existsSync(installerPath)) {
    // Fallback: copy plugin folder directly (dev mode)
    if (existsSync(pluginPath)) {
      const dest = join(ELGATO_PLUGINS_DIR, PLUGIN_NAME);
      if (existsSync(dest)) {
        rmSync(dest, { recursive: true, force: true });
      }
      cpSync(pluginPath, dest, { recursive: true });
      const version = getPluginVersion(dest);
      console.log(`[Apps] Plugin ${version} installed (direct copy)`);
      return { installed: true, version };
    }
    console.error(`[Apps] Plugin installer not found: ${installerPath}`);
    return { installed: false, version: null };
  }

  // Use official installer - opens Elgato Stream Deck app which handles installation
  console.log(`[Apps] Installing plugin via: ${installerPath}`);
  await execAsync(`open "${installerPath}"`);
  
  // Wait for installation to complete
  await new Promise((r) => setTimeout(r, 3000));
  
  const version = getPluginVersion(join(ELGATO_PLUGINS_DIR, PLUGIN_NAME));
  return { installed: true, version };
}

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
  needsPluginInstall: boolean;
  pluginStatus: { currentVersion: string | null; bundledVersion: string | null } | null;
}> {
  const { start, stop } = getAppsForMode(newMode);

  const isStartRunning = start ? await isAppRunning(start.bundle) : true;
  const areStopRunning = await Promise.all(stop.map((s) => isAppRunning(s.bundle)));
  
  let needsPluginInstall = false;
  let pluginStatus = null;
  if (newMode === "elgato") {
    const status = getPluginStatus();
    needsPluginInstall = status.needsUpdate;
    pluginStatus = { currentVersion: status.currentVersion, bundledVersion: status.bundledVersion };
  }

  return {
    needsStart: start?.name || null,
    needsStop: stop.map((s) => s.name),
    isStartRunning,
    areStopRunning,
    needsPluginInstall,
    pluginStatus,
  };
}

/**
 * Execute mode switch - start/stop apps as needed
 */
export async function executeModeSwitch(
  newMode: Config["mode"]
): Promise<{ started: string | null; stopped: string[]; pluginInstalled: boolean; pluginVersion: string | null }> {
  const { start, stop } = getAppsForMode(newMode);
  const stopped: string[] = [];
  let pluginInstalled = false;
  let pluginVersion: string | null = null;

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

  // Install/update plugin if switching to elgato mode
  if (newMode === "elgato") {
    const status = getPluginStatus();
    if (status.needsUpdate) {
      const result = await installPlugin();
      pluginInstalled = result.installed;
      pluginVersion = result.version;
    }
  }

  // Start required app
  let started: string | null = null;
  if (start && !(await isAppRunning(start.bundle))) {
    await startApp(start.bundle);
    started = start.name;
    await new Promise((r) => setTimeout(r, 2000)); // Wait for app to start
  }

  return { started, stopped, pluginInstalled, pluginVersion };
}
