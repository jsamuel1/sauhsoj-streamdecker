import { runAppleScript, sendKeystroke, focusApp } from './applescript.js';
import { getConfig } from '../config/config.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = join(__dirname, '../../scripts');

/** Find and focus iTerm tab with kiro-cli running */
export async function focusKiro(): Promise<boolean> {
  const result = await runAppleScript(`
    tell application "iTerm"
      activate
      repeat with w in windows
        repeat with t in tabs of w
          set s to current session of t
          set theTty to tty of s
          set hasKiro to (do shell script "ps -t " & theTty & " -o command= | grep -q kiro-cli && echo yes || echo no")
          if hasKiro is "yes" then
            select t
            return "found"
          end if
        end repeat
      end repeat
    end tell
    return "none"
  `);
  return result === 'found';
}

/** Cycle through kiro-cli tabs (any kiro tab, regardless of processing state) */
export async function cycleKiroTabs(): Promise<void> {
  await focusApp('iTerm');
  await runAppleScript(`
    tell application "iTerm"
      tell current window
        set n to count of tabs
        set c to 0
        repeat with i from 1 to n
          if tab i is current tab then set c to i
        end repeat
        -- Find next kiro tab after current
        repeat with i from 1 to n - 1
          set idx to ((c + i - 1) mod n) + 1
          set s to current session of tab idx
          set theTty to tty of s
          set hasKiro to (do shell script "ps -t " & theTty & " -o command= | grep -q kiro-cli && echo yes || echo no")
          if hasKiro is "yes" then
            select tab idx
            return
          end if
        end repeat
      end tell
    end tell
  `);
}

/** Find next idle kiro-cli tab (not processing, waiting for input) */
export async function alertIdleKiro(): Promise<void> {
  await runAppleScript(`
    tell application "iTerm"
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
          set hasKiro to (do shell script "ps -t " & theTty & " -o command= | grep -q kiro-cli && echo yes || echo no")
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
  await Bun.sleep(50);
  await sendKeystroke('y');
}

export async function sendNo(): Promise<void> {
  await focusKiro();
  await Bun.sleep(50);
  await sendKeystroke('n');
}

export async function sendThinking(): Promise<void> {
  await focusKiro();
  await Bun.sleep(50);
  await sendKeystroke('t');
}

export async function switchAgent(name: string): Promise<void> {
  // Just activate iTerm, don't switch tabs
  await focusApp('iTerm');
  await Bun.sleep(100);
  await runAppleScript(`
    tell application "System Events"
      keystroke "/agent switch ${name}"
      delay 0.1
      keystroke return
    end tell
  `);
}

export async function switchAgentWithShortcut(shortcut: string): Promise<void> {
  // Use keyboard shortcut instead of /agent switch command
  await focusApp('iTerm');
  await Bun.sleep(100);
  await sendKeystroke(shortcut);
}

/** Show agent picker dialog and switch */
export async function switchAgentPicker(): Promise<void> {
  // Get agents from ~/.kiro/agents/*.json
  const agentsDir = join(process.env.HOME || '', '.kiro', 'agents');
  let agents: string[] = [];
  
  try {
    const { readdirSync, readFileSync } = await import('fs');
    const files = readdirSync(agentsDir).filter(f => f.endsWith('.json') && !f.endsWith('.bak'));
    for (const file of files) {
      try {
        const data = JSON.parse(readFileSync(join(agentsDir, file), 'utf-8'));
        if (data.name) agents.push(data.name);
      } catch {}
    }
  } catch {}
  
  if (agents.length === 0) {
    agents = getConfig().favoriteAgents;
  }
  
  const agentList = agents.join('", "');
  const result = await runAppleScript(`
    set agents to {"${agentList}"}
    set chosen to choose from list agents with prompt "Switch to agent:" default items {"${agents[0]}"}
    if chosen is false then return ""
    return item 1 of chosen
  `);
  
  if (result && result !== '') {
    await focusKiro();
    await Bun.sleep(50);
    await switchAgent(result);
  }
}

export async function launchKiro(): Promise<void> {
  // Check config for custom script, else use bundled script
  const config = getConfig();
  let scriptPath = config.scripts?.launchKiro;
  
  if (!scriptPath || !existsSync(scriptPath)) {
    scriptPath = join(SCRIPTS_DIR, 'launch-kiro-picker.sh');
  }
  
  if (!existsSync(scriptPath)) {
    // Fallback: just launch kiro-cli directly
    await focusApp('iTerm');
    await runAppleScript(`
      tell application "iTerm"
        tell current window
          create tab with default profile
          tell current session to write text "kiro-cli chat"
        end tell
      end tell
    `);
    return;
  }
  
  const script = `
    set cmd to "/bin/zsh -lic '${scriptPath}'"
    tell application "iTerm"
      activate
      if (count of windows) = 0 then
        create window with default profile command cmd
      else
        tell current window
          create tab with default profile command cmd
        end tell
      end if
    end tell
  `;
  await runAppleScript(script);
}
