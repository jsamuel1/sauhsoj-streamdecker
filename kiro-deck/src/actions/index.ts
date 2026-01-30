import * as kiro from './kiro.js';
import { focusApp } from './applescript.js';

export { kiro };
export type ActionFn = () => Promise<void>;

export const ActionRegistry = new Map<string, ActionFn>([
  ['kiro.yes', kiro.sendYes],
  ['kiro.no', kiro.sendNo],
  ['kiro.thinking', kiro.sendThinking],
  ['kiro.focus', async () => { await kiro.focusKiro(); }],
  ['kiro.cycle', kiro.cycleKiroTabs],
  ['kiro.launch', () => kiro.launchKiro()],
  ['kiro.alert', kiro.alertIdleKiro],
  ['kiro.agent', () => kiro.switchAgentPicker()],
  ['app.iterm', () => focusApp('iTerm')],
]);

export async function executeAction(actionId: string): Promise<void> {
  const action = ActionRegistry.get(actionId);
  if (!action) throw new Error(`Unknown action: ${actionId}`);
  await action();
}
