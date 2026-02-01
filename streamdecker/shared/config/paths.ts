import { join, dirname } from "path";
import { homedir } from "os";
import { existsSync } from "fs";

// XDG-style config directory
export const CONFIG_DIR = join(homedir(), ".config", "streamdecker");
export const CONFIG_FILE = join(CONFIG_DIR, "config.json");

// Kiro agents directory
export const KIRO_AGENTS_DIR = join(homedir(), ".kiro", "agents");

/**
 * Resolve scripts directory based on execution context:
 * - Development: relative to source
 * - Bundled app: inside .app/Contents/Resources
 * - Installed package: node_modules location
 */
export function getScriptsDir(): string {
  // Check if running from .app bundle
  const execPath = process.execPath;
  if (execPath.includes(".app/Contents/MacOS")) {
    return join(dirname(execPath), "..", "Resources", "scripts");
  }

  // Check for scripts relative to this file (development)
  const devScripts = join(dirname(import.meta.url.replace("file://", "")), "../../scripts");
  if (existsSync(devScripts)) {
    return devScripts;
  }

  // Fallback to shared scripts in repo root
  const repoScripts = join(dirname(import.meta.url.replace("file://", "")), "../../../scripts");
  if (existsSync(repoScripts)) {
    return repoScripts;
  }

  // Last resort: config directory
  return join(CONFIG_DIR, "scripts");
}

/**
 * Resolve icons directory with fallback chain:
 * 1. User overrides: ~/.config/streamdecker/icons/
 * 2. Bundled icons: .app/Contents/Resources/icons/
 * 3. Icon pack: wtf.sauhsoj.kiro-icons.sdIconPack/icons/
 */
export function getIconsDir(): string {
  // User overrides
  const userIcons = join(CONFIG_DIR, "icons");
  if (existsSync(userIcons)) {
    return userIcons;
  }

  // Bundled app
  const execPath = process.execPath;
  if (execPath.includes(".app/Contents/MacOS")) {
    return join(dirname(execPath), "..", "Resources", "icons");
  }

  // Development - shared icons
  const sharedIcons = join(
    dirname(import.meta.url.replace("file://", "")),
    "../../../shared/icons"
  );
  if (existsSync(sharedIcons)) {
    return sharedIcons;
  }

  return join(CONFIG_DIR, "icons");
}

/**
 * Resolve a specific icon by name, checking multiple sizes
 */
export function resolveIcon(name: string, size?: 72 | 96 | 144): string | null {
  const iconsDir = getIconsDir();

  // Try size-specific first
  if (size) {
    const sized = join(iconsDir, `${name}-${size}.png`);
    if (existsSync(sized)) return sized;
  }

  // Try base name
  const base = join(iconsDir, `${name}.png`);
  if (existsSync(base)) return base;

  return null;
}

/**
 * Get BTT export path
 */
export function getBttExportPath(): string {
  return join(CONFIG_DIR, "btt-triggers.json");
}

/**
 * Get Elgato plugin directory
 */
export function getElgatoPluginsDir(): string {
  return join(homedir(), "Library", "Application Support", "com.elgato.StreamDeck", "Plugins");
}

/**
 * Get fonts directory
 */
export function getFontsDir(): string {
  const execPath = process.execPath;
  if (execPath.includes(".app/Contents/MacOS")) {
    return join(dirname(execPath), "..", "Resources", "fonts");
  }

  // Development
  const devFonts = join(dirname(import.meta.url.replace("file://", "")), "../../fonts");
  if (existsSync(devFonts)) {
    return devFonts;
  }

  return join(CONFIG_DIR, "fonts");
}
