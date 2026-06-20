/**
 * Find and focus the terminal tab running kiro-cli.
 */
export declare function focusKiro(): Promise<boolean>;
/**
 * Cycle to the next kiro-cli tab/surface.
 */
export declare function cycleKiroTabs(): Promise<void>;
/**
 * Jump to the next tab/surface needing attention.
 */
export declare function alertIdleKiro(): Promise<void>;
export declare function sendYes(): Promise<void>;
export declare function sendNo(): Promise<void>;
export declare function sendTrust(): Promise<void>;
export declare function switchAgent(name: string): Promise<void>;
/**
 * Get list of available agents.
 */
export declare function getAgentList(): string[];
export declare function launchKiro(): Promise<void>;
/**
 * Launch kiro-cli with folder picker.
 */
export declare function launchKiroWithPicker(): Promise<void>;
/**
 * Launch kiro-cli in a specific folder.
 */
export declare function launchKiroInFolder(folder: string): Promise<void>;
