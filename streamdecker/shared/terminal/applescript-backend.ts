import { exec } from "child_process";
import { promisify } from "util";
import type { TerminalBackend, FocusResult, BackendName, AppleScriptRunner } from "./types.js";

const execAsync = promisify(exec);

/** Default runner: execute an AppleScript source string via osascript. */
const defaultRunner: AppleScriptRunner = async (script) => {
  const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
  return stdout.trim();
};

/** Drives GUI terminals (iTerm/Terminal/Warp/WezTerm) via AppleScript. */
export class AppleScriptBackend implements TerminalBackend {
  readonly name: BackendName;
  private cmd: string;
  private run: AppleScriptRunner;

  constructor(
    app: Exclude<BackendName, "cmux">,
    detectCommand: string,
    runner: AppleScriptRunner = defaultRunner
  ) {
    this.name = app;
    this.cmd = detectCommand;
    this.run = runner;
  }

  async checkPermission(): Promise<boolean> {
    try {
      await this.run(`tell application "System Events" to get name of first process`);
      return true;
    } catch {
      return false;
    }
  }

  async focus(): Promise<FocusResult> {
    const result = await this.run(`
      tell application "${this.name}"
        activate
        repeat with w in windows
          repeat with t in tabs of w
            set s to current session of t
            set theTty to tty of s
            set hasKiro to (do shell script "ps -t " & theTty & " -o command= | grep -q ${this.cmd} && echo yes || echo no")
            if hasKiro is "yes" then
              select t
              return "found"
            end if
          end repeat
        end repeat
      end tell
      return "none"
    `);
    return result === "found" ? "ok" : "none";
  }

  async cycleTab(): Promise<FocusResult> {
    await this.run(`tell application "${this.name}" to activate`);
    await this.run(`
      tell application "${this.name}"
        tell current window
          set n to count of tabs
          set c to 0
          repeat with i from 1 to n
            if tab i is current tab then set c to i
          end repeat
          repeat with i from 1 to n - 1
            set idx to ((c + i - 1) mod n) + 1
            set s to current session of tab idx
            set theTty to tty of s
            set hasKiro to (do shell script "ps -t " & theTty & " -o command= | grep -q ${this.cmd} && echo yes || echo no")
            if hasKiro is "yes" then
              select tab idx
              return
            end if
          end repeat
        end tell
      end tell
    `);
    return "ok";
  }

  async nextAlertTab(): Promise<FocusResult> {
    await this.run(`
      tell application "${this.name}"
        activate
        tell current window
          set n to count of tabs
          set c to 0
          repeat with i from 1 to n
            if tab i is current tab then set c to i
          end repeat
          repeat with i from 1 to n - 1
            set idx to ((c + i - 1) mod n) + 1
            set s to current session of tab idx
            set theTty to tty of s
            set hasKiro to (do shell script "ps -t " & theTty & " -o command= | grep -q ${this.cmd} && echo yes || echo no")
            if hasKiro is "yes" and is processing of s is false then
              select tab idx
              return
            end if
          end repeat
        end tell
      end tell
    `);
    return "ok";
  }

  async openTab(command: string): Promise<void> {
    const inner = `/bin/zsh -lic '${command.replace(/'/g, "'\\''")}'`;
    const escaped = inner.replace(/"/g, '\\"');
    await this.run(`
      tell application "${this.name}"
        activate
        if (count of windows) = 0 then
          create window with default profile command "${escaped}"
        else
          tell current window
            create tab with default profile command "${escaped}"
          end tell
        end if
      end tell
    `);
  }

  async send(text: string): Promise<void> {
    await this.focus();
    await new Promise((r) => setTimeout(r, 50));
    await this.run(`tell application "System Events" to keystroke "${text}"`);
  }

  async sendKey(key: string): Promise<void> {
    await this.run(`tell application "${this.name}" to activate`);
    if (key === "escape") {
      await this.run(`tell application "System Events" to key code 53`);
    } else if (key.startsWith("ctrl+")) {
      const letter = key.slice(5);
      await this.run(`tell application "System Events" to keystroke "${letter}" using control down`);
    } else {
      await this.run(`tell application "System Events" to keystroke "${key}"`);
    }
  }
}
