import { getTarget } from "../shared/targets.js";
import type { Button } from "../shared/config/schema.js";
import type { ActionId } from "../shared/config/schema.js";

const ACTION_DEFAULTS: Partial<Record<ActionId, { icon: string; label: string }>> = {
  "kiro.focus": { icon: "kiro-focus", label: "Focus" },
  "kiro.cycle": { icon: "kiro-cycle", label: "Cycle" },
  "kiro.alert": { icon: "kiro-alert", label: "Alert" },
  "kiro.launch": { icon: "kiro-launch", label: "Launch" },
  "kiro.yes": { icon: "kiro-yes", label: "Yes" },
  "kiro.no": { icon: "kiro-no", label: "No" },
  "kiro.trust": { icon: "kiro-trust", label: "Trust" },
  "kiro.agent": { icon: "kiro-agent", label: "Agent" },
  "kiro.agent.picker": { icon: "kiro-agent", label: "Agents" },
};

function isTargetAction(action: string): boolean {
  return action === "target.launch" || action === "target.focus";
}

/** Icon base-name for a button: explicit icon -> target-derived -> kiro default -> null. */
export function resolveButtonIcon(button: Button): string | null {
  if (button.icon) return button.icon;
  if (isTargetAction(button.action) && button.target) {
    const t = getTarget(button.target);
    if (t) return button.action === "target.launch" ? t.launchIcon : t.focusIcon;
  }
  return ACTION_DEFAULTS[button.action]?.icon ?? null;
}

/** Display label for a button: explicit label -> target label -> kiro default -> "". */
export function resolveButtonLabel(button: Button): string {
  if (button.label) return button.label;
  if (isTargetAction(button.action) && button.target) {
    const t = getTarget(button.target);
    if (t) return t.label;
  }
  return ACTION_DEFAULTS[button.action]?.label ?? "";
}

/** Ordered slot array (length = slots) indexed by button.position; gaps are null. */
export function buttonsByPosition(buttons: Button[], slots: number): (Button | null)[] {
  const arr: (Button | null)[] = new Array(slots).fill(null);
  for (const btn of buttons) {
    if (btn.position >= 0 && btn.position < slots) arr[btn.position] = btn;
  }
  return arr;
}
