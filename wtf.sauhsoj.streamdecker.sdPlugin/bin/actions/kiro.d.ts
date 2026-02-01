/**
 * Find and focus terminal tab with kiro-cli running
 */
export declare function focusKiro(): Promise<boolean>;
/**
 * Cycle through kiro-cli tabs
 */
export declare function cycleKiroTabs(): Promise<void>;
/**
 * Find next idle kiro-cli tab (not processing)
 */
export declare function alertIdleKiro(): Promise<void>;
export declare function sendYes(): Promise<void>;
export declare function sendNo(): Promise<void>;
export declare function sendTrust(): Promise<void>;
export declare function switchAgent(name: string): Promise<void>;
/**
 * Get list of available agents
 */
export declare function getAgentList(): string[];
export declare function launchKiro(): Promise<void>;
