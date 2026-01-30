import { runAppleScript, sendKeystroke, focusApp } from './applescript.js';

/** Find and focus iTerm tab with 'kiro-cli' in name */
export async function focusKiro(): Promise<boolean> {
  const result = await runAppleScript(`
    tell application "iTerm"
      activate
      repeat with w in windows
        repeat with t in tabs of w
          set s to current session of t
          if name of s contains "kiro-cli" then
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

/** Cycle through kiro-cli tabs */
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
        repeat with i from 1 to n
          set idx to ((c + i - 1) mod n) + 1
          if idx ≠ c then
            set s to current session of tab idx
            if name of s contains "kiro-cli" then
              select tab idx
              return
            end if
          end if
        end repeat
      end tell
    end tell
  `);
}

/** Find next idle kiro-cli tab (not processing) */
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
        repeat with i from 1 to n
          set idx to ((c + i - 1) mod n) + 1
          if idx ≠ c then
            set s to current session of tab idx
            if name of s contains "kiro-cli" and is processing of s is false then
              select tab idx
              return
            end if
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
  await focusKiro();
  await Bun.sleep(50);
  await runAppleScript(`
    tell application "System Events"
      keystroke "/agent switch ${name}"
      delay 0.1
      keystroke return
    end tell
  `);
}

/** Show agent picker dialog and switch */
export async function switchAgentPicker(): Promise<void> {
  // Use choose from list dialog for agent selection
  const result = await runAppleScript(`
    set agents to {"default", "jupyter", "git", "notes", "salesforce", "home", "blog"}
    set chosen to choose from list agents with prompt "Switch to agent:" default items {"default"}
    if chosen is false then return ""
    return item 1 of chosen
  `);
  if (result && result !== '') {
    await switchAgent(result);
  }
}

export async function launchKiro(folder?: string): Promise<void> {
  await focusApp('iTerm');
  const cmd = folder ? `cd "${folder}" && kiro-cli chat` : 'kiro-cli chat';
  await runAppleScript(`
    tell application "iTerm"
      tell current window
        create tab with default profile
        tell current session to write text "${cmd}"
      end tell
    end tell
  `);
}
