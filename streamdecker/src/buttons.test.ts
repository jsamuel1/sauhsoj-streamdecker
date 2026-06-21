import { test, expect } from "bun:test";
import { resolveButtonIcon, resolveButtonLabel, buttonsByPosition } from "./buttons.js";
import type { Button } from "../shared/config/schema.js";

const b = (o: Partial<Button>): Button => ({ position: 0, action: "kiro.focus", ...o }) as Button;

test("resolveButtonIcon: explicit icon wins", () => {
  expect(resolveButtonIcon(b({ icon: "custom" }))).toBe("custom");
});

test("resolveButtonIcon: kiro default by action", () => {
  expect(resolveButtonIcon(b({ action: "kiro.trust" }))).toBe("kiro-trust");
  expect(resolveButtonIcon(b({ action: "kiro.agent.picker" }))).toBe("kiro-agent");
});

test("resolveButtonIcon: target action derives from the target", () => {
  expect(resolveButtonIcon(b({ action: "target.launch", target: "claude-code" }))).toBe("claude-code-launch");
  expect(resolveButtonIcon(b({ action: "target.focus", target: "claude-app" }))).toBe("claude-app-focus");
});

test("resolveButtonIcon: target action with no target falls through to null", () => {
  expect(resolveButtonIcon(b({ action: "target.launch" }))).toBeNull();
});

test("resolveButtonLabel: explicit, kiro default, and target-derived", () => {
  expect(resolveButtonLabel(b({ label: "Hi" }))).toBe("Hi");
  expect(resolveButtonLabel(b({ action: "kiro.cycle" }))).toBe("Cycle");
  expect(resolveButtonLabel(b({ action: "target.launch", target: "amazon-quick" }))).toBe("Quick");
});

test("buttonsByPosition: orders by position and fills gaps with null", () => {
  const arr = buttonsByPosition([b({ position: 2, action: "kiro.no" }), b({ position: 0, action: "kiro.yes" })], 4);
  expect(arr.length).toBe(4);
  expect(arr[0]?.action).toBe("kiro.yes");
  expect(arr[1]).toBeNull();
  expect(arr[2]?.action).toBe("kiro.no");
  expect(arr[3]).toBeNull();
});
