import type { GuiTarget } from "./targets.js";
export type OpenRunner = (appName: string) => Promise<void>;
export type OsaRunner = (script: string) => Promise<void>;
export interface LauncherDeps {
    open?: OpenRunner;
    osascript?: OsaRunner;
    delayMs?: number;
}
/** Bring a GUI app to the front (launching it if needed). */
export declare function activateApp(appName: string, deps?: Pick<LauncherDeps, "open">): Promise<void>;
/** Launch/foreground a GUI target, then start a new session if it supports cmd-n. */
export declare function launchApp(target: GuiTarget, deps?: LauncherDeps): Promise<void>;
