interface BttTrigger {
    BTTTriggerType: number;
    BTTTriggerClass: string;
    BTTTriggerName: string;
    BTTPredefinedActionType: number;
    BTTAppleScriptString?: string;
    BTTShellScriptCommand?: string;
    BTTStreamDeckRow: number;
    BTTStreamDeckColumn: number;
    BTTStreamDeckImageHeight: number;
    BTTEnabled: number;
}
export declare function generateBttTriggers(): BttTrigger[];
export declare function exportBttTriggers(outputPath?: string): string;
export {};
