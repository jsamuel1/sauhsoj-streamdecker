export {
  focusKiro,
  cycleKiroTabs,
  alertIdleKiro,
  sendYes,
  sendNo,
  sendTrust,
  switchAgent,
  getAgentList,
  launchKiro,
  launchKiroWithPicker,
  launchKiroInFolder,
} from "./kiro.js";
export {
  runAppleScript,
  runAppleScriptFile,
  focusApp,
  sendKeystroke,
  sendCommand,
  detectTerminal,
} from "./terminal.js";

import type { ActionId } from "../config/schema.js";

// Action registry - maps action IDs to functions
export const actions: Record<string, () => Promise<void>> = {};

// Lazy load to avoid circular deps
export async function executeAction(actionId: ActionId): Promise<void> {
  const { focusKiro, cycleKiroTabs, alertIdleKiro, sendYes, sendNo, sendTrust, launchKiro } =
    await import("./kiro.js");

  const actionMap: Record<string, () => Promise<unknown>> = {
    "kiro.focus": focusKiro,
    "kiro.cycle": cycleKiroTabs,
    "kiro.alert": alertIdleKiro,
    "kiro.launch": launchKiro,
    "kiro.yes": sendYes,
    "kiro.no": sendNo,
    "kiro.trust": sendTrust,
  };

  const fn = actionMap[actionId];
  if (fn) await fn();
}
