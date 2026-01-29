import streamDeck from "@elgato/streamdeck";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Scripts directory
export const SCRIPTS_DIR =
  "/Users/sauhsoj/src/personal/sauhsoj-streamdecker/wtf.sauhsoj.streamdecker.sdPlugin/scripts";

// Track which terminal app is running kiro-cli
let activeTerminal: string | null = null;

export function setActiveTerminal(app: string | null): void {
  activeTerminal = app;
}

export function getActiveTerminal(): string | null {
  return activeTerminal;
}

// Permission check cache
let iTermPermissionChecked = false;

export async function checkiTermPermission(): Promise<boolean> {
  if (iTermPermissionChecked) return true;
  try {
    const result = await execAsync(`osascript "${SCRIPTS_DIR}/check-iterm-permission.applescript"`);
    if (result.stdout.trim() === "ok") {
      iTermPermissionChecked = true;
      return true;
    }
    streamDeck.logger.warn(`iTerm permission issue: ${result.stdout.trim()}`);
    return false;
  } catch (err) {
    streamDeck.logger.error(`iTerm permission check failed: ${err}`);
    return false;
  }
}

// AppleScript to focus a terminal app
export async function focusTerminal(): Promise<void> {
  const terminals = ["iTerm", "Terminal", "Warp", "WezTerm"];

  for (const app of terminals) {
    try {
      await execAsync(`osascript -e 'tell application "${app}" to activate'`);
      return;
    } catch {
      continue;
    }
  }
}

// Send keystrokes to the frontmost app
export async function sendKeystroke(key: string): Promise<void> {
  await execAsync(`osascript -e 'tell application "System Events" to keystroke "${key}"'`);
}

// Send a command followed by enter
export async function sendCommand(cmd: string): Promise<void> {
  await execAsync(
    `osascript -e 'tell application "System Events" to keystroke "${cmd}"' -e 'tell application "System Events" to keystroke return'`
  );
}
