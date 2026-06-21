export const TARGET_IDS = ["kiro-cli", "claude-code", "amazon-quick", "claude-app"] as const;
export type TargetId = (typeof TARGET_IDS)[number];

interface BaseTarget {
  id: TargetId;
  label: string;
  launchIcon: string; // icon base-name for Launch
  focusIcon: string;  // icon base-name for Focus
}

export type TerminalTarget = BaseTarget & {
  kind: "terminal";
  command: string;        // run in a new tab (a new tab is a new session)
  detectCommand: string;  // used by Focus to find the right tab
};

export type GuiTarget = BaseTarget & {
  kind: "gui";
  appName: string;        // for `open -a`
  bundleId: string;
  newSession: "cmd-n" | "none"; // how Launch starts a new conversation
};

export type LaunchTarget = TerminalTarget | GuiTarget;

export const TARGETS: Record<TargetId, LaunchTarget> = {
  "kiro-cli": {
    id: "kiro-cli",
    label: "Kiro",
    kind: "terminal",
    command: "kiro-cli chat",
    detectCommand: "kiro-cli",
    launchIcon: "kiro-launch",
    focusIcon: "kiro-focus",
  },
  "claude-code": {
    id: "claude-code",
    label: "Claude Code",
    kind: "terminal",
    command: "claude",
    detectCommand: "claude",
    launchIcon: "claude-code-launch",
    focusIcon: "claude-code-focus",
  },
  "amazon-quick": {
    id: "amazon-quick",
    label: "Quick",
    kind: "gui",
    appName: "Amazon Quick",
    bundleId: "com.amazon.QuickWork.mac",
    newSession: "cmd-n",
    launchIcon: "amazon-quick-launch",
    focusIcon: "amazon-quick-focus",
  },
  "claude-app": {
    id: "claude-app",
    label: "Claude",
    kind: "gui",
    appName: "Claude",
    bundleId: "com.anthropic.claudefordesktop",
    newSession: "cmd-n",
    launchIcon: "claude-app-launch",
    focusIcon: "claude-app-focus",
  },
};

export function getTarget(id: string): LaunchTarget | undefined {
  return id in TARGETS ? TARGETS[id as TargetId] : undefined;
}
