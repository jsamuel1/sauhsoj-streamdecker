declare const TERMINALS: readonly ["iTerm", "Terminal", "Warp", "WezTerm"];
type TerminalApp = (typeof TERMINALS)[number];
/**
 * Detect which terminal is running kiro-cli
 */
export declare function detectTerminal(): Promise<TerminalApp | null>;
/**
 * Run AppleScript and return result
 */
export declare function runAppleScript(script: string): Promise<string>;
/**
 * Focus a terminal app
 */
export declare function focusApp(app: string): Promise<void>;
/**
 * Send keystroke to frontmost app
 */
export declare function sendKeystroke(key: string): Promise<void>;
/**
 * Send command followed by return
 */
export declare function sendCommand(cmd: string): Promise<void>;
/**
 * Run an AppleScript file
 */
export declare function runAppleScriptFile(filename: string): Promise<string>;
export {};
