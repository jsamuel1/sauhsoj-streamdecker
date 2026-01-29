export declare const SCRIPTS_DIR = "/Users/sauhsoj/src/personal/sauhsoj-streamdecker/wtf.sauhsoj.streamdecker.sdPlugin/scripts";
export declare function setActiveTerminal(app: string | null): void;
export declare function getActiveTerminal(): string | null;
export declare function checkiTermPermission(): Promise<boolean>;
export declare function focusTerminal(): Promise<void>;
export declare function sendKeystroke(key: string): Promise<void>;
export declare function sendCommand(cmd: string): Promise<void>;
