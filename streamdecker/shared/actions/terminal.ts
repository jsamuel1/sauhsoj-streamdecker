import { exec } from "child_process";
import { promisify } from "util";
import { getConfig } from "../config/loader.js";
import { getScriptsDir } from "../config/paths.js";

const execAsync = promisify(exec);

// Terminal apps we support
const TERMINALS = ["iTerm", "Terminal", "Warp", "WezTerm"] as const;
type TerminalApp = (typeof TERMINALS)[number];

/**
 * Detect which terminal is running kiro-cli
 */
export async function detectTerminal(): Promise<TerminalApp | null> {
  const config = getConfig();
  if (config.terminal.app !== "auto") {
    return config.terminal.app as TerminalApp;
  }

  for (const app of TERMINALS) {
    try {
      const { stdout } = await execAsync(`pgrep -x "${app}"`);
      if (stdout.trim()) return app;
    } catch {
      /* not running */
    }
  }
  return null;
}

/**
 * Run AppleScript and return result
 */
export async function runAppleScript(script: string): Promise<string> {
  const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
  return stdout.trim();
}

/**
 * Focus a terminal app
 */
export async function focusApp(app: string): Promise<void> {
  await runAppleScript(`tell application "${app}" to activate`);
}

/**
 * Send keystroke to frontmost app
 */
export async function sendKeystroke(key: string): Promise<void> {
  await runAppleScript(`tell application "System Events" to keystroke "${key}"`);
}

/**
 * Send command followed by return
 */
export async function sendCommand(cmd: string): Promise<void> {
  await runAppleScript(`
    tell application "System Events"
      keystroke "${cmd}"
      keystroke return
    end tell
  `);
}

/**
 * Run an AppleScript file
 */
export async function runAppleScriptFile(filename: string): Promise<string> {
  const scriptsDir = getScriptsDir();
  const { stdout } = await execAsync(`osascript "${scriptsDir}/${filename}"`);
  return stdout.trim();
}
