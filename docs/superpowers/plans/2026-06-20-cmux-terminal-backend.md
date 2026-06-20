# cmux Terminal Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cmux as a selectable terminal backend for streamdecker (standalone Bun app + Elgato plugin), driven by the `cmux` CLI, behind a `TerminalBackend` interface.

**Architecture:** A new `streamdecker/shared/terminal/` module defines a `TerminalBackend` interface with two implementations — `AppleScriptBackend` (existing iTerm/Terminal/Warp/WezTerm, lifted from the inline AppleScript in `kiro.ts`) and `CmuxBackend` (shells out to the `cmux` CLI via `execFile`). A factory resolves the backend from config + runtime detection (cmux preferred). Both consumers — `shared/actions/kiro.ts` (standalone) and the plugin `SingletonAction` classes — route terminal operations through the factory.

**Tech Stack:** TypeScript, Bun (standalone runtime + `bun test`), rollup (plugin bundle), zod (config), the `cmux` CLI, macOS `osascript`.

---

## Working agreements

- **Branch:** `feat/cmux-terminal-backend` (already created and checked out).
- **Test runner:** `bun test`, run from `streamdecker/`. Tests are colocated as `*.test.ts` next to source.
- **Critical constraint:** backend modules under `shared/terminal/` MUST NOT import `@elgato/streamdeck` (it is not a dependency of `streamdecker/package.json`; importing it breaks `bun test`). They may import only node builtins (`child_process`, `util`) and local config modules.
- **Injection for testability:** `CmuxBackend` and `AppleScriptBackend` accept an injected runner function in their constructor (default = real `execFile`-based runner), mirroring `cmux-mcp`'s `CommandExecutor` pattern, so tests assert exact argv without spawning processes.
- **Commit after every task.** Conventional commit messages. End each commit body with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

---

## File structure

| File | Responsibility |
|---|---|
| `streamdecker/shared/terminal/__fixtures__/*.txt` | Real captured `cmux` CLI output (from Task 1) used by parser tests |
| `streamdecker/shared/terminal/NOTES.md` | Captured command→output mapping from the Task 1 spike |
| `streamdecker/shared/terminal/types.ts` | `TerminalBackend` interface, `BackendName`, `FocusResult`, `CmuxRunner`/`AppleScriptRunner` types |
| `streamdecker/shared/terminal/parse.ts` | Pure parsers for `cmux` list output (surfaces, notifications, current surface) |
| `streamdecker/shared/terminal/parse.test.ts` | Parser unit tests against fixtures |
| `streamdecker/shared/terminal/cmux-backend.ts` | `CmuxBackend` implementing `TerminalBackend` |
| `streamdecker/shared/terminal/cmux-backend.test.ts` | `CmuxBackend` argv/behavior tests (mocked runner) |
| `streamdecker/shared/terminal/applescript-backend.ts` | `AppleScriptBackend` implementing `TerminalBackend` |
| `streamdecker/shared/terminal/applescript-backend.test.ts` | Script-generation tests (mocked runner) |
| `streamdecker/shared/terminal/factory.ts` | `resolveBackendName()` (pure) + `getTerminalBackend()` (cached) + detection |
| `streamdecker/shared/terminal/factory.test.ts` | Detection/selection tests |
| `streamdecker/shared/config/schema.ts` | add `"cmux"` to `TerminalSchema.app` enum (modify) |
| `streamdecker/shared/config/schema.test.ts` | enum acceptance test |
| `streamdecker/shared/actions/kiro.ts` | refactor to delegate to backend (modify) |
| `streamdecker/shared/actions/{focus-kiro,cycle-kiro-tabs,next-alert-tab,launch-kiro-folder,send-yes,send-no,send-thinking,switch-agent-personality}.ts` | plugin actions call backend (modify) |
| `streamdecker/package.json` | add `"test": "bun test"` (modify) |
| `.github/workflows/test.yml` | CI: run `bun test` on push/PR (create) |
| `streamdecker/README.md`, `README.md` | document cmux mode (modify) |

> **Interface note (refines the spec):** the spec listed `launch(folder)`. This plan generalizes it to `openTab(command: string)` — a single primitive that opens a new tab/surface running an arbitrary command. The standalone has three launch variants (default, picker, folder) that all become thin command-builders over `openTab`, which is DRYer. Net behavior matches the spec.

---

## Task 1: Discovery spike — bring cmux socket live and capture CLI fixtures

**Why first:** cmux list commands emit ref-based text (no `--json`), and the control socket is currently down, so the exact output format is unverified. Writing parsers blind is the brittleness we explicitly chose to avoid. This task pins the format down with real output.

**Files:**
- Create: `streamdecker/shared/terminal/__fixtures__/list-pane-surfaces.txt`
- Create: `streamdecker/shared/terminal/__fixtures__/list-notifications.txt`
- Create: `streamdecker/shared/terminal/__fixtures__/list-pane-surfaces-empty.txt`
- Create: `streamdecker/shared/terminal/__fixtures__/list-notifications-empty.txt`
- Create: `streamdecker/shared/terminal/NOTES.md`

- [ ] **Step 1: Bring the control socket up**

Run (cmux must be running):
```bash
cmux reload-config 2>&1 || true
cmux ping 2>&1
```
Expected: `cmux ping` returns success (e.g. `pong`/ok) rather than `Error: Socket not found`. If still "Socket not found", quit and relaunch cmux.app, then re-run `cmux ping`. Do not proceed until `cmux ping` succeeds.

