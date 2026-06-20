import { test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import {
  parseSurfaceRefs,
  parseCurrentSurfaceRef,
  parseFirstNotificationId,
  nextSurfaceRef,
} from "./parse.js";

const fx = (name: string) => readFileSync(join(import.meta.dir, "__fixtures__", name), "utf-8");

test("parseSurfaceRefs extracts surface refs in printed order", () => {
  const refs = parseSurfaceRefs(fx("list-pane-surfaces.txt"));
  expect(refs).toEqual(["surface:1", "surface:2", "surface:3"]);
});

test("parseSurfaceRefs returns a single ref for a single surface", () => {
  expect(parseSurfaceRefs(fx("list-pane-surfaces-single.txt"))).toEqual(["surface:1"]);
});

test("parseSurfaceRefs returns [] for empty output", () => {
  expect(parseSurfaceRefs("")).toEqual([]);
});

test("parseCurrentSurfaceRef finds the [selected] / *-marked surface", () => {
  expect(parseCurrentSurfaceRef(fx("list-pane-surfaces.txt"))).toBe("surface:1");
  expect(parseCurrentSurfaceRef(fx("list-pane-surfaces-single.txt"))).toBe("surface:1");
});

test("parseCurrentSurfaceRef returns undefined when nothing is marked", () => {
  expect(parseCurrentSurfaceRef("  surface:2  Terminal")).toBeUndefined();
});

test("parseFirstNotificationId returns the first uuid from --json output", () => {
  expect(parseFirstNotificationId(fx("list-notifications.json"))).toBe(
    "11111111-2222-3333-4444-555555555555"
  );
});

test("parseFirstNotificationId returns null when there are no notifications", () => {
  expect(parseFirstNotificationId(fx("list-notifications-empty.json"))).toBeNull();
  expect(parseFirstNotificationId("No notifications")).toBeNull();
});

test("parseFirstNotificationId prefers the .id field over an earlier UUID-shaped field", () => {
  const json = JSON.stringify([
    { created_at: "00000000-0000-0000-0000-000000000000", id: "11111111-2222-3333-4444-555555555555" },
  ]);
  expect(parseFirstNotificationId(json)).toBe("11111111-2222-3333-4444-555555555555");
});

test("nextSurfaceRef wraps around and handles edge cases", () => {
  expect(nextSurfaceRef(["surface:1", "surface:2", "surface:3"], "surface:2")).toBe("surface:3");
  expect(nextSurfaceRef(["surface:1", "surface:2", "surface:3"], "surface:3")).toBe("surface:1");
  expect(nextSurfaceRef(["surface:1"], "surface:1")).toBeNull();
  expect(nextSurfaceRef([], undefined)).toBeNull();
  expect(nextSurfaceRef(["surface:1", "surface:2"], undefined)).toBe("surface:2");
  expect(nextSurfaceRef(["surface:1", "surface:2"], "surface:9")).toBe("surface:1");
});
