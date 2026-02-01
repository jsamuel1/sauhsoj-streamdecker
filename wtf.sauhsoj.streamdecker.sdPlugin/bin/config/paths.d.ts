export declare const CONFIG_DIR: string;
export declare const CONFIG_FILE: string;
export declare const KIRO_AGENTS_DIR: string;
/**
 * Resolve scripts directory based on execution context:
 * - Development: relative to source
 * - Bundled app: inside .app/Contents/Resources
 * - Installed package: node_modules location
 */
export declare function getScriptsDir(): string;
/**
 * Resolve icons directory with fallback chain:
 * 1. User overrides: ~/.config/kiro-deck/icons/
 * 2. Bundled icons: .app/Contents/Resources/icons/
 * 3. Icon pack: wtf.sauhsoj.kiro-icons.sdIconPack/icons/
 */
export declare function getIconsDir(): string;
/**
 * Resolve a specific icon by name, checking multiple sizes
 */
export declare function resolveIcon(name: string, size?: 72 | 96 | 144): string | null;
/**
 * Get BTT export path
 */
export declare function getBttExportPath(): string;
/**
 * Get Elgato plugin directory
 */
export declare function getElgatoPluginsDir(): string;
/**
 * Get fonts directory
 */
export declare function getFontsDir(): string;
