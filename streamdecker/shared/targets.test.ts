import { test, expect } from "bun:test";
import { TARGETS, getTarget } from "./targets.js";

test("all four targets are present with required fields", () => {
  expect(Object.keys(TARGETS).sort()).toEqual([
    "amazon-quick",
    "claude-app",
    "claude-code",
    "kiro-cli",
  ]);
  for (const t of Object.values(TARGETS)) {
    expect(t.label.length).toBeGreaterThan(0);
    expect(t.launchIcon.length).toBeGreaterThan(0);
    expect(t.focusIcon.length).toBeGreaterThan(0);
  }
});

test("terminal targets carry command + detectCommand", () => {
  const k = getTarget("kiro-cli")!;
  expect(k.kind).toBe("terminal");
  if (k.kind === "terminal") {
    expect(k.command).toBe("kiro-cli chat");
    expect(k.detectCommand).toBe("kiro-cli");
  }
  const c = getTarget("claude-code")!;
  if (c.kind === "terminal") expect(c.command).toBe("claude");
});

test("gui targets carry appName/bundleId/newSession", () => {
  const q = getTarget("amazon-quick")!;
  expect(q.kind).toBe("gui");
  if (q.kind === "gui") {
    expect(q.appName).toBe("Amazon Quick");
    expect(q.bundleId).toBe("com.amazon.QuickWork.mac");
    expect(q.newSession).toBe("cmd-n");
  }
  const cl = getTarget("claude-app")!;
  if (cl.kind === "gui") expect(cl.appName).toBe("Claude");
});

test("getTarget returns undefined for unknown id", () => {
  expect(getTarget("nope")).toBeUndefined();
});
