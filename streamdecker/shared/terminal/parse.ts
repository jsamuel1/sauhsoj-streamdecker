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

/**
 * First notification id from `cmux list-notifications --json`, or null if none.
 * Prefers the parsed array's first `id` field; falls back to a raw UUID scan for
 * non-JSON output (e.g. the plain "No notifications" line) or unexpected shapes.
 */
export function parseFirstNotificationId(jsonText: string): string | null {
  try {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return null;
      const id = parsed[0]?.id;
      if (typeof id === "string" && UUID.test(id)) return id;
    }
  } catch {
    /* not JSON (e.g. "No notifications") — fall through to regex scan */
  }
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