- [ ] **Step 2: Open at least two terminal surfaces so lists are non-trivial**

Run:
```bash
cmux new-surface --type terminal
cmux new-surface --type terminal
```
Then trigger at least one notification if possible (e.g. let a command finish in a background surface) so `list-notifications` has a row to capture.

- [ ] **Step 3: Capture real output as fixtures**

Run and save each verbatim:
```bash
mkdir -p streamdecker/shared/terminal/__fixtures__
cmux list-pane-surfaces --id-format both > streamdecker/shared/terminal/__fixtures__/list-pane-surfaces.txt
cmux list-notifications              > streamdecker/shared/terminal/__fixtures__/list-notifications.txt
```
Also capture the empty cases (a pane/workspace with no extra surfaces, and after `cmux clear-notifications` — only if safe to clear):
```bash
printf '' > streamdecker/shared/terminal/__fixtures__/list-pane-surfaces-empty.txt   # replace with real empty output if obtainable
printf '' > streamdecker/shared/terminal/__fixtures__/list-notifications-empty.txt    # replace with real empty output if obtainable
```
Inspect each file. Identify: how a surface ref is printed (e.g. `surface:4`), whether the focused/current surface is marked, the column layout, and how a notification id appears.

- [ ] **Step 4: Confirm the action command mapping against live behavior**

Verify each of these does what the mapping claims (run against a scratch surface, observe cmux):
```bash
cmux set-app-focus active
cmux send --surface surface:1 -- 'echo hi\n'      # \n submits the line
cmux send-key --surface surface:1 escape
cmux move-surface --surface surface:1 --focus true
cmux list-notifications                            # note the id column
cmux open-notification --id <uuid-from-list>       # confirm it focuses the right surface
```
Decide and record in `NOTES.md`:
- **cycleTab** exact commands (parse `list-pane-surfaces`, find current, focus next via `move-surface --focus true`; OR a native next-tab action if one exists — check `cmux tab-action --help`).
- **nextAlertTab** exact commands (`list-notifications` → first id → `open-notification --id <id>`; fall back to `move-surface` on the notified surface if `open-notification` is unsuitable).

- [ ] **Step 5: Write `NOTES.md`**

Document, for each `TerminalBackend` method, the exact `cmux` argv chosen and a 1-line note on the output shape the parser must handle. Include a short "Parsing contract" section the parser tests in Task 2 will encode.

- [ ] **Step 6: Commit**

```bash
git add streamdecker/shared/terminal/__fixtures__ streamdecker/shared/terminal/NOTES.md
git commit -m "chore(terminal): Capture cmux CLI fixtures and command mapping"
```

---

## Task 2: Interface types + output parsers (TDD)

**Files:**
- Create: `streamdecker/shared/terminal/types.ts`
- Create: `streamdecker/shared/terminal/parse.ts`
- Test: `streamdecker/shared/terminal/parse.test.ts`

- [ ] **Step 1: Write `types.ts`**

```ts
// streamdecker/shared/terminal/types.ts

/** Terminal backends streamdecker can drive. */
export type BackendName = "cmux" | "iTerm" | "Terminal" | "Warp" | "WezTerm";

/** "ok" = action succeeded; "none" = nothing to act on (caller shows a Stream Deck alert). */
export type FocusResult = "ok" | "none";

/** Runs `cmux <args>` and resolves stdout (trimmed). Injectable for tests. */
export type CmuxRunner = (args: string[]) => Promise<string>;

/** Runs an AppleScript source string and resolves stdout (trimmed). Injectable for tests. */
export type AppleScriptRunner = (script: string) => Promise<string>;

export interface TerminalBackend {
  readonly name: BackendName;
  /** AppleScript automation permission probe; cmux has none, returns true. */
  checkPermission(): Promise<boolean>;
  /** Bring the kiro terminal to the foreground. */
  focus(): Promise<FocusResult>;
  /** Switch to the next tab/surface. */
  cycleTab(): Promise<FocusResult>;
  /** Jump to the tab/surface needing attention. */
  nextAlertTab(): Promise<FocusResult>;
  /** Open a new tab/surface running `command`. */
  openTab(command: string): Promise<void>;
  /** Type text into the focused surface and submit (Enter). */
  send(text: string): Promise<void>;
  /** Send a key event (e.g. "escape", "ctrl+c"). */
  sendKey(key: string): Promise<void>;
}
```

- [ ] **Step 2: Write the failing parser test**

> Use the REAL fixture content captured in Task 1. The asserted refs/ids below assume cmux's documented ref format (`surface:N`) and a notification id column. **If the Task 1 fixtures show a different shape, update these expected values and the parser in Step 4 to match the real output — the fixture is the source of truth.**

