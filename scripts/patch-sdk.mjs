#!/usr/bin/env node
// Patch @elgato/streamdeck to support Neo controller events
// Run this after npm install

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const connectionPath = join(
  __dirname,
  "../node_modules/@elgato/streamdeck/dist/plugin/connection.js"
);

const PATCH_MARKER = "// NEO_PATCH_APPLIED";

try {
  let content = readFileSync(connectionPath, "utf-8");

  if (content.includes(PATCH_MARKER)) {
    console.log("[Neo Patch] Already applied, skipping");
    process.exit(0);
  }

  // Find the onmessage handler and wrap it to filter Neo events
  const originalLine = "webSocket.onmessage = (ev) => this.tryEmit(ev);";
  const patchedLine = `${PATCH_MARKER}
            webSocket.onmessage = (ev) => {
                try {
                    const data = JSON.parse(ev.data);
                    if (data.payload?.controller === "Neo") {
                        // Emit as a custom event that won't trigger KeyAction creation
                        this.emit("neoEvent", data);
                        return;
                    }
                } catch {}
                this.tryEmit(ev);
            };`;

  if (!content.includes(originalLine)) {
    console.error("[Neo Patch] Could not find target line to patch");
    process.exit(1);
  }

  content = content.replace(originalLine, patchedLine);
  writeFileSync(connectionPath, content);
  console.log("[Neo Patch] Successfully patched connection.js");
} catch (err) {
  console.error("[Neo Patch] Failed:", err);
  process.exit(1);
}
