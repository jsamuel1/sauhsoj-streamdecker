import { getTerminalBackend } from "../terminal/factory.js";
import { getTarget, type TargetId } from "../targets.js";
import { launchApp, activateApp } from "../app-launcher.js";

/** Launch a target: terminal → new tab (new session); gui → open + Cmd+N. */
export async function launchTarget(id: TargetId, folder?: string): Promise<void> {
  const t = getTarget(id);
  if (!t) throw new Error(`Unknown target: ${id}`);
  if (t.kind === "terminal") {
    const backend = await getTerminalBackend();
    const cmd = folder ? `cd "${folder}" && ${t.command}` : t.command;
    await backend.openTab(cmd);
  } else {
    await launchApp(t);
  }
}

/** Focus a target: terminal → focus tab running its command; gui → bring to front. */
export async function focusTarget(id: TargetId): Promise<void> {
  const t = getTarget(id);
  if (!t) throw new Error(`Unknown target: ${id}`);
  if (t.kind === "terminal") {
    const backend = await getTerminalBackend();
    await backend.focus(t.detectCommand);
  } else {
    await activateApp(t.appName);
  }
}