```ts
// streamdecker/shared/terminal/parse.test.ts
import { test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { parseSurfaceRefs, parseFirstNotificationId, nextSurfaceRef } from "./parse.js";

const fx = (name: string) =>
  readFileSync(join(import.meta.dir, "__fixtures__", name), "utf-8");

test("parseSurfaceRefs extracts surface refs in order", () => {
  const refs = parseSurfaceRefs(fx("list-pane-surfaces.txt"));
  expect(refs.length).toBeGreaterThanOrEqual(1);
  for (const r of refs) expect(r).toMatch(/^surface:\w+$/);
});

test("parseSurfaceRefs returns [] for empty output", () => {
  expect(parseSurfaceRefs(fx("list-pane-surfaces-empty.txt"))).toEqual([]);
});

test("parseFirstNotificationId returns null when no notifications", () => {
  expect(parseFirstNotificationId(fx("list-notifications-empty.txt"))).toBeNull();
});

test("nextSurfaceRef wraps around and is null for empty/size-1", () => {
  expect(nextSurfaceRef(["surface:1", "surface:2", "surface:3"], "surface:2")).toBe("surface:3");
  expect(nextSurfaceRef(["surface:1", "surface:2", "surface:3"], "surface:3")).toBe("surface:1");
  expect(nextSurfaceRef(["surface:1"], "surface:1")).toBeNull();
  expect(nextSurfaceRef([], undefined)).toBeNull();
  // unknown current → first ref
  expect(nextSurfaceRef(["surface:1", "surface:2"], undefined)).toBe("surface:2");
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd streamdecker && bun test shared/terminal/parse.test.ts`
Expected: FAIL — `./parse.js` has no such exports.

- [ ] **Step 4: Write `parse.ts`**

> Adjust the regexes to the real fixture format from Task 1 if it differs from the documented `surface:N` ref shape.

```ts
// streamdecker/shared/terminal/parse.ts

/** Extract surface refs (e.g. "surface:4") from `cmux list-pane-surfaces` output, in printed order. */
export function parseSurfaceRefs(output: string): string[] {
  const refs: string[] = [];
  for (const line of output.split("\n")) {
    const m = line.match(/\bsurface:\w+\b/);
    if (m) refs.push(m[0]);
  }
  return refs;
}

/** First notification id (uuid) from `cmux list-notifications`, or null if none. */
export function parseFirstNotificationId(output: string): string | null {
  for (const line of output.split("\n")) {
    const m = line.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    if (m) return m[0];
  }
  return null;
}

/** Given ordered refs and the current ref, return the next (wrapping). null if <2 refs. */
export function nextSurfaceRef(refs: string[], current: string | undefined): string | null {
  if (refs.length < 2) return null;
  if (!current) return refs[1] ?? refs[0];
  const i = refs.indexOf(current);
  if (i === -1) return refs[0];
  return refs[(i + 1) % refs.length];
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd streamdecker && bun test shared/terminal/parse.test.ts`
Expected: PASS (all 4 tests).

- [ ] **Step 6: Commit**

```bash
git add streamdecker/shared/terminal/types.ts streamdecker/shared/terminal/parse.ts streamdecker/shared/terminal/parse.test.ts
git commit -m "feat(terminal): Add TerminalBackend types and cmux output parsers"
```

---

## Task 3: CmuxBackend (TDD)

**Files:**
- Create: `streamdecker/shared/terminal/cmux-backend.ts`
- Test: `streamdecker/shared/terminal/cmux-backend.test.ts`

> Use the exact argv recorded in `NOTES.md` from Task 1. The argv below reflects the documented CLI; reconcile any differences with NOTES.md (NOTES.md wins).

- [ ] **Step 1: Write the failing test**

```ts
// streamdecker/shared/terminal/cmux-backend.test.ts
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

test("send types text plus newline to the focused surface", async () => {
  const { calls, run } = recorder();
  const b = new CmuxBackend(run);
  await b.send("y");
  expect(calls).toEqual([["send", "--", "y\n"]]);
});

test("sendKey sends a key event", async () => {
  const { calls, run } = recorder();
  const b = new CmuxBackend(run);
  await b.sendKey("escape");
  expect(calls).toEqual([["send-key", "escape"]]);
});

test("openTab creates a surface then runs the command in it", async () => {
  // new-surface stdout includes the new surface ref
  const { calls, run } = recorder(["Created surface:9"]);
  const b = new CmuxBackend(run);
  await b.openTab("cd /tmp && kiro-cli chat");
  expect(calls[0]).toEqual(["new-surface", "--type", "terminal"]);
  expect(calls[1]).toEqual(["send", "--surface", "surface:9", "--", "cd /tmp && kiro-cli chat\n"]);
});

test("nextAlertTab opens the first notification, focuses app, returns ok", async () => {
  const id = "11111111-2222-3333-4444-555555555555";
  const { calls, run } = recorder([`${id}  some notification`]);
  const b = new CmuxBackend(run);
  expect(await b.nextAlertTab()).toBe("ok");
  expect(calls[0]).toEqual(["list-notifications"]);
  expect(calls[1]).toEqual(["open-notification", "--id", id]);
  expect(calls[2]).toEqual(["set-app-focus", "active"]);
});

test("nextAlertTab returns none when no notifications", async () => {
  const { calls, run } = recorder([""]);
  const b = new CmuxBackend(run);
  expect(await b.nextAlertTab()).toBe("none");
  expect(calls).toEqual([["list-notifications"]]);
});

test("cycleTab focuses the next surface", async () => {
  // list-pane-surfaces output; assume current is surface:1 (see note on currentSurfaceRef)
  const { calls, run } = recorder(["surface:1\nsurface:2\nsurface:3"]);
  const b = new CmuxBackend(run);
  expect(await b.cycleTab()).toBe("ok");
  expect(calls[0]).toEqual(["list-pane-surfaces"]);
  // moves to some other surface with focus
  const move = calls[1];
  expect(move[0]).toBe("move-surface");
  expect(move).toContain("--focus");
  expect(move).toContain("true");
});

test("cycleTab returns none when fewer than two surfaces", async () => {
  const { run } = recorder(["surface:1"]);
  const b = new CmuxBackend(run);
  expect(await b.cycleTab()).toBe("none");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd streamdecker && bun test shared/terminal/cmux-backend.test.ts`
