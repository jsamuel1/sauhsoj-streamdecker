import { writeFileSync, mkdirSync } from "fs";
import { getConfig } from "../config/loader.js";
import { CONFIG_DIR, getScriptsDir } from "../config/paths.js";
import type { Button } from "../config/schema.js";

// Map action IDs to AppleScript files
const ACTION_SCRIPTS: Record<string, string> = {
  "kiro.focus": "focus-kiro.applescript",
  "kiro.cycle": "cycle-kiro-tabs.applescript",
  "kiro.alert": "next-alert-tab.applescript",
  "kiro.launch": "launch-kiro.applescript",
  "kiro.yes": "send-yes.applescript",
  "kiro.no": "send-no.applescript",
  "kiro.trust": "send-trust.applescript",
  "kiro.agent": "switch-agent-picker.sh",
};

interface BttTrigger {
  BTTTriggerType: number;
  BTTTriggerClass: string;
  BTTTriggerName: string;
  BTTPredefinedActionType: number;
  BTTAppleScriptString?: string;
  BTTShellScriptCommand?: string;
  BTTStreamDeckRow: number;
  BTTStreamDeckColumn: number;
  BTTStreamDeckImageHeight: number;
  BTTEnabled: number;
}

function positionToRowCol(pos: number): { row: number; col: number } {
  return { row: Math.floor(pos / 4) + 1, col: (pos % 4) + 1 };
}

function buttonToTrigger(button: Button): BttTrigger {
  const { row, col } = positionToRowCol(button.position);
  const scriptFile = ACTION_SCRIPTS[button.action];
  const scriptsDir = getScriptsDir();

  const trigger: BttTrigger = {
    BTTTriggerType: 719,
    BTTTriggerClass: "BTTTriggerTypeStreamDeck",
    BTTTriggerName: button.action,
    BTTPredefinedActionType: scriptFile?.endsWith(".sh") ? 206 : 195,
    BTTStreamDeckRow: row,
    BTTStreamDeckColumn: col,
    BTTStreamDeckImageHeight: 144,
    BTTEnabled: 1,
  };

  if (scriptFile) {
    if (scriptFile.endsWith(".sh")) {
      trigger.BTTShellScriptCommand = `${scriptsDir}/${scriptFile}`;
    } else {
      trigger.BTTAppleScriptString = `run script POSIX file "${scriptsDir}/${scriptFile}"`;
    }
  }

  return trigger;
}

export function generateBttTriggers(): BttTrigger[] {
  const config = getConfig();
  return config.buttons.map(buttonToTrigger);
}

export function exportBttTriggers(outputPath?: string): string {
  const triggers = generateBttTriggers();
  const path = outputPath || `${CONFIG_DIR}/btt-triggers.json`;

  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(path, JSON.stringify(triggers, null, 2));

  console.log(`[BTT] Exported ${triggers.length} triggers to ${path}`);
  return path;
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  exportBttTriggers();
}
