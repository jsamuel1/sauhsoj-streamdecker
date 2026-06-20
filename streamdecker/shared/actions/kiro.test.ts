import { test, expect, mock } from "bun:test";

const calls: string[] = [];
const fakeBackend = {
  name: "cmux" as const,
  checkPermission: async () => true,
  focus: async () => {
    calls.push("focus");
    return "ok" as const;
  },
  cycleTab: async () => {
    calls.push("cycleTab");
    return "ok" as const;
  },
  nextAlertTab: async () => {
    calls.push("nextAlertTab");
    return "ok" as const;
  },
  openTab: async (c: string) => {
    calls.push(`openTab:${c}`);
  },
  send: async (t: string) => {
    calls.push(`send:${t}`);
  },
  sendKey: async (k: string) => {
    calls.push(`sendKey:${k}`);
  },
};

mock.module("../terminal/factory.js", () => ({
  getTerminalBackend: async () => fakeBackend,
  resetBackendCache: () => {},
}));
mock.module("../config/loader.js", () => ({
  getConfig: () => ({ terminal: { app: "cmux", detectCommand: "kiro-cli" }, agents: { recent: [] } }),
  addRecentAgent: () => {},
}));

const { focusKiro, sendYes, sendNo, sendTrust, cycleKiroTabs, alertIdleKiro, switchAgent, launchKiroInFolder } =
  await import("./kiro.js");

test("focusKiro delegates to backend.focus", async () => {
  calls.length = 0;
  expect(await focusKiro()).toBe(true);
  expect(calls).toEqual(["focus"]);
});

test("sendYes/No/Trust send the right characters", async () => {
  calls.length = 0;
  await sendYes();
  await sendNo();
  await sendTrust();
  expect(calls).toEqual(["send:y", "send:n", "send:t"]);
});

test("cycleKiroTabs and alertIdleKiro delegate", async () => {
  calls.length = 0;
  await cycleKiroTabs();
  await alertIdleKiro();
  expect(calls).toEqual(["cycleTab", "nextAlertTab"]);
});

test("switchAgent sends the agent switch command and submits it", async () => {
  calls.length = 0;
  await switchAgent("git");
  expect(calls).toEqual(["send:/agent switch git", "sendKey:return"]);
});

test("launchKiroInFolder opens a tab with cd + kiro-cli chat", async () => {
  calls.length = 0;
  await launchKiroInFolder("/Users/me/proj");
  expect(calls).toEqual([`openTab:cd "/Users/me/proj" && kiro-cli chat`]);
});