Expected: FAIL — `./cmux-backend.js` missing.

- [ ] **Step 3: Write `cmux-backend.ts`**

> `currentSurfaceRef()`: cmux's `send`/`move-surface` default to `$CMUX_SURFACE_ID`, which streamdecker does not set. Determine "current" from the Task 1 findings — if `list-pane-surfaces` marks the focused surface, parse it; otherwise treat current as undefined and let `nextSurfaceRef` pick the first non-current ref. The test only requires that cycleTab issues a `move-surface … --focus true` to *a* surface.

```ts
// streamdecker/shared/terminal/cmux-backend.ts
import { execFile } from "child_process";
import { promisify } from "util";
import type { TerminalBackend, FocusResult, CmuxRunner } from "./types.js";
import { parseSurfaceRefs, parseFirstNotificationId, nextSurfaceRef } from "./parse.js";

const execFileAsync = promisify(execFile);

/** Default runner: invoke the `cmux` CLI via execFile (no shell). */
const defaultRunner: CmuxRunner = async (args) => {
  const { stdout } = await execFileAsync("cmux", args);
  return stdout.trim();
};

export class CmuxBackend implements TerminalBackend {
  readonly name = "cmux" as const;
  private run: CmuxRunner;

  constructor(runner: CmuxRunner = defaultRunner) {
    this.run = runner;
  }

  async checkPermission(): Promise<boolean> {
    return true; // cmux uses its control socket; no AppleScript automation prompt
  }

  async focus(): Promise<FocusResult> {
    await this.run(["set-app-focus", "active"]);
    return "ok";
  }

  async send(text: string): Promise<void> {
    await this.run(["send", "--", `${text}\n`]);
  }

  async sendKey(key: string): Promise<void> {
    await this.run(["send-key", key]);
  }

  async openTab(command: string): Promise<void> {
    const created = await this.run(["new-surface", "--type", "terminal"]);
    const ref = parseSurfaceRefs(created)[0];
    const args = ["send", ...(ref ? ["--surface", ref] : []), "--", `${command}\n`];
    await this.run(args);
  }

  async nextAlertTab(): Promise<FocusResult> {
    const out = await this.run(["list-notifications"]);
    const id = parseFirstNotificationId(out);
    if (!id) return "none";
    await this.run(["open-notification", "--id", id]);
    await this.run(["set-app-focus", "active"]);
    return "ok";
  }

  async cycleTab(): Promise<FocusResult> {
    const out = await this.run(["list-pane-surfaces"]);
    const refs = parseSurfaceRefs(out);
    const next = nextSurfaceRef(refs, this.currentSurfaceRef(out));
    if (!next) return "none";
    await this.run(["move-surface", "--surface", next, "--focus", "true"]);
    return "ok";
  }

  /** Identify the focused surface from list output; undefined if not determinable. */
  private currentSurfaceRef(_listOutput: string): string | undefined {
    // Filled in per Task 1 NOTES.md: if the focused surface is marked in output, parse it here.
    return undefined;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd streamdecker && bun test shared/terminal/cmux-backend.test.ts`
Expected: PASS (all tests). If `currentSurfaceRef` parsing was added, the cycleTab test still passes (it only asserts a focused move occurs).

- [ ] **Step 5: Commit**

```bash
git add streamdecker/shared/terminal/cmux-backend.ts streamdecker/shared/terminal/cmux-backend.test.ts
git commit -m "feat(terminal): Add CmuxBackend driving the cmux CLI"
```

---

## Task 4: AppleScriptBackend (TDD)

Lifts the inline AppleScript currently in `kiro.ts` into a backend, parameterized by app name. Preserves existing iTerm/Terminal/Warp/WezTerm behavior.

**Files:**
- Create: `streamdecker/shared/terminal/applescript-backend.ts`
- Test: `streamdecker/shared/terminal/applescript-backend.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// streamdecker/shared/terminal/applescript-backend.test.ts
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

test("focus activates the app and reports found/none", async () => {
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

test("send focuses then types text via System Events", async () => {
  const { scripts, run } = recorder(["found", ""]);
  const b = new AppleScriptBackend("iTerm", "kiro-cli", run);
  await b.send("y");
  // last script keystrokes the text
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

test("sendKey maps escape and ctrl combos to System Events", async () => {
  const { scripts, run } = recorder(["", ""]);
  const b = new AppleScriptBackend("iTerm", "kiro-cli", run);
  await b.sendKey("escape");
  expect(scripts.at(-1)!.toLowerCase()).toContain("key code 53"); // Escape
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd streamdecker && bun test shared/terminal/applescript-backend.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Write `applescript-backend.ts`**

Port the script bodies verbatim from `kiro.ts` (`focusKiro`, `cycleKiroTabs`, `alertIdleKiro`, `switchAgent`'s keystroke pattern, and the launch templates). Build them as methods; `send`/`sendKey` focus first (matching the current `sendYes`→`focusKiro`→keystroke flow), then keystroke.

```ts
// streamdecker/shared/terminal/applescript-backend.ts
import { exec } from "child_process";
import { promisify } from "util";
import type { TerminalBackend, FocusResult, BackendName, AppleScriptRunner } from "./types.js";

