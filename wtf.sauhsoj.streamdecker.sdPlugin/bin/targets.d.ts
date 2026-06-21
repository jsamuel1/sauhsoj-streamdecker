export declare const TARGET_IDS: readonly ["kiro-cli", "claude-code", "amazon-quick", "claude-app"];
export type TargetId = (typeof TARGET_IDS)[number];
interface BaseTarget {
    id: TargetId;
    label: string;
    launchIcon: string;
    focusIcon: string;
}
export type TerminalTarget = BaseTarget & {
    kind: "terminal";
    command: string;
    detectCommand: string;
};
export type GuiTarget = BaseTarget & {
    kind: "gui";
    appName: string;
    bundleId: string;
    newSession: "cmd-n" | "none";
};
export type LaunchTarget = TerminalTarget | GuiTarget;
export declare const TARGETS: Record<TargetId, LaunchTarget>;
export declare function getTarget(id: string): LaunchTarget | undefined;
export {};
