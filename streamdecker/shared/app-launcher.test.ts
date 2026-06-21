import { test, expect } from "bun:test";
import { launchApp, activateApp } from "./app-launcher.js";
import type { GuiTarget } from "./targets.js";

const quick: GuiTarget = {
  id: "amazon-quick", label: "Quick", kind: "gui",
  appName: "Amazon Quick", bundleId: "com.amazon.QuickWork.mac", newSession: "cmd-n",
  launchIcon: "x", focusIcon: "y",
};

function rec() {
  const opens: string[] = [];
  const scripts: string[] = [];
  return {
    opens, scripts,
    open: async (app: string) => { opens.push(app); },
    osascript: async (s: string) => { scripts.push(s); },
  };
}

test("activateApp only opens the app (no keystroke)", async () => {
  const r = rec();
  await activateApp("Amazon Quick", { open: r.open });
  expect(r.opens).toEqual(["Amazon Quick"]);
});

test("launchApp opens then sends Cmd+N for cmd-n targets", async () => {
  const r = rec();
  await launchApp(quick, { open: r.open, osascript: r.osascript, delayMs: 0 });
  expect(r.opens).toEqual(["Amazon Quick"]);
  expect(r.scripts).toHaveLength(1);
  expect(r.scripts[0]).toContain('keystroke "n" using command down');
});

test("launchApp with newSession none does not send a keystroke", async () => {
  const r = rec();
  const noNew: GuiTarget = { ...quick, newSession: "none" };
  await launchApp(noNew, { open: r.open, osascript: r.osascript, delayMs: 0 });
  expect(r.opens).toEqual(["Amazon Quick"]);
  expect(r.scripts).toEqual([]);
});