const execAsync = promisify(exec);

const defaultRunner: AppleScriptRunner = async (script) => {
  const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
  return stdout.trim();
};

export class AppleScriptBackend implements TerminalBackend {
  readonly name: BackendName;
  private cmd: string;
  private run: AppleScriptRunner;

  constructor(app: Exclude<BackendName, "cmux">, detectCommand: string, runner: AppleScriptRunner = defaultRunner) {
    this.name = app;
    this.cmd = detectCommand;
    this.run = runner;
  }

  async checkPermission(): Promise<boolean> {
    try {
      await this.run(`tell application "System Events" to get name of first process`);
      return true;
    } catch {
      return false;
    }
  }

  async focus(): Promise<FocusResult> {
    const result = await this.run(`
      tell application "${this.name}"
        activate
        repeat with w in windows
          repeat with t in tabs of w
            set s to current session of t
            set theTty to tty of s
            set hasKiro to (do shell script "ps -t " & theTty & " -o command= | grep -q ${this.cmd} && echo yes || echo no")
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

  async cycleTab(): Promise<FocusResult> {
    await this.run(`tell application "${this.name}" to activate`);
    await this.run(`
      tell application "${this.name}"
        tell current window
          set n to count of tabs
          set c to 0
          repeat with i from 1 to n
            if tab i is current tab then set c to i
          end repeat
          repeat with i from 1 to n - 1
            set idx to ((c + i - 1) mod n) + 1
            set s to current session of tab idx
            set theTty to tty of s
            set hasKiro to (do shell script "ps -t " & theTty & " -o command= | grep -q ${this.cmd} && echo yes || echo no")
            if hasKiro is "yes" then
              select tab idx
              return
            end if
          end repeat
        end tell
      end tell
    `);
    return "ok";
  }

  async nextAlertTab(): Promise<FocusResult> {
    await this.run(`
      tell application "${this.name}"
        activate
        tell current window
          set n to count of tabs
          set c to 0
          repeat with i from 1 to n
            if tab i is current tab then set c to i
          end repeat
          repeat with i from 1 to n - 1
            set idx to ((c + i - 1) mod n) + 1
            set s to current session of tab idx
            set theTty to tty of s
            set hasKiro to (do shell script "ps -t " & theTty & " -o command= | grep -q ${this.cmd} && echo yes || echo no")
            if hasKiro is "yes" and is processing of s is false then
              select tab idx
              return
            end if
          end repeat
        end tell
      end tell
    `);
    return "ok";
  }

  async openTab(command: string): Promise<void> {
    const escaped = command.replace(/"/g, '\\"');
    await this.run(`
      tell application "${this.name}"
        activate
        if (count of windows) = 0 then
          create window with default profile command "/bin/zsh -lic '${escaped.replace(/'/g, "'\\''")}'"
        else
          tell current window
            create tab with default profile command "/bin/zsh -lic '${escaped.replace(/'/g, "'\\''")}'"
          end tell
        end if
      end tell
    `);
  }

  async send(text: string): Promise<void> {
    await this.focus();
    await new Promise((r) => setTimeout(r, 50));
    await this.run(`tell application "System Events" to keystroke "${text}"`);
  }

  async sendKey(key: string): Promise<void> {
    await this.run(`tell application "${this.name}" to activate`);
    if (key === "escape") {
      await this.run(`tell application "System Events" to key code 53`);
    } else if (key.startsWith("ctrl+")) {
      const letter = key.slice(5);
      await this.run(`tell application "System Events" to keystroke "${letter}" using control down`);
    } else {
      await this.run(`tell application "System Events" to keystroke "${key}"`);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd streamdecker && bun test shared/terminal/applescript-backend.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add streamdecker/shared/terminal/applescript-backend.ts streamdecker/shared/terminal/applescript-backend.test.ts
git commit -m "feat(terminal): Add AppleScriptBackend wrapping existing terminal automation"
```

---

## Task 5: Backend factory + detection (TDD)

**Files:**
- Create: `streamdecker/shared/terminal/factory.ts`
- Test: `streamdecker/shared/terminal/factory.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// streamdecker/shared/terminal/factory.test.ts
import { test, expect } from "bun:test";
import { resolveBackendName } from "./factory.js";
import type { BackendName } from "./types.js";

type Probe = { cmuxRunning: boolean; cmuxOnPath: boolean; running: BackendName[] };

const probe = (p: Partial<Probe>): Probe => ({
  cmuxRunning: false,
  cmuxOnPath: false,
  running: [],
  ...p,
});

test("explicit app overrides detection", () => {
  expect(resolveBackendName("iTerm", probe({ cmuxRunning: true, cmuxOnPath: true }))).toBe("iTerm");
  expect(resolveBackendName("cmux", probe({}))).toBe("cmux");
});

test("auto prefers cmux when running and on PATH", () => {
  expect(
    resolveBackendName("auto", probe({ cmuxRunning: true, cmuxOnPath: true, running: ["iTerm"] }))
  ).toBe("cmux");
});

test("auto skips cmux when not on PATH and falls back to a running terminal", () => {
  expect(
    resolveBackendName("auto", probe({ cmuxRunning: true, cmuxOnPath: false, running: ["iTerm"] }))
  ).toBe("iTerm");
});

test("auto falls back through the terminal list in order", () => {
  expect(resolveBackendName("auto", probe({ running: ["Warp"] }))).toBe("Warp");
  expect(resolveBackendName("auto", probe({ running: ["Terminal", "Warp"] }))).toBe("Terminal");
});

test("auto defaults to iTerm when nothing detected", () => {
  expect(resolveBackendName("auto", probe({}))).toBe("iTerm");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd streamdecker && bun test shared/terminal/factory.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Write `factory.ts`**

```ts
// streamdecker/shared/terminal/factory.ts
import { execFile } from "child_process";
import { promisify } from "util";
import type { TerminalBackend, BackendName } from "./types.js";
import { CmuxBackend } from "./cmux-backend.js";
import { AppleScriptBackend } from "./applescript-backend.js";
import { getConfig } from "../config/loader.js";

const execFileAsync = promisify(execFile);

const APPLESCRIPT_TERMINALS: Exclude<BackendName, "cmux">[] = ["iTerm", "Terminal", "Warp", "WezTerm"];

export interface BackendProbe {
  cmuxRunning: boolean;
  cmuxOnPath: boolean;
  running: BackendName[];
}

/** Pure selection logic: given the configured app and runtime probe, pick a backend name. */
export function resolveBackendName(app: string, probe: BackendProbe): BackendName {
  if (app !== "auto") return app as BackendName;
  if (probe.cmuxRunning && probe.cmuxOnPath) return "cmux";
  for (const term of APPLESCRIPT_TERMINALS) {
    if (probe.running.includes(term)) return term;
  }
  return "iTerm";
}

async function isRunning(proc: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync("pgrep", ["-x", proc]);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function cmuxOnPath(): Promise<boolean> {
  try {
    await execFileAsync("which", ["cmux"]);
    return true;
  } catch {
    return false;
  }
}

async function buildProbe(): Promise<BackendProbe> {
  const [cmuxRunning, onPath, ...rest] = await Promise.all([
    isRunning("cmux"),
    cmuxOnPath(),
    ...APPLESCRIPT_TERMINALS.map((t) => isRunning(t)),
  ]);
  const running = APPLESCRIPT_TERMINALS.filter((_, i) => rest[i]);
  return { cmuxRunning, cmuxOnPath: onPath, running };
}

let cached: TerminalBackend | null = null;

export async function getTerminalBackend(): Promise<TerminalBackend> {
  if (cached) return cached;
  const config = getConfig();
  const name = resolveBackendName(config.terminal.app, await buildProbe());
  cached = name === "cmux"
    ? new CmuxBackend()
    : new AppleScriptBackend(name, config.terminal.detectCommand);
  return cached;
}

/** Reset the cached backend (used by tests and config changes). */
export function resetBackendCache(): void {
  cached = null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd streamdecker && bun test shared/terminal/factory.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add streamdecker/shared/terminal/factory.ts streamdecker/shared/terminal/factory.test.ts
git commit -m "feat(terminal): Add backend factory with cmux-preferred detection"
```

---

## Task 6: Config schema — add cmux to the enum (TDD)

**Files:**
- Modify: `streamdecker/shared/config/schema.ts:35-38`
- Test: `streamdecker/shared/config/schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// streamdecker/shared/config/schema.test.ts
import { test, expect } from "bun:test";
import { ConfigSchema } from "./schema.js";

test("terminal.app accepts cmux", () => {
  const cfg = ConfigSchema.parse({ terminal: { app: "cmux" } });
  expect(cfg.terminal.app).toBe("cmux");
});

test("terminal.app still accepts existing terminals and auto", () => {
  for (const app of ["iTerm", "Terminal", "Warp", "WezTerm", "auto"]) {
    expect(ConfigSchema.parse({ terminal: { app } }).terminal.app).toBe(app);
  }
});

test("terminal.app rejects unknown values", () => {
  expect(() => ConfigSchema.parse({ terminal: { app: "Hyper" } })).toThrow();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd streamdecker && bun test shared/config/schema.test.ts`
Expected: FAIL — `"cmux"` not in enum.

- [ ] **Step 3: Make the change**

In `streamdecker/shared/config/schema.ts`, change the `TerminalSchema`:

```ts
// Terminal configuration
export const TerminalSchema = z.object({
  app: z.enum(["cmux", "iTerm", "Terminal", "Warp", "WezTerm", "auto"]).default("auto"),
  detectCommand: z.string().default("kiro-cli"),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd streamdecker && bun test shared/config/schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add streamdecker/shared/config/schema.ts streamdecker/shared/config/schema.test.ts
git commit -m "feat(config): Allow cmux as a terminal.app option"
```

---

## Task 7: Route the standalone action layer (`kiro.ts`) through the backend

Replace the inline-AppleScript bodies in `kiro.ts` with delegations to `getTerminalBackend()`. Public function signatures stay the same so `src/main.ts` and other callers are unaffected.

**Files:**
- Modify: `streamdecker/shared/actions/kiro.ts`
- Test: `streamdecker/shared/actions/kiro.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```ts
// streamdecker/shared/actions/kiro.test.ts
import { test, expect, mock } from "bun:test";

// Mock the backend factory before importing the module under test.
const calls: string[] = [];
const fakeBackend = {
  name: "cmux" as const,
  checkPermission: async () => true,
  focus: async () => { calls.push("focus"); return "ok" as const; },
  cycleTab: async () => { calls.push("cycleTab"); return "ok" as const; },
  nextAlertTab: async () => { calls.push("nextAlertTab"); return "ok" as const; },
  openTab: async (c: string) => { calls.push(`openTab:${c}`); },
  send: async (t: string) => { calls.push(`send:${t}`); },
  sendKey: async (k: string) => { calls.push(`sendKey:${k}`); },
};

mock.module("../terminal/factory.js", () => ({
  getTerminalBackend: async () => fakeBackend,
  resetBackendCache: () => {},
}));
mock.module("../config/loader.js", () => ({
  getConfig: () => ({ terminal: { app: "cmux", detectCommand: "kiro-cli" }, agents: { recent: [] } }),
  addRecentAgent: () => {},
}));

const { focusKiro, sendYes, cycleKiroTabs, alertIdleKiro } = await import("./kiro.js");

test("focusKiro delegates to backend.focus", async () => {
  calls.length = 0;
  expect(await focusKiro()).toBe(true);
  expect(calls).toEqual(["focus"]);
});

test("sendYes sends 'y' through the backend", async () => {
  calls.length = 0;
  await sendYes();
  expect(calls).toContain("send:y");
});

test("cycleKiroTabs and alertIdleKiro delegate", async () => {
  calls.length = 0;
  await cycleKiroTabs();
  await alertIdleKiro();
  expect(calls).toEqual(["cycleTab", "nextAlertTab"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd streamdecker && bun test shared/actions/kiro.test.ts`
Expected: FAIL — current `kiro.ts` uses AppleScript directly, not the backend.

- [ ] **Step 3: Rewrite `kiro.ts` to delegate**

Replace the terminal-touching functions. Keep `getAgentList` and imports it needs. New body for the delegating functions:

```ts
import { getTerminalBackend } from "../terminal/factory.js";
import { getConfig, addRecentAgent } from "../config/loader.js";
import { KIRO_AGENTS_DIR, getScriptsDir } from "../config/paths.js";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

export async function focusKiro(): Promise<boolean> {
  const backend = await getTerminalBackend();
  return (await backend.focus()) === "ok";
}

export async function cycleKiroTabs(): Promise<void> {
  await (await getTerminalBackend()).cycleTab();
}

export async function alertIdleKiro(): Promise<void> {
  await (await getTerminalBackend()).nextAlertTab();
}

export async function sendYes(): Promise<void> {
  await (await getTerminalBackend()).send("y");
}

export async function sendNo(): Promise<void> {
  await (await getTerminalBackend()).send("n");
}

export async function sendTrust(): Promise<void> {
  await (await getTerminalBackend()).send("t");
}

export async function switchAgent(name: string): Promise<void> {
  await (await getTerminalBackend()).send(`/agent switch ${name}`);
  addRecentAgent(name);
}

export async function launchKiro(): Promise<void> {
  await (await getTerminalBackend()).openTab("kiro-cli chat");
}

export async function launchKiroWithPicker(): Promise<void> {
  const pickerScript = join(getScriptsDir(), "launch-kiro-picker.sh");
  await (await getTerminalBackend()).openTab(pickerScript);
}

export async function launchKiroInFolder(folder: string): Promise<void> {
  await (await getTerminalBackend()).openTab(`cd "${folder}" && kiro-cli chat`);
}

// getAgentList unchanged — copy verbatim from the existing file.
```

> Note: the cmux backend wraps `send`/`openTab` itself; the AppleScript backend's `send` focuses first (preserving the old `sendYes`→focus→keystroke behavior). The old per-call `focusKiro()` + 50ms delay now lives inside `AppleScriptBackend.send`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd streamdecker && bun test shared/actions/kiro.test.ts`
Expected: PASS.

- [ ] **Step 5: Verify the standalone still type-checks and runs**

Run: `cd streamdecker && bunx tsc --noEmit`
Expected: no errors. (If `terminal.ts`'s now-unused exports cause lint/type issues, leave the file but remove dead exports only if nothing imports them — verify with `grep -rn "from \"./terminal` shared src.)

- [ ] **Step 6: Commit**

```bash
git add streamdecker/shared/actions/kiro.ts streamdecker/shared/actions/kiro.test.ts
git commit -m "refactor(actions): Route standalone kiro actions through TerminalBackend"
```

---

## Task 8: Route the Elgato plugin actions through the backend

Each `SingletonAction` currently shells out to `osascript` / external `.applescript`. Replace those calls with backend calls. The permission gate becomes `backend.checkPermission()`.

**Files (modify):**
- `streamdecker/shared/actions/focus-kiro.ts`
- `streamdecker/shared/actions/cycle-kiro-tabs.ts`
- `streamdecker/shared/actions/next-alert-tab.ts`
- `streamdecker/shared/actions/send-yes.ts`
- `streamdecker/shared/actions/send-no.ts`
- `streamdecker/shared/actions/send-thinking.ts`
- `streamdecker/shared/actions/launch-kiro-folder.ts`
- `streamdecker/shared/actions/switch-agent-personality.ts`

- [ ] **Step 1: Convert `focus-kiro.ts`** (pattern for the simple actions)

```ts
import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { getTerminalBackend } from "../terminal/factory.js";

@action({ UUID: "wtf.sauhsoj.streamdecker.focus-kiro" })
export class FocusKiroAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    try {
      const backend = await getTerminalBackend();
      if (!(await backend.checkPermission())) {
        await ev.action.showAlert();
        return;
      }
      if ((await backend.focus()) === "none") {
        await ev.action.showAlert();
      }
    } catch (err) {
      streamDeck.logger.error(`FocusKiro failed: ${err}`);
      await ev.action.showAlert();
    }
  }
}
```

- [ ] **Step 2: Apply the same pattern to `cycle-kiro-tabs.ts` and `next-alert-tab.ts`**

Use `backend.cycleTab()` and `backend.nextAlertTab()` respectively; show an alert when the result is `"none"`.

- [ ] **Step 3: Convert `send-yes.ts`, `send-no.ts`, `send-thinking.ts`**

Replace the `osascript … send-keystroke.applescript "y"` call with:
```ts
const backend = await getTerminalBackend();
if (!(await backend.checkPermission())) { await ev.action.showAlert(); return; }
await backend.send("y"); // "n" for send-no, "t" for send-thinking
```

- [ ] **Step 4: Convert `launch-kiro-folder.ts`**

Replace the inline iTerm AppleScript in `onKeyDown` with:
```ts
const backend = await getTerminalBackend();
await backend.openTab(`cd ${folder} && kiro-cli chat`);
```
Keep the `addToRecent` logic and the `onWillAppear`/`onDidReceiveSettings` title handling unchanged.

- [ ] **Step 5: Convert `switch-agent-personality.ts`**

Where it currently sends the `/agent switch` keystrokes via osascript, call:
```ts
const backend = await getTerminalBackend();
await backend.send(`/agent switch ${agentName}`);
```
Keep agent-name extraction and title handling unchanged.

- [ ] **Step 6: Build the plugin bundle to verify it compiles**

Run (from repo root): `npm run build`
Expected: rollup completes, writes `wtf.sauhsoj.streamdecker.sdPlugin/bin/plugin.js`, no TypeScript errors. (`shared/terminal/*` must not pull in `@elgato/streamdeck` — confirm the bundle still builds.)

- [ ] **Step 7: Run the full unit suite**

Run: `cd streamdecker && bun test`
Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add streamdecker/shared/actions/*.ts
git commit -m "refactor(actions): Route Elgato plugin actions through TerminalBackend"
```

---

## Task 9: CI workflow to run unit tests

**Files:**
- Create: `.github/workflows/test.yml`
- Modify: `streamdecker/package.json` (add `"test": "bun test"` script)

- [ ] **Step 1: Add the test script**

In `streamdecker/package.json` `scripts`, add:
```json
"test": "bun test",
```

- [ ] **Step 2: Create `.github/workflows/test.yml`**

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install streamdecker dependencies
        working-directory: streamdecker
        run: bun install

      - name: Run unit tests
        working-directory: streamdecker
        run: bun test
```

- [ ] **Step 3: Verify the script works locally**

Run: `cd streamdecker && bun test`
Expected: full suite passes (the same command CI runs).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/test.yml streamdecker/package.json
git commit -m "ci: Run streamdecker unit tests on push and PR"
```

---

## Task 10: Documentation

**Files:**
- Modify: `README.md` (root) — Config section
- Modify: `streamdecker/README.md` — terminal/config section if present

- [ ] **Step 1: Document the cmux option**

In the root `README.md` Config section, update the `terminal` description to note the new option, e.g.:
> - `terminal.app` - `cmux`, `iTerm`, `Terminal`, `Warp`, `WezTerm`, or `auto` (default). When `auto`, a running cmux is preferred; otherwise the first running supported terminal is used. cmux is driven via the `cmux` CLI (requires cmux's socket control mode set to Automation).

Add a short "cmux backend" note pointing at the design/plan docs under `docs/superpowers/`.

- [ ] **Step 2: Commit**

```bash
git add README.md streamdecker/README.md
git commit -m "docs: Document cmux terminal backend option"
```

---

## Final verification (after all tasks)

- [ ] `cd streamdecker && bun test` — all green.
- [ ] `cd streamdecker && bunx tsc --noEmit` — no type errors.
- [ ] `npm run build` (root) — plugin bundle builds.
- [ ] **Manual smoke (requires live cmux socket from Task 1):** set `~/.config/streamdecker/config.json` `terminal.app` to `"cmux"` (or rely on auto with cmux running), `cd streamdecker && bun run dev`, and exercise Focus, Cycle, Alert, Launch, Yes/No/Trust, and Agent switch. Confirm each drives cmux.
- [ ] Open a PR from `feat/cmux-terminal-backend` (the Test workflow runs on the PR).

---

## Spec coverage check

- Control via `cmux` CLI (execFile) → Tasks 3, 5.
- Standalone + Elgato scope → Tasks 7, 8.
- `TerminalBackend` interface + two implementations → Tasks 2, 3, 4.
- Alert via `cmux` notifications → Task 3 (`nextAlertTab`, refined to `open-notification`).
- Auto-detect cmux-preferred + explicit override → Task 5.
- Cycle all surfaces → Task 3 (`cycleTab`).
- Config enum adds `cmux` → Task 6.
- Consolidate duplicated terminal helpers → Tasks 4, 7 (logic moves into backends).
- Testing → unit tests every task; CI in Task 9; manual smoke in Final verification.
- Out of scope (BTT, socket protocol) → untouched.
