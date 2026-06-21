import { test, expect } from "bun:test";
import { targetIconDataUrl } from "./target-image.js";

test("returns a png data URL for an existing icon (kiro-launch)", () => {
  const url = targetIconDataUrl("kiro-launch");
  expect(url?.startsWith("data:image/png;base64,")).toBe(true);
});

test("returns null for a missing icon", () => {
  expect(targetIconDataUrl("does-not-exist-xyz")).toBeNull();
});
