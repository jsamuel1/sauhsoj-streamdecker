import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Track which terminal app is running kiro-cli
let activeTerminal: string | null = null;

export function setActiveTerminal(app: string | null): void {
  activeTerminal = app;
}

export function getActiveTerminal(): string | null {
  return activeTerminal;
}

// AppleScript to focus a terminal app
export async function focusTerminal(): Promise<void> {
  const terminals = [
    "iTerm",
    "Terminal",
    "Warp",
    "WezTerm",
  ];

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
  await execAsync(
    `osascript -e 'tell application "System Events" to keystroke "${key}"'`
  );
}

// Send a command followed by enter
export async function sendCommand(cmd: string): Promise<void> {
  await execAsync(
    `osascript -e 'tell application "System Events" to keystroke "${cmd}"' -e 'tell application "System Events" to keystroke return'`
  );
}
