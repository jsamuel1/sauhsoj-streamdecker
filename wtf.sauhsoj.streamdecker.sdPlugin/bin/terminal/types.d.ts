/** Terminal backends streamdecker can drive. */
export type BackendName = "cmux" | "iTerm" | "Terminal" | "Warp" | "WezTerm";
/** "ok" = action succeeded; "none" = nothing to act on (caller shows a Stream Deck alert). */
export type FocusResult = "ok" | "none";
/** Runs `cmux <args>` and resolves stdout (trimmed). Injectable for tests. */
export type CmuxRunner = (args: string[]) => Promise<string>;
/** Runs an AppleScript source string and resolves stdout (trimmed). Injectable for tests. */
export type AppleScriptRunner = (script: string) => Promise<string>;
export interface TerminalBackend {
    readonly name: BackendName;
    /** AppleScript automation permission probe; cmux has none, returns true. */
    checkPermission(): Promise<boolean>;
    /** Bring the kiro terminal to the foreground. */
    focus(): Promise<FocusResult>;
    /** Switch to the next tab/surface. */
    cycleTab(): Promise<FocusResult>;
    /** Jump to the tab/surface needing attention. */
    nextAlertTab(): Promise<FocusResult>;
    /** Open a new tab/surface running `command`. */
    openTab(command: string): Promise<void>;
    /** Type text into the focused surface as raw keystrokes — no implicit Enter. */
    send(text: string): Promise<void>;
    /** Send a key event (e.g. "escape", "return", "ctrl+c"). */
    sendKey(key: string): Promise<void>;
}
