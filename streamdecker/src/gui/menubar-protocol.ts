// Pure encode/decode for the stdio protocol shared with native/menubar/main.swift.

export interface MenuItemDef {
  id?: number;
  title?: string;
  enabled?: boolean;
  separator?: boolean;
}

export interface MenuDef {
  icon: string; // base64 PNG (may be empty)
  tooltip: string;
  items: MenuItemDef[];
}

export type HelperMessage = { type: "ready" } | { type: "click"; id: number };

/** Serialize the init message as a single newline-terminated JSON line. */
export function buildInitMessage(menu: MenuDef): string {
  return JSON.stringify(menu) + "\n";
}

/** Parse one line of helper stdout into a known message, or null if irrelevant/invalid. */
export function parseHelperLine(line: string): HelperMessage | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let msg: unknown;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (typeof msg !== "object" || msg === null) return null;

  const record = msg as Record<string, unknown>;
  if (record.type === "ready") return { type: "ready" };
  if (record.type === "click" && typeof record.id === "number") {
    return { type: "click", id: record.id };
  }
  return null;
}
