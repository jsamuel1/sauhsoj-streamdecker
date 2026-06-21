# Launch & Focus Targets — Implementation Plan (Plan 1 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add configurable **Launch** (new session) and **Focus** (bring to front) of four targets — `kiro-cli`, `claude-code`, `amazon-quick`, `claude-app` — to the Elgato plugin, behind a reusable shared core, with house-style per-target icons.

**Architecture:** A pure target **registry** (`shared/targets.ts`) drives a **dispatcher** (`shared/actions/target-dispatch.ts`) that routes terminal targets through the existing `TerminalBackend` (`openTab` / generalized `focus(detectCommand)`) and GUI targets through a new `shared/app-launcher.ts` (`open -a` + ⌘N). Two Elgato `SingletonAction`s expose Launch/Focus with a per-key target dropdown. Icons are generated in the repo's Bedrock pipeline.

**Tech Stack:** TypeScript, Bun (`bun test`), `@elgato/streamdeck` (plugin only), rollup, macOS `open`/`osascript`, Amazon Titan Image Generator v2 (Bedrock) for icons.

**Scope note:** This plan is Elgato-plugin + shared core. Making the **standalone** app config-driven so it can use these targets is **Plan 2** (separate plan), which depends on the registry/dispatcher built here.

---

## Working agreements

- **Branch:** `feat/launch-focus-targets` (already checked out).
- **Test runner:** `bun test` from `streamdecker/`. Tests colocated as `*.test.ts`.
- **Constraint:** `shared/targets.ts`, `shared/app-launcher.ts`, `shared/actions/target-dispatch.ts`, `shared/actions/target-image.ts`, and `shared/terminal/*` MUST NOT import `@elgato/streamdeck` (keeps `bun test` working). Only the Elgato action classes import it.
- **Injection for tests:** `app-launcher` takes injectable runners; dispatcher tests mock `../terminal/factory.js` and `../app-launcher.js` via `mock.module`.
- Commit after each task; end commit bodies with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File structure

| File | Responsibility |
|---|---|
| `streamdecker/shared/targets.ts` | Target registry + types (pure data) |
| `streamdecker/shared/targets.test.ts` | Registry tests |
| `streamdecker/shared/app-launcher.ts` | GUI launch/focus via `open -a` + ⌘N |
| `streamdecker/shared/app-launcher.test.ts` | Launcher argv/keystroke tests |
| `streamdecker/shared/terminal/types.ts` | `focus(detectCommand?)` signature (modify) |
| `streamdecker/shared/terminal/applescript-backend.ts` | focus honors detectCommand (modify) |
| `streamdecker/shared/terminal/cmux-backend.ts` | focus accepts/ignores detectCommand (modify) |
| `streamdecker/shared/actions/target-dispatch.ts` | `launchTarget`/`focusTarget` routing |
| `streamdecker/shared/actions/target-dispatch.test.ts` | Dispatch routing tests |
| `streamdecker/shared/actions/target-image.ts` | Resolve a target icon → data URL |
| `streamdecker/shared/actions/target-image.test.ts` | Icon-resolution test |
| `streamdecker/shared/actions/launch-target.ts` | Elgato LaunchTargetAction |
| `streamdecker/shared/actions/focus-target.ts` | Elgato FocusTargetAction |
| `wtf.sauhsoj.streamdecker.sdPlugin/ui/launch-target.html` | PI: target + folder |
| `wtf.sauhsoj.streamdecker.sdPlugin/ui/focus-target.html` | PI: target |
| `wtf.sauhsoj.streamdecker.sdPlugin/manifest.json` | Register both actions (modify) |
| `streamdecker/native/.../icons` (Bedrock) | Generated icon PNGs → `shared/icons/` + plugin imgs |

---

## Task 1: Target registry

**Files:**
- Create: `streamdecker/shared/targets.ts`
- Test: `streamdecker/shared/targets.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// streamdecker/shared/targets.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd streamdecker && bun test shared/targets.test.ts`
Expected: FAIL — `./targets.js` missing.

- [ ] **Step 3: Write `targets.ts`**

