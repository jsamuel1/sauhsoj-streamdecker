export declare function setActiveTerminal(app: string | null): void;
export declare function getActiveTerminal(): string | null;
export declare function focusTerminal(): Promise<void>;
export declare function sendKeystroke(key: string): Promise<void>;
export declare function sendCommand(cmd: string): Promise<void>;
