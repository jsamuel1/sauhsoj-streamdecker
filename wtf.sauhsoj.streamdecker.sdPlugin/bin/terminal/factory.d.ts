import type { TerminalBackend, BackendName } from "./types.js";
export interface BackendProbe {
    cmuxRunning: boolean;
    cmuxOnPath: boolean;
    running: BackendName[];
}
/** Pure selection logic: given the configured app and runtime probe, pick a backend name. */
export declare function resolveBackendName(app: string, probe: BackendProbe): BackendName;
export declare function getTerminalBackend(): Promise<TerminalBackend>;
/** Reset the cached backend (used by tests and after config changes). */
export declare function resetBackendCache(): void;
