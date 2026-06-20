import { test, expect } from "bun:test";
import { CmuxBackend } from "./cmux-backend.js";
import type { CmuxRunner } from "./types.js";

/** Records every cmux invocation and returns scripted stdout per call. */
function recorder(responses: string[] = []) {
  const calls: string[][] = [];
  let i = 0;
  const run: CmuxRunner = async (args) => {
    calls.push(args);
    return responses[i++] ?? "";
  };
  return { calls, run };
}

test("name is cmux and checkPermission is always true", async () => {
  const { run } = recorder();
  const b = new CmuxBackend(run);
  expect(b.name).toBe("cmux");
  expect(await b.checkPermission()).toBe(true);
});

test("focus brings cmux to the foreground", async () => {
  const { calls, run } = recorder();
  const b = new CmuxBackend(run);
  expect(await b.focus()).toBe("ok");
  expect(calls).toEqual([["set-app-focus", "active"]]);
});

test("send types text as raw keystrokes with no implicit newline", async () => {
  const { calls, run } = recorder();
  const b = new CmuxBackend(run);
  await b.send("y");
  expect(calls).toEqual([["send", "--", "y"]]);
});

test("sendKey passes the key through to cmux send-key", async () => {
  const { calls, run } = recorder();
  const b = new CmuxBackend(run);
  await b.sendKey("escape");
  await b.sendKey("return");
  expect(calls).toEqual([
    ["send-key", "escape"],
    ["send-key", "return"],
  ]);
});

test("openTab creates a surface then runs the command in it", async () => {
  const { calls, run } = recorder(["OK surface:9 pane:1 workspace:1"]);
  const b = new CmuxBackend(run);
  await b.openTab("cd /tmp && kiro-cli chat");
  expect(calls[0]).toEqual(["new-surface", "--type", "terminal"]);
  expect(calls[1]).toEqual(["send", "--surface", "surface:9", "--", "cd /tmp && kiro-cli chat\n"]);
});

test("openTab throws if new-surface returns no surface ref (avoids clobbering the current surface)", async () => {
  const { run } = recorder([""]);
  const b = new CmuxBackend(run);
  expect(b.openTab("kiro-cli chat")).rejects.toThrow(/surface ref/);
});

test("nextAlertTab opens the first notification, focuses app, returns ok", async () => {
  const id = "11111111-2222-3333-4444-555555555555";
  const { calls, run } = recorder([`[{"id":"${id}","surface_ref":"surface:2"}]`]);
  const b = new CmuxBackend(run);
  expect(await b.nextAlertTab()).toBe("ok");
  expect(calls[0]).toEqual(["list-notifications", "--json"]);
  expect(calls[1]).toEqual(["open-notification", "--id", id]);
  expect(calls[2]).toEqual(["set-app-focus", "active"]);
});

test("nextAlertTab returns none when no notifications", async () => {
  const { calls, run } = recorder(["[\n\n]"]);
  const b = new CmuxBackend(run);
  expect(await b.nextAlertTab()).toBe("none");
  expect(calls).toEqual([["list-notifications", "--json"]]);
});

test("cycleTab focuses the surface after the selected one", async () => {
  const { calls, run } = recorder([
    "* surface:1  Terminal  [selected]\n  surface:2  Terminal\n  surface:3  Terminal",
  ]);
  const b = new CmuxBackend(run);
  expect(await b.cycleTab()).toBe("ok");
  expect(calls[0]).toEqual(["list-pane-surfaces"]);
  expect(calls[1]).toEqual(["move-surface", "--surface", "surface:2", "--focus", "true"]);
});

test("cycleTab wraps from the last surface to the first", async () => {
  const { calls, run } = recorder([
    "  surface:1  Terminal\n  surface:2  Terminal\n* surface:3  Terminal  [selected]",
  ]);
  const b = new CmuxBackend(run);
  expect(await b.cycleTab()).toBe("ok");
  expect(calls[1]).toEqual(["move-surface", "--surface", "surface:1", "--focus", "true"]);
});

test("cycleTab returns none when fewer than two surfaces", async () => {
  const { run } = recorder(["* surface:1  Terminal  [selected]"]);
  const b = new CmuxBackend(run);
  expect(await b.cycleTab()).toBe("none");
});
