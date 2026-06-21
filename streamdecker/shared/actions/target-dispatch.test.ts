import { test, expect, mock } from "bun:test";

const backendCalls: string[] = [];
const fakeBackend = {
  name: "cmux" as const,
  checkPermission: async () => true,
  focus: async (cmd?: string) => { backendCalls.push(`focus:${cmd}`); return "ok" as const; },
  cycleTab: async () => "ok" as const,
  nextAlertTab: async () => "ok" as const,
  openTab: async (c: string) => { backendCalls.push(`openTab:${c}`); },
  send: async () => {},
  sendKey: async () => {},
};
const appCalls: string[] = [];

mock.module("../terminal/factory.js", () => ({
  getTerminalBackend: async () => fakeBackend,
  resetBackendCache: () => {},
}));
mock.module("../app-launcher.js", () => ({
  launchApp: async (t: { appName: string }) => { appCalls.push(`launchApp:${t.appName}`); },
  activateApp: async (name: string) => { appCalls.push(`activateApp:${name}`); },
}));

const { launchTarget, focusTarget } = await import("./target-dispatch.js");

test("launchTarget terminal opens a new tab with the command", async () => {
  backendCalls.length = 0;
  await launchTarget("kiro-cli");
  expect(backendCalls).toEqual(["openTab:kiro-cli chat"]);
});

test("launchTarget terminal with folder cds first", async () => {
  backendCalls.length = 0;
  await launchTarget("claude-code", "/Users/me/proj");
  expect(backendCalls).toEqual([`openTab:cd "/Users/me/proj" && claude`]);
});

test("focusTarget terminal focuses by detectCommand", async () => {
  backendCalls.length = 0;
  await focusTarget("claude-code");
  expect(backendCalls).toEqual(["focus:claude"]);
});

test("launchTarget gui calls launchApp; focusTarget gui calls activateApp", async () => {
  appCalls.length = 0;
  await launchTarget("amazon-quick");
  await focusTarget("claude-app");
  expect(appCalls).toEqual(["launchApp:Amazon Quick", "activateApp:Claude"]);
});

test("folder is ignored for gui targets", async () => {
  appCalls.length = 0;
  await launchTarget("claude-app", "/Users/me/proj");
  expect(appCalls).toEqual(["launchApp:Claude"]);
});

test("unknown target throws", async () => {
  expect(launchTarget("nope" as never)).rejects.toThrow(/Unknown target/);
});
