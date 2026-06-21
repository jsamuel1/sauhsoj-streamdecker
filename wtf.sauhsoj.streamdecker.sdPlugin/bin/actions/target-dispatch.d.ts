import { type TargetId } from "../targets.js";
/** Launch a target: terminal → new tab (new session); gui → open + Cmd+N. */
export declare function launchTarget(id: TargetId, folder?: string): Promise<void>;
/** Focus a target: terminal → focus tab running its command; gui → bring to front. */
export declare function focusTarget(id: TargetId): Promise<void>;
