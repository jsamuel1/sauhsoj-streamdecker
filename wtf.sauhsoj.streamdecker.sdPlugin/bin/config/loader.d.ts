import { Config } from "./schema.js";
/**
 * Load config from disk, creating default if missing
 */
export declare function loadConfig(): Config;
/**
 * Save config to disk
 */
export declare function saveConfig(config: Config): void;
/**
 * Get current config (loads if not cached)
 */
export declare function getConfig(): Config;
/**
 * Update config with partial values
 */
export declare function updateConfig(partial: Partial<Config>): Config;
/**
 * Reset config to defaults
 */
export declare function resetConfig(): Config;
/**
 * Set operating mode
 */
export declare function setMode(mode: Config["mode"]): Config;
/**
 * Set device type and adjust buttons if needed
 */
export declare function setDeviceType(type: "neo" | "mini"): Config;
/**
 * Add agent to recent list
 */
export declare function addRecentAgent(agent: string): Config;
/**
 * Check if this is first run
 */
export declare function isFirstRun(): boolean;
/**
 * Mark first run complete
 */
export declare function markFirstRunComplete(): void;
/**
 * Clear config cache (for testing)
 */
export declare function clearConfigCache(): void;
