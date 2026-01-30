import { z } from 'zod';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.config', 'kiro-deck');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const ConfigSchema = z.object({
  deviceType: z.enum(['neo', 'mini']).default('neo'),
  watchedCommands: z.array(z.string()).default(['kiro-cli']),
  favoriteAgents: z.array(z.string()).default(['default', 'jupyter', 'git', 'notes']),
  favoriteFolders: z.array(z.string()).default([]),
  scripts: z.object({
    launchKiro: z.string().optional(),
  }).default({}),
});

export type Config = z.infer<typeof ConfigSchema>;

let config: Config | null = null;

export function loadConfig(): Config {
  if (config) return config;
  
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  
  if (existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
      config = ConfigSchema.parse(data);
    } catch {
      config = ConfigSchema.parse({});
    }
  } else {
    config = ConfigSchema.parse({});
    saveConfig(config);
  }
  
  return config;
}

export function saveConfig(newConfig: Config): void {
  config = newConfig;
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getConfig(): Config {
  return config ?? loadConfig();
}