```ts
// streamdecker/shared/targets.ts
export type TargetId = "kiro-cli" | "claude-code" | "amazon-quick" | "claude-app";

interface BaseTarget {
  id: TargetId;
  label: string;
  launchIcon: string; // icon base-name for Launch
  focusIcon: string;  // icon base-name for Focus
}

export type TerminalTarget = BaseTarget & {
  kind: "terminal";
  command: string;        // run in a new tab (a new tab is a new session)
  detectCommand: string;  // used by Focus to find the right tab
};

export type GuiTarget = BaseTarget & {
  kind: "gui";
  appName: string;        // for `open -a`
  bundleId: string;
  newSession: "cmd-n" | "none"; // how Launch starts a new conversation
};

export type LaunchTarget = TerminalTarget | GuiTarget;

export const TARGETS: Record<TargetId, LaunchTarget> = {
  "kiro-cli": {
    id: "kiro-cli", label: "Kiro", kind: "terminal",
    command: "kiro-cli chat", detectCommand: "kiro-cli",
    launchIcon: "kiro-launch", focusIcon: "kiro-focus",
  },
  "claude-code": {
    id: "claude-code", label: "Claude Code", kind: "terminal",
    command: "claude", detectCommand: "claude",
    launchIcon: "claude-code-launch", focusIcon: "claude-code-focus",
  },
  "amazon-quick": {
    id: "amazon-quick", label: "Quick", kind: "gui",
    appName: "Amazon Quick", bundleId: "com.amazon.QuickWork.mac", newSession: "cmd-n",
    launchIcon: "amazon-quick-launch", focusIcon: "amazon-quick-focus",
  },
  "claude-app": {
    id: "claude-app", label: "Claude", kind: "gui",
    appName: "Claude", bundleId: "com.anthropic.claudefordesktop", newSession: "cmd-n",
    launchIcon: "claude-app-launch", focusIcon: "claude-app-focus",
  },
};

export function getTarget(id: string): LaunchTarget | undefined {
  return (TARGETS as Record<string, LaunchTarget>)[id];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd streamdecker && bun test shared/targets.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add streamdecker/shared/targets.ts streamdecker/shared/targets.test.ts
git commit -m "feat(targets): Add launch/focus target registry"
```

---

## Task 2: App launcher (GUI targets)

**Files:**
- Create: `streamdecker/shared/app-launcher.ts`
- Test: `streamdecker/shared/app-launcher.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// streamdecker/shared/app-launcher.test.ts
import { test, expect } from "bun:test";
import { launchApp, focusApp } from "./app-launcher.js";
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

test("focusApp only opens the app (no keystroke)", async () => {
  const r = rec();
  await focusApp("Amazon Quick", { open: r.open });
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd streamdecker && bun test shared/app-launcher.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Write `app-launcher.ts`**

```ts
// streamdecker/shared/app-launcher.ts
import { execFile } from "child_process";
import { promisify } from "util";
import type { GuiTarget } from "./targets.js";

const execFileAsync = promisify(execFile);

export type OpenRunner = (appName: string) => Promise<void>;
export type OsaRunner = (script: string) => Promise<void>;

export interface LauncherDeps {
  open?: OpenRunner;
  osascript?: OsaRunner;
  delayMs?: number;
}

const defaultOpen: OpenRunner = async (appName) => {
  await execFileAsync("open", ["-a", appName]);
};
const defaultOsa: OsaRunner = async (script) => {
  await execFileAsync("osascript", ["-e", script]);
};

/** Bring a GUI app to the front (launching it if needed). */
export async function focusApp(appName: string, deps: Pick<LauncherDeps, "open"> = {}): Promise<void> {
  await (deps.open ?? defaultOpen)(appName);
}

