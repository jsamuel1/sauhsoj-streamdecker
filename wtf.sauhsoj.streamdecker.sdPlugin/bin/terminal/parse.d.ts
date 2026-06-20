/** Extract surface refs (e.g. "surface:4") from `cmux list-pane-surfaces`, in printed order. */
export declare function parseSurfaceRefs(output: string): string[];
/**
 * The focused surface ref from `cmux list-pane-surfaces`, or undefined.
 * The focused line is marked with a leading `*` and/or a trailing `[selected]`.
 */
export declare function parseCurrentSurfaceRef(output: string): string | undefined;
/** First notification id (uuid) from `cmux list-notifications --json`, or null if none. */
export declare function parseFirstNotificationId(jsonText: string): string | null;
/** Given ordered refs and the current ref, return the next (wrapping). null if <2 refs. */
export declare function nextSurfaceRef(refs: string[], current: string | undefined): string | null;
