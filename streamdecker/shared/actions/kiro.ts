import { runAppleScript, focusApp, sendKeystroke, detectTerminal } from "./terminal.js";
import { getConfig, addRecentAgent } from "../config/loader.js";
import { KIRO_AGENTS_DIR } from "../config/paths.js";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Find and focus terminal tab with kiro-cli running
 */
export async function focusKiro(): Promise<boolean> {
  const terminal = (await detectTerminal()) || "iTerm";
  const cmd = getConfig().terminal.detectCommand;

  const result = await runAppleScript(`
    tell application "${terminal}"
      activate
      repeat with w in windows
        repeat with t in tabs of w
          set s to current session of t
          set theTty to tty of s
          set hasKiro to (do shell script "ps -t " & theTty & " -o command= | grep -q ${cmd} && echo yes || echo no")
          if hasKiro is "yes" then
            select t
            return "found"
          end if
        end repeat
      end repeat
    end tell
    return "none"
  `);
  return result === "found";
}

/**
 * Cycle through kiro-cli tabs
 */
export async function cycleKiroTabs(): Promise<void> {
  const terminal = (await detectTerminal()) || "iTerm";
  const cmd = getConfig().terminal.detectCommand;

  await focusApp(terminal);
  await runAppleScript(`
    tell application "${terminal}"
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
          set hasKiro to (do shell script "ps -t " & theTty & " -o command= | grep -q ${cmd} && echo yes || echo no")
          if hasKiro is "yes" then
            select tab idx
            return
          end if
        end repeat
      end tell
    end tell
  `);
}

/**
 * Find next idle kiro-cli tab (not processing)
 */
export async function alertIdleKiro(): Promise<void> {
  const terminal = (await detectTerminal()) || "iTerm";
  const cmd = getConfig().terminal.detectCommand;

  await runAppleScript(`
    tell application "${terminal}"
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
          set hasKiro to (do shell script "ps -t " & theTty & " -o command= | grep -q ${cmd} && echo yes || echo no")
          if hasKiro is "yes" and is processing of s is false then
            select tab idx
            return
          end if
        end repeat
      end tell
    end tell
  `);
}

export async function sendYes(): Promise<void> {
  await focusKiro();
  await new Promise((r) => setTimeout(r, 50));
  await sendKeystroke("y");
}

export async function sendNo(): Promise<void> {
  await focusKiro();
  await new Promise((r) => setTimeout(r, 50));
  await sendKeystroke("n");
}

export async function sendTrust(): Promise<void> {
  await focusKiro();
  await new Promise((r) => setTimeout(r, 50));
  await sendKeystroke("t");
}

export async function switchAgent(name: string): Promise<void> {
  const terminal = (await detectTerminal()) || "iTerm";
  await focusApp(terminal);
  await new Promise((r) => setTimeout(r, 100));
  await runAppleScript(`
    tell application "System Events"
      keystroke "/agent switch ${name}"
      delay 0.1
      keystroke return
    end tell
  `);
  addRecentAgent(name);
}

/**
 * Get list of available agents
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
  const terminal = (await detectTerminal()) || "iTerm";
  const cmd = "/bin/zsh -lic 'kiro-cli chat'";
  await runAppleScript(`
    tell application "${terminal}"
      activate
      if (count of windows) = 0 then
        create window with default profile command "${cmd}"
      else
        tell current window
          create tab with default profile command "${cmd}"
        end tell
      end if
    end tell
  `);
}

/**
 * Launch kiro-cli with folder picker
 */
export async function launchKiroWithPicker(): Promise<void> {
  const terminal = (await detectTerminal()) || "iTerm";
  const { getScriptsDir } = await import("../config/paths.js");
  const pickerScript = join(getScriptsDir(), "launch-kiro-picker.sh");
  const cmd = `/bin/zsh -lic '${pickerScript}'`;
  
  await runAppleScript(`
    tell application "${terminal}"
      activate
      if (count of windows) = 0 then
        create window with default profile command "${cmd}"
      else
        tell current window
          create tab with default profile command "${cmd}"
        end tell
      end if
    end tell
  `);
}

/**
 * Launch kiro-cli in a specific folder
 */
export async function launchKiroInFolder(folder: string): Promise<void> {
  const terminal = (await detectTerminal()) || "iTerm";
  const cmd = `/bin/zsh -lic 'cd "${folder}" && kiro-cli chat'`;
  await runAppleScript(`
    tell application "${terminal}"
      activate
      if (count of windows) = 0 then
        create window with default profile command "${cmd}"
      else
        tell current window
          create tab with default profile command "${cmd}"
        end tell
      end if
    end tell
  `);
}