/** Launch/foreground a GUI target, then start a new session if it supports cmd-n. */
export async function launchApp(target: GuiTarget, deps: LauncherDeps = {}): Promise<void> {
  const open = deps.open ?? defaultOpen;
  const osa = deps.osascript ?? defaultOsa;
  const delayMs = deps.delayMs ?? 600;

  await open(target.appName);
  if (target.newSession === "cmd-n") {
    // Give the app a moment to become frontmost before the keystroke.
    await new Promise((r) => setTimeout(r, delayMs));
    await osa('tell application "System Events" to keystroke "n" using command down');
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd streamdecker && bun test shared/app-launcher.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add streamdecker/shared/app-launcher.ts streamdecker/shared/app-launcher.test.ts
git commit -m "feat(targets): Add GUI app launcher (open -a + Cmd+N)"
```

---

## Task 3: Generalize TerminalBackend.focus(detectCommand?)

Lets Focus target a specific terminal command (`claude` vs `kiro-cli`). Backward compatible — existing no-arg `focus()` calls keep working.

**Files:**
- Modify: `streamdecker/shared/terminal/types.ts`
- Modify: `streamdecker/shared/terminal/applescript-backend.ts`
- Modify: `streamdecker/shared/terminal/cmux-backend.ts`
- Test: `streamdecker/shared/terminal/applescript-backend.test.ts` (add a case)

- [ ] **Step 1: Add the failing test**

Append to `streamdecker/shared/terminal/applescript-backend.test.ts`:

```ts
test("focus(detectCommand) scans for the given command, not the default", async () => {
  const { scripts, run } = recorder(["found"]);
  const b = new AppleScriptBackend("iTerm", "kiro-cli", run);
  await b.focus("claude");
  expect(scripts[0]).toContain("claude");
  expect(scripts[0]).not.toContain("kiro-cli");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd streamdecker && bun test shared/terminal/applescript-backend.test.ts`
Expected: FAIL — current `focus()` ignores the argument and uses `this.cmd` (`kiro-cli`).

- [ ] **Step 3: Make the changes**

In `types.ts`, change the interface method:
```ts
  /** Bring the kiro terminal to the foreground (optionally for a specific command). */
  focus(detectCommand?: string): Promise<FocusResult>;
```

In `applescript-backend.ts`, update `focus`:
```ts
  async focus(detectCommand?: string): Promise<FocusResult> {
    const cmd = detectCommand ?? this.cmd;
    const result = await this.run(`
      tell application "${this.name}"
        activate
        repeat with w in windows
          repeat with t in tabs of w
            set s to current session of t
            set theTty to tty of s
            set hasKiro to (do shell script "ps -t " & theTty & " -o command= | grep -q ${cmd} && echo yes || echo no")
            if hasKiro is "yes" then
              select t
              return "found"
            end if
          end repeat
        end repeat
      end tell
      return "none"
    `);
    return result === "found" ? "ok" : "none";
  }
```

In `cmux-backend.ts`, accept and ignore the argument (cmux focus is app-level):
```ts
  async focus(_detectCommand?: string): Promise<FocusResult> {
    await this.run(["set-app-focus", "active"]);
    return "ok";
  }
```

- [ ] **Step 4: Run the terminal suite**

Run: `cd streamdecker && bun test shared/terminal/`
Expected: PASS (all existing + the new focus case).

- [ ] **Step 5: Commit**

```bash
git add streamdecker/shared/terminal/types.ts streamdecker/shared/terminal/applescript-backend.ts streamdecker/shared/terminal/cmux-backend.ts streamdecker/shared/terminal/applescript-backend.test.ts
git commit -m "feat(terminal): Generalize focus() to target a specific command"
```

---

## Task 4: Target dispatcher

**Files:**
- Create: `streamdecker/shared/actions/target-dispatch.ts`
- Test: `streamdecker/shared/actions/target-dispatch.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// streamdecker/shared/actions/target-dispatch.test.ts
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
  focusApp: async (name: string) => { appCalls.push(`focusApp:${name}`); },
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

test("launchTarget gui calls launchApp; focusTarget gui calls focusApp", async () => {
  appCalls.length = 0;
  await launchTarget("amazon-quick");
  await focusTarget("claude-app");
  expect(appCalls).toEqual(["launchApp:Amazon Quick", "focusApp:Claude"]);
});

test("folder is ignored for gui targets", async () => {
  appCalls.length = 0;
  await launchTarget("claude-app", "/Users/me/proj");
  expect(appCalls).toEqual(["launchApp:Claude"]);
});

test("unknown target throws", async () => {
  expect(launchTarget("nope" as never)).rejects.toThrow(/Unknown target/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd streamdecker && bun test shared/actions/target-dispatch.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Write `target-dispatch.ts`**

```ts
// streamdecker/shared/actions/target-dispatch.ts
import { getTerminalBackend } from "../terminal/factory.js";
import { getTarget, type TargetId } from "../targets.js";
import { launchApp, focusApp } from "../app-launcher.js";

/** Launch a target: terminal → new tab (new session); gui → open + Cmd+N. */
export async function launchTarget(id: TargetId, folder?: string): Promise<void> {
  const t = getTarget(id);
  if (!t) throw new Error(`Unknown target: ${id}`);
  if (t.kind === "terminal") {
    const backend = await getTerminalBackend();
    const cmd = folder ? `cd "${folder}" && ${t.command}` : t.command;
    await backend.openTab(cmd);
  } else {
    await launchApp(t);
  }
}

/** Focus a target: terminal → focus tab running its command; gui → bring to front. */
export async function focusTarget(id: TargetId): Promise<void> {
  const t = getTarget(id);
  if (!t) throw new Error(`Unknown target: ${id}`);
  if (t.kind === "terminal") {
    const backend = await getTerminalBackend();
    await backend.focus(t.detectCommand);
  } else {
    await focusApp(t.appName);
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd streamdecker && bun test shared/actions/target-dispatch.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add streamdecker/shared/actions/target-dispatch.ts streamdecker/shared/actions/target-dispatch.test.ts
git commit -m "feat(targets): Add launch/focus dispatcher routing terminal vs gui"
```

---

## Task 5: Target icon resolver

**Files:**
- Create: `streamdecker/shared/actions/target-image.ts`
- Test: `streamdecker/shared/actions/target-image.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// streamdecker/shared/actions/target-image.test.ts
import { test, expect } from "bun:test";
import { targetIconDataUrl } from "./target-image.js";

test("returns a png data URL for an existing icon (kiro-launch)", () => {
  const url = targetIconDataUrl("kiro-launch");
  expect(url?.startsWith("data:image/png;base64,")).toBe(true);
});

test("returns null for a missing icon", () => {
  expect(targetIconDataUrl("does-not-exist-xyz")).toBeNull();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd streamdecker && bun test shared/actions/target-image.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Write `target-image.ts`**

```ts
// streamdecker/shared/actions/target-image.ts
import { readFileSync } from "fs";
import { resolveIcon } from "../config/paths.js";

/** Resolve a target icon base-name to a PNG data URL (144px), or null if absent. */
export function targetIconDataUrl(iconName: string): string | null {
  const path = resolveIcon(iconName, 144);
  if (!path) return null;
  return `data:image/png;base64,${readFileSync(path).toString("base64")}`;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd streamdecker && bun test shared/actions/target-image.test.ts`
Expected: PASS (2 tests). (`kiro-launch-144.png` exists in `shared/icons/`.)

- [ ] **Step 5: Commit**

```bash
git add streamdecker/shared/actions/target-image.ts streamdecker/shared/actions/target-image.test.ts
git commit -m "feat(targets): Add target icon data-URL resolver"
```

---

## Task 6: Elgato LaunchTargetAction

**Files:**
- Create: `streamdecker/shared/actions/launch-target.ts`

- [ ] **Step 1: Write the action**

```ts
// streamdecker/shared/actions/launch-target.ts
import streamDeck, {
  action,
  DidReceiveSettingsEvent,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
} from "@elgato/streamdeck";
import { getTarget, type TargetId } from "../targets.js";
import { launchTarget } from "./target-dispatch.js";
import { targetIconDataUrl } from "./target-image.js";

interface Settings {
  target?: TargetId;
  folder?: string;
}

@action({ UUID: "wtf.sauhsoj.streamdecker.launch-target" })
export class LaunchTargetAction extends SingletonAction {
  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    await this.applyImage(ev);
  }
  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent): Promise<void> {
    await this.applyImage(ev);
  }
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    const { target, folder } = ev.payload.settings as Settings;
    if (!target || !getTarget(target)) {
      await ev.action.showAlert();
      return;
    }
    try {
      await launchTarget(target, folder || undefined);
    } catch (err) {
      streamDeck.logger.error(`LaunchTarget failed: ${err}`);
      await ev.action.showAlert();
    }
  }

  private async applyImage(ev: WillAppearEvent | DidReceiveSettingsEvent): Promise<void> {
    const { target } = ev.payload.settings as Settings;
    const t = target ? getTarget(target) : undefined;
    if (!t) return;
    const url = targetIconDataUrl(t.launchIcon);
    if (url) await ev.action.setImage(url);
    else await ev.action.setTitle(t.label);
  }
}
```

- [ ] **Step 2: Typecheck (no unit test — needs `@elgato/streamdeck`)**

Run: `cd streamdecker && bun run typecheck`
Expected: no errors. (Action is verified via the plugin build in Task 9 and manual smoke.)

- [ ] **Step 3: Commit**

```bash
git add streamdecker/shared/actions/launch-target.ts
git commit -m "feat(plugin): Add LaunchTarget action with per-key target"
```

---

## Task 7: Elgato FocusTargetAction

**Files:**
- Create: `streamdecker/shared/actions/focus-target.ts`

- [ ] **Step 1: Write the action**

```ts
// streamdecker/shared/actions/focus-target.ts
import streamDeck, {
  action,
  DidReceiveSettingsEvent,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
} from "@elgato/streamdeck";
import { getTarget, type TargetId } from "../targets.js";
import { focusTarget } from "./target-dispatch.js";
import { targetIconDataUrl } from "./target-image.js";

interface Settings {
  target?: TargetId;
}

@action({ UUID: "wtf.sauhsoj.streamdecker.focus-target" })
export class FocusTargetAction extends SingletonAction {
  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    await this.applyImage(ev);
  }
  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent): Promise<void> {
    await this.applyImage(ev);
  }
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    const { target } = ev.payload.settings as Settings;
    if (!target || !getTarget(target)) {
      await ev.action.showAlert();
      return;
    }
    try {
      await focusTarget(target);
    } catch (err) {
      streamDeck.logger.error(`FocusTarget failed: ${err}`);
      await ev.action.showAlert();
    }
  }

  private async applyImage(ev: WillAppearEvent | DidReceiveSettingsEvent): Promise<void> {
    const { target } = ev.payload.settings as Settings;
    const t = target ? getTarget(target) : undefined;
    if (!t) return;
    const url = targetIconDataUrl(t.focusIcon);
    if (url) await ev.action.setImage(url);
    else await ev.action.setTitle(t.label);
  }
}
```

- [ ] **Step 2: Register both actions in the plugin entrypoint**

In `streamdecker/shared/plugin.ts`, import and register the new actions alongside the existing ones:
```ts
import { LaunchTargetAction } from "./actions/launch-target.js";
import { FocusTargetAction } from "./actions/focus-target.js";
// ...
streamDeck.actions.registerAction(new LaunchTargetAction());
streamDeck.actions.registerAction(new FocusTargetAction());
```
(Match the existing registration style in that file.)

- [ ] **Step 3: Typecheck**

Run: `cd streamdecker && bun run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add streamdecker/shared/actions/focus-target.ts streamdecker/shared/plugin.ts
git commit -m "feat(plugin): Add FocusTarget action and register both"
```

---

## Task 8: Property-inspector UIs

**Files:**
- Create: `wtf.sauhsoj.streamdecker.sdPlugin/ui/launch-target.html`
- Create: `wtf.sauhsoj.streamdecker.sdPlugin/ui/focus-target.html`

- [ ] **Step 1: Write `launch-target.html`** (uses the sdpi-components already used by `ui/launch-folder.html`)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Launch Target</title>
  <link rel="stylesheet" href="https://sdpi-components.dev/releases/v3/sdpi-components.css" />
  <script src="https://sdpi-components.dev/releases/v3/sdpi-components.js"></script>
</head>
<body>
  <sdpi-item label="Target">
    <sdpi-select setting="target" default="kiro-cli">
      <option value="kiro-cli">Kiro</option>
      <option value="claude-code">Claude Code</option>
      <option value="amazon-quick">Amazon Quick</option>
      <option value="claude-app">Claude</option>
    </sdpi-select>
  </sdpi-item>
  <sdpi-item label="Folder (terminal only)">
    <sdpi-textfield setting="folder" placeholder="/path/to/project"></sdpi-textfield>
  </sdpi-item>
</body>
</html>
```

- [ ] **Step 2: Write `focus-target.html`** (same, without folder)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Focus Target</title>
  <link rel="stylesheet" href="https://sdpi-components.dev/releases/v3/sdpi-components.css" />
  <script src="https://sdpi-components.dev/releases/v3/sdpi-components.js"></script>
</head>
<body>
  <sdpi-item label="Target">
    <sdpi-select setting="target" default="claude-app">
      <option value="kiro-cli">Kiro</option>
      <option value="claude-code">Claude Code</option>
      <option value="amazon-quick">Amazon Quick</option>
      <option value="claude-app">Claude</option>
    </sdpi-select>
  </sdpi-item>
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add wtf.sauhsoj.streamdecker.sdPlugin/ui/launch-target.html wtf.sauhsoj.streamdecker.sdPlugin/ui/focus-target.html
git commit -m "feat(plugin): Add property inspectors for launch/focus target"
```

---

## Task 9: Register actions in the manifest and build

**Files:**
- Modify: `wtf.sauhsoj.streamdecker.sdPlugin/manifest.json`

- [ ] **Step 1: Add two entries to the `Actions` array**

Insert (use existing icon paths so the manifest validates; per-key images are set at runtime):
```json
{
  "UUID": "wtf.sauhsoj.streamdecker.launch-target",
  "Name": "Launch Target",
  "Icon": "imgs/actions/focus-kiro/icon",
  "Tooltip": "Launch a new session of kiro-cli, Claude Code, Amazon Quick, or Claude",
  "PropertyInspectorPath": "ui/launch-target.html",
  "Controllers": ["Keypad"],
  "States": [{ "Image": "imgs/actions/focus-kiro/key", "TitleAlignment": "bottom" }]
},
{
  "UUID": "wtf.sauhsoj.streamdecker.focus-target",
  "Name": "Focus Target",
  "Icon": "imgs/actions/focus-kiro/icon",
  "Tooltip": "Bring kiro-cli, Claude Code, Amazon Quick, or Claude to the front",
  "PropertyInspectorPath": "ui/focus-target.html",
  "Controllers": ["Keypad"],
  "States": [{ "Image": "imgs/actions/focus-kiro/key", "TitleAlignment": "bottom" }]
}
```

- [ ] **Step 2: Build the plugin bundle**

Run (repo root): `npm run build`
Expected: rollup writes `wtf.sauhsoj.streamdecker.sdPlugin/bin/plugin.js` with no TS errors; bundle contains `launch-target` / `focus-target`.

- [ ] **Step 3: Validate manifest JSON**

Run: `cd /Users/jsamuel/src/sauhsoj-streamdecker && python3 -c "import json; json.load(open('wtf.sauhsoj.streamdecker.sdPlugin/manifest.json')); print('manifest OK')"`
Expected: `manifest OK`.

- [ ] **Step 4: Run the full unit suite + typecheck**

Run: `cd streamdecker && bun test && bun run typecheck`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add wtf.sauhsoj.streamdecker.sdPlugin/manifest.json wtf.sauhsoj.streamdecker.sdPlugin/bin/plugin.js wtf.sauhsoj.streamdecker.sdPlugin/bin/plugin.js.map wtf.sauhsoj.streamdecker.sdPlugin/bin
git commit -m "feat(plugin): Register launch/focus target actions in manifest"
```

---

## Task 10: Generate target icons (Bedrock) — gated on AWS auth

**Prerequisite:** the user must provide working AWS credentials with Bedrock access to `amazon.titan-image-generator-v2:0` in `us-west-2`. Confirm with `aws sts get-caller-identity`. If it fails, STOP and ask the user to authenticate; the rest of the plan does not depend on this task.

**Files:**
- Create: `streamdecker/scripts/generate-target-icons.py`
- Output: `shared/icons/<name>.png`, `-96.png`, `-144.png` for the six new icons, plus copies into `wtf.sauhsoj.streamdecker.sdPlugin/imgs/actions/...` if the plugin references file icons.

- [ ] **Step 1: Verify prerequisites**

Run:
```bash
aws sts get-caller-identity >/dev/null && echo "AWS OK"
uv pip install --system boto3 pillow >/dev/null 2>&1 || pipx run --spec boto3 python -c "pass"
```
Expected: `AWS OK`. Install `boto3`+`pillow` via `uv` (or a `uv venv`).

- [ ] **Step 2: Write `generate-target-icons.py`**

Mirror `scripts/generate-icons.md`: Titan v2, 512×512, then resize to 144/96/72 and save with the naming convention. Six images:
- `claude-code-launch` / `claude-code-focus`
- `amazon-quick-launch` / `amazon-quick-focus`
- `claude-app-launch` / `claude-app-focus`

Prompt template (house style), per the spec's "Icons" section, e.g.:
```python
PROMPTS = {
  "claude-code-launch": "A cute purple ghost mascot character holding a small rocket beside a glowing terminal window with a clay-orange prompt. Dark navy background #1a1a2e. Purple body #9b7ed9, pink cheeks. Fills the entire image. App icon style, square. No borders.",
  "claude-code-focus":  "A cute purple ghost mascot character peering through a focus-ring/viewfinder at a glowing terminal window with a clay-orange prompt. Dark navy background #1a1a2e. Purple body #9b7ed9, pink cheeks. Fills the entire image. App icon style, square. No borders.",
  "amazon-quick-launch":"A cute purple ghost mascot character holding a small rocket with an orange lightning spark motif. Dark navy background #1a1a2e. Purple body #9b7ed9, pink cheeks. Fills the entire image. App icon style, square. No borders.",
  "amazon-quick-focus": "A cute purple ghost mascot character peering through a focus-ring with an orange lightning spark motif. Dark navy background #1a1a2e. Purple body #9b7ed9, pink cheeks. Fills the entire image. App icon style, square. No borders.",
  "claude-app-launch":  "A cute purple ghost mascot character holding a small rocket beside a rounded clay-orange chat bubble. Dark navy background #1a1a2e. Purple body #9b7ed9, pink cheeks. Fills the entire image. App icon style, square. No borders.",
  "claude-app-focus":   "A cute purple ghost mascot character peering through a focus-ring at a rounded clay-orange chat bubble. Dark navy background #1a1a2e. Purple body #9b7ed9, pink cheeks. Fills the entire image. App icon style, square. No borders.",
}
```
Use the boto3 invoke code from `scripts/generate-icons.md`; for each name write `shared/icons/<name>.png` (72), `<name>-96.png`, `<name>-144.png` via Pillow resize.

- [ ] **Step 3: Generate**

Run: `cd streamdecker && python scripts/generate-target-icons.py`
Expected: 18 PNGs written under `streamdecker/shared/icons/` (or repo `shared/icons/` — match where `resolveIcon` reads; see `getIconsDir()` → `shared/icons`). Verify with `ls shared/icons | grep -E "claude-code|amazon-quick|claude-app"`.

- [ ] **Step 4: Verify resolution + visual check**

Run: `cd streamdecker && bun -e 'import {targetIconDataUrl} from "./shared/actions/target-image.ts"; console.log(["claude-code-launch","amazon-quick-focus","claude-app-launch"].map(n=>!!targetIconDataUrl(n)))'`
Expected: `[ true, true, true ]`. Open a couple PNGs to confirm they look right.

- [ ] **Step 5: Commit**

```bash
git add streamdecker/scripts/generate-target-icons.py shared/icons/claude-code-* shared/icons/amazon-quick-* shared/icons/claude-app-*
git commit -m "feat(icons): Generate house-style icons for new launch/focus targets"
```

---

## Task 11: Finalize

- [ ] **Step 1:** `cd streamdecker && bun test` — all green.
- [ ] **Step 2:** `cd streamdecker && bun run typecheck` — clean.
- [ ] **Step 3:** `npm run build` (root) — plugin bundle builds.
- [ ] **Step 4: Docs** — update root `README.md` to mention the Launch/Focus Target actions (four targets; Launch = new session, Focus = front; GUI new-session uses ⌘N → needs Accessibility permission). Commit:
```bash
git add README.md
git commit -m "docs: Document Launch/Focus Target actions"
```
- [ ] **Step 5: Manual smoke** — install the plugin (or load in Stream Deck), add a Launch Target key set to each target and a Focus Target key; verify: terminal targets open a new tab / focus the right tab; GUI targets open + new conversation (⌘N, with Accessibility granted) and Focus brings to front. Confirm per-target icons render.

---

## Spec coverage check

- Per-button target selection → Tasks 6–8 (Elgato PI dropdown).
- Launch = new session (terminal new tab; gui open+⌘N) → Tasks 2, 4.
- Focus = bring to front (terminal by command; gui open -a) → Tasks 3, 4.
- Folder, terminal only → Task 4 (dispatcher).
- Target registry (4 targets) → Task 1.
- GUI ⌘N mechanism (deep-link not available) → Task 2.
- Per-target house-style icons via Bedrock → Tasks 5, 10.
- Error handling (unknown target → alert; failures logged) → Tasks 6, 7.
- Testing (unit + manual smoke) → every task; Task 11.
- Standalone config-driven consumption → **deferred to Plan 2** (separate plan).
- Out of scope (picker page, deep links, cmux per-surface focus) → untouched.
