import type { Config } from "./schema.js";
declare const APPS: {
    elgato: {
        name: string;
        bundle: string;
    };
    btt: {
        name: string;
        bundle: string;
    };
};
/**
 * Check if Elgato plugin is installed and up to date
 */
export declare function getPluginStatus(): {
    installed: boolean;
    currentVersion: string | null;
    bundledVersion: string | null;
    needsUpdate: boolean;
};
/**
 * Check if Elgato plugin is installed
 */
export declare function isPluginInstalled(): boolean;
/**
 * Install Elgato plugin via official .streamDeckPlugin installer
 */
export declare function installPlugin(): Promise<{
    installed: boolean;
    version: string | null;
}>;
/**
 * Check if an app is running
 */
export declare function isAppRunning(bundle: string): Promise<boolean>;
/**
 * Start an app
 */
export declare function startApp(bundle: string): Promise<void>;
/**
 * Quit an app gracefully
 */
export declare function quitApp(name: string): Promise<void>;
/**
 * Get apps that should be running/stopped for a mode
 */
export declare function getAppsForMode(mode: Config["mode"]): {
    start: (typeof APPS)[keyof typeof APPS] | null;
    stop: (typeof APPS)[keyof typeof APPS][];
};
/**
 * Check current app states for a mode switch
 */
export declare function checkModeSwitch(newMode: Config["mode"]): Promise<{
    needsStart: string | null;
    needsStop: string[];
    isStartRunning: boolean;
    areStopRunning: boolean[];
    needsPluginInstall: boolean;
    pluginStatus: {
        currentVersion: string | null;
        bundledVersion: string | null;
    } | null;
}>;
/**
 * Execute mode switch - start/stop apps as needed
 */
export declare function executeModeSwitch(newMode: Config["mode"]): Promise<{
    started: string | null;
    stopped: string[];
    pluginInstalled: boolean;
    pluginVersion: string | null;
}>;
export {};
