import { readFileSync } from "fs";
import { resolveIcon } from "../config/paths.js";

/** Resolve a target icon base-name to a PNG data URL (144px), or null if absent. */
export function targetIconDataUrl(iconName: string): string | null {
  const path = resolveIcon(iconName, 144);
  if (!path) return null;
  return `data:image/png;base64,${readFileSync(path).toString("base64")}`;
}
