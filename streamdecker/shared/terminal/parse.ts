// Parsers for `cmux` CLI output. Formats verified live and documented in NOTES.md.

const SURFACE_REF = /\bsurface:\w+\b/;
const UUID = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

/** Extract surface refs (e.g. "surface:4") from `cmux list-pane-surfaces`, in printed order. */
export function parseSurfaceRefs(output: string): string[] {
  const refs: string[] = [];
  for (const line of output.split("\n")) {
    const m = line.match(SURFACE_REF);
    if (m) refs.push(m[0]);
  }
  return refs;
}

/**
 * The focused surface ref from `cmux list-pane-surfaces`, or undefined.
 * The focused line is marked with a leading `*` and/or a trailing `[selected]`.
 */
export function parseCurrentSurfaceRef(output: string): string | undefined {
  for (const line of output.split("\n")) {
    const isMarked = line.trimStart().startsWith("*") || line.includes("[selected]");
    if (!isMarked) continue;
    const m = line.match(SURFACE_REF);
    if (m) return m[0];
  }
  return undefined;
}

/** First notification id (uuid) from `cmux list-notifications --json`, or null if none. */
export function parseFirstNotificationId(jsonText: string): string | null {
  const m = jsonText.match(UUID);
  return m ? m[0] : null;
}

/** Given ordered refs and the current ref, return the next (wrapping). null if <2 refs. */
export function nextSurfaceRef(refs: string[], current: string | undefined): string | null {
  if (refs.length < 2) return null;
  if (!current) return refs[1] ?? refs[0];
  const i = refs.indexOf(current);
  if (i === -1) return refs[0];
  return refs[(i + 1) % refs.length];
}
