import type { TerminalBackend, FocusResult, CmuxRunner } from "./types.js";
export declare class CmuxBackend implements TerminalBackend {
    readonly name: "cmux";
    private run;
    constructor(runner?: CmuxRunner);
    checkPermission(): Promise<boolean>;
    focus(_detectCommand?: string): Promise<FocusResult>;
    send(text: string): Promise<void>;
    sendKey(key: string): Promise<void>;
    openTab(command: string): Promise<void>;
    nextAlertTab(): Promise<FocusResult>;
    cycleTab(): Promise<FocusResult>;
}
