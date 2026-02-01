export { focusKiro, cycleKiroTabs, alertIdleKiro, sendYes, sendNo, sendTrust, switchAgent, getAgentList, launchKiro, } from "./kiro.js";
export { runAppleScript, runAppleScriptFile, focusApp, sendKeystroke, sendCommand, detectTerminal, } from "./terminal.js";
import type { ActionId } from "../config/schema.js";
export declare const actions: Record<string, () => Promise<void>>;
export declare function executeAction(actionId: ActionId): Promise<void>;
