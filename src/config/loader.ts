import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { Config, ConfigSchema, getDefaultButtons } from "./schema.js";
import { CONFIG_DIR, CONFIG_FILE } from "./paths.js";

let cachedConfig: Config | null = null;

/**
 * Load config from disk, creating default if missing
 */
export function loadConfig(): Config {
  if (cachedConfig) return cachedConfig;

  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  if (existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
      cachedConfig = ConfigSchema.parse(data);
    } catch (e) {
      console.error("[Config] Parse error, using defaults:", e);
      cachedConfig = ConfigSchema.parse({});
    }
  } else {
    cachedConfig = ConfigSchema.parse({});
    saveConfig(cachedConfig);
  }

  return cachedConfig;
}

/**
 * Save config to disk
 */
export function saveConfig(config: Config): void {
  cachedConfig = config;
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Get current config (loads if not cached)
 */
export function getConfig(): Config {
  return cachedConfig ?? loadConfig();
}

/**
 * Update config with partial values
 */
export function updateConfig(partial: Partial<Config>): Config {
  const current = getConfig();
  const updated = ConfigSchema.parse({ ...current, ...partial });
  saveConfig(updated);
  return updated;
}

/**
 * Reset config to defaults
 */
export function resetConfig(): Config {
  cachedConfig = null;
  const defaults = ConfigSchema.parse({});
  saveConfig(defaults);
  return defaults;
}

/**
 * Set operating mode
 */
export function setMode(mode: Config["mode"]): Config {
  return updateConfig({ mode });
}

/**
 * Set device type and adjust buttons if needed
 */
export function setDeviceType(type: "neo" | "mini"): Config {
  const current = getConfig();
  const maxButtons = type === "neo" ? 8 : 6;

  // Filter buttons that fit the device
  let buttons = current.buttons.filter((b) => b.position < maxButtons);

  // If no buttons left, use defaults
  if (buttons.length === 0) {
    buttons = getDefaultButtons(type);
  }

  return updateConfig({
    device: { ...current.device, type },
    buttons,
  });
}

/**
 * Add agent to recent list
 */
export function addRecentAgent(agent: string): Config {
  const current = getConfig();
  const recent = [agent, ...current.agents.recent.filter((a) => a !== agent)].slice(0, 10);
  return updateConfig({
    agents: { ...current.agents, recent },
  });
}

/**
 * Check if this is first run
 */
export function isFirstRun(): boolean {
  return getConfig().firstRun;
}

/**
 * Mark first run complete
 */
export function markFirstRunComplete(): void {
  updateConfig({ firstRun: false });
}

/**
 * Clear config cache (for testing)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}
