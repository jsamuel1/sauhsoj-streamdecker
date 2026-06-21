import { execFile } from "child_process";
import { promisify } from "util";
import type { GuiTarget } from "./targets.js";

const execFileAsync = promisify(execFile);

export type OpenRunner = (appName: string) => Promise<void>;
export type OsaRunner = (script: string) => Promise<void>;

export interface LauncherDeps {
  open?: OpenRunner;
  osascript?: OsaRunner;
  delayMs?: number;
}

const defaultOpen: OpenRunner = async (appName) => {
  await execFileAsync("open", ["-a", appName]);
};
const defaultOsa: OsaRunner = async (script) => {
  await execFileAsync("osascript", ["-e", script]);
};

/** Bring a GUI app to the front (launching it if needed). */
export async function activateApp(appName: string, deps: Pick<LauncherDeps, "open"> = {}): Promise<void> {
  await (deps.open ?? defaultOpen)(appName);
}

/** Launch/foreground a GUI target, then start a new session if it supports cmd-n. */
export async function launchApp(target: GuiTarget, deps: LauncherDeps = {}): Promise<void> {
  const open = deps.open ?? defaultOpen;
  const osa = deps.osascript ?? defaultOsa;
  // The app needs a moment to become frontmost before the ⌘N keystroke, or the keystroke could go to the wrong app.
  const delayMs = deps.delayMs ?? 600;

  await open(target.appName);
  if (target.newSession === "cmd-n") {
    // Give the app a moment to become frontmost before the keystroke.
    await new Promise((r) => setTimeout(r, delayMs));
    await osa('tell application "System Events" to keystroke "n" using command down');
  }
}
