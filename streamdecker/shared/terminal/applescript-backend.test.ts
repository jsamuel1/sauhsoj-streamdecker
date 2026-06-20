import { test, expect } from "bun:test";
import { AppleScriptBackend } from "./applescript-backend.js";
import type { AppleScriptRunner } from "./types.js";

function recorder(responses: string[] = []) {
  const scripts: string[] = [];
  let i = 0;
  const run: AppleScriptRunner = async (s) => {
    scripts.push(s);
    return responses[i++] ?? "";
  };
  return { scripts, run };
}

test("name reflects the configured app", () => {
  const { run } = recorder();
  expect(new AppleScriptBackend("iTerm", "kiro-cli", run).name).toBe("iTerm");
  expect(new AppleScriptBackend("Warp", "kiro-cli", run).name).toBe("Warp");
});

test("focus activates the app and reports ok when a kiro tab is found", async () => {
  const { scripts, run } = recorder(["found"]);
  const b = new AppleScriptBackend("iTerm", "kiro-cli", run);
  expect(await b.focus()).toBe("ok");
  expect(scripts[0]).toContain('tell application "iTerm"');
  expect(scripts[0]).toContain("activate");
  expect(scripts[0]).toContain("kiro-cli");
});

test("focus returns none when no kiro tab found", async () => {
  const { run } = recorder(["none"]);
  const b = new AppleScriptBackend("iTerm", "kiro-cli", run);
  expect(await b.focus()).toBe("none");
});

test("cycleTab and nextAlertTab return ok and target the configured app", async () => {
  const { scripts, run } = recorder(["", "", ""]);
  const b = new AppleScriptBackend("Terminal", "kiro-cli", run);
  expect(await b.cycleTab()).toBe("ok");
  expect(await b.nextAlertTab()).toBe("ok");
  expect(scripts.some((s) => s.includes('tell application "Terminal"'))).toBe(true);
  expect(scripts.some((s) => s.includes("is processing of s is false"))).toBe(true);
});

test("send focuses then types text via System Events", async () => {
  const { scripts, run } = recorder(["found", ""]);
  const b = new AppleScriptBackend("iTerm", "kiro-cli", run);
  await b.send("y");
  expect(scripts.at(-1)).toContain("keystroke");
  expect(scripts.at(-1)).toContain('"y"');
});

test("openTab creates a tab running the command", async () => {
  const { scripts, run } = recorder([""]);
  const b = new AppleScriptBackend("iTerm", "kiro-cli", run);
  await b.openTab("cd /tmp && kiro-cli chat");
  expect(scripts[0]).toContain('tell application "iTerm"');
  expect(scripts[0]).toContain("cd /tmp && kiro-cli chat");
});

test("sendKey maps escape to key code 53", async () => {
  const { scripts, run } = recorder(["", ""]);
  const b = new AppleScriptBackend("iTerm", "kiro-cli", run);
  await b.sendKey("escape");
  expect(scripts.at(-1)!.toLowerCase()).toContain("key code 53");
});

test("sendKey maps ctrl combos to keystroke using control down", async () => {
  const { scripts, run } = recorder(["", ""]);
  const b = new AppleScriptBackend("iTerm", "kiro-cli", run);
  await b.sendKey("ctrl+c");
  expect(scripts.at(-1)).toContain("control down");
  expect(scripts.at(-1)).toContain('"c"');
});
