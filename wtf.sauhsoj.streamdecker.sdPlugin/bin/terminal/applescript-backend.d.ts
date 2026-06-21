import type { TerminalBackend, FocusResult, BackendName, AppleScriptRunner } from "./types.js";
/** Drives GUI terminals (iTerm/Terminal/Warp/WezTerm) via AppleScript. */
export declare class AppleScriptBackend implements TerminalBackend {
    readonly name: BackendName;
    private cmd;
    private run;
    constructor(app: Exclude<BackendName, "cmux">, detectCommand: string, runner?: AppleScriptRunner);
    checkPermission(): Promise<boolean>;
    focus(detectCommand?: string): Promise<FocusResult>;
    cycleTab(): Promise<FocusResult>;
    nextAlertTab(): Promise<FocusResult>;
    openTab(command: string): Promise<void>;
    send(text: string): Promise<void>;
    sendKey(key: string): Promise<void>;
}
