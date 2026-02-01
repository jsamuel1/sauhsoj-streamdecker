import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { getConfig } from "../config/loader.js";
import { CONFIG_DIR, getElgatoPluginsDir } from "../config/paths.js";
import type { Button } from "../config/schema.js";

// Map action IDs to Elgato UUIDs
const ACTION_UUIDS: Record<string, string> = {
  "kiro.focus": "wtf.sauhsoj.streamdecker.focus-kiro",
  "kiro.cycle": "wtf.sauhsoj.streamdecker.cycle-kiro-tabs",
  "kiro.alert": "wtf.sauhsoj.streamdecker.next-alert-tab",
  "kiro.launch": "wtf.sauhsoj.streamdecker.launch-kiro-cli",
  "kiro.yes": "wtf.sauhsoj.streamdecker.send-yes",
  "kiro.no": "wtf.sauhsoj.streamdecker.send-no",
  "kiro.trust": "wtf.sauhsoj.streamdecker.send-thinking",
  "kiro.agent": "wtf.sauhsoj.streamdecker.switch-agent",
  "kiro.agent.picker": "wtf.sauhsoj.streamdecker.switch-agent",
};

const ACTION_TITLES: Record<string, string> = {
  "kiro.focus": "Focus",
  "kiro.cycle": "Cycle",
  "kiro.alert": "Alert",
  "kiro.launch": "Launch",
  "kiro.yes": "Y",
  "kiro.no": "N",
  "kiro.trust": "T",
  "kiro.agent": "Agent",
};

interface ProfileAction {
  Name: string;
  Settings: Record<string, unknown>;
  State: number;
  States: Array<{ Title: string }>;
  UUID: string;
}

function buttonToProfileAction(button: Button): ProfileAction {
  return {
    Name: button.action,
    Settings: {},
    State: 0,
    States: [{ Title: button.label || ACTION_TITLES[button.action] || "" }],
    UUID: ACTION_UUIDS[button.action] || ACTION_UUIDS["kiro.focus"],
  };
}

export function generateProfile(): object {
  const config = getConfig();
  const cols = config.device.type === "neo" ? 4 : 3;

  const actions: Record<string, ProfileAction> = {};
  for (const button of config.buttons) {
    const row = Math.floor(button.position / cols);
    const col = button.position % cols;
    actions[`${col},${row}`] = buttonToProfileAction(button);
  }

  return {
    Controllers: [{ Actions: actions, Type: "Keypad" }],
    Name: `Kiro-${config.device.type === "neo" ? "Neo" : "Mini"}`,
    Version: "1.0",
  };
}

export function exportElgatoProfile(outputPath?: string): string {
  const config = getConfig();
  const profile = generateProfile();
  const name = `Kiro-${config.device.type === "neo" ? "Neo" : "Mini"}`;
  const path = outputPath || join(CONFIG_DIR, `${name}.streamDeckProfile`);

  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(path, JSON.stringify(profile, null, 2));

  console.log(`[Elgato] Exported profile to ${path}`);
  return path;
}

export function installElgatoProfile(): string {
  const config = getConfig();
  const name = `Kiro-${config.device.type === "neo" ? "Neo" : "Mini"}`;
  const pluginDir = join(getElgatoPluginsDir(), "wtf.sauhsoj.streamdecker.sdPlugin");
  const path = join(pluginDir, `${name}.streamDeckProfile`);

  mkdirSync(pluginDir, { recursive: true });
  return exportElgatoProfile(path);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  exportElgatoProfile();
}
