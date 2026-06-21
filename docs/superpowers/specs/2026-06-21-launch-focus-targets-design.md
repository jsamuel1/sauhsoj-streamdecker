# Launch & Focus Targets — Design

**Date:** 2026-06-21
**Status:** Approved (pending spec review)

## Goal

Generalize streamdecker's single kiro-cli "Launch" into a configurable **Launch**
of any of several targets, plus a companion **Focus** action. Each Stream Deck key
is bound to one target via per-button config (property inspector on Elgato; config
on standalone).

Initial targets:

| id | kind | Launch | Focus |
|---|---|---|---|
| `kiro-cli` | terminal | new tab → `kiro-cli chat` (optional `cd <folder>`) | focus tab running `kiro-cli` |
| `claude-code` | terminal | new tab → `claude` (optional `cd <folder>`) | focus tab running `claude` |
| `amazon-quick` | gui | `open -a "Amazon Quick"`, then ⌘N for a new session | `open -a "Amazon Quick"` |
| `claude-app` | gui | `open -a "Claude"`, then ⌘N for a new session | `open -a "Claude"` |

## Decisions

- **Selection:** per-button target. The Launch/Focus actions take a `target` id
  from the property inspector (Elgato) or button config (standalone). No picker page.
- **Launch = new session:** terminal targets get a new tab (a new tab *is* a new
  session); GUI targets are opened/focused and then sent ⌘N to start a new
  conversation.
- **Focus = bring to front:** terminal targets focus the tab running the target's
  command; GUI targets `open -a` (launches if not running, foregrounds if running),
  with no ⌘N. Focus is provided for all four targets.
- **Folder:** optional, terminal targets only. If set, Launch runs
  `cd "<folder>" && <command>`; otherwise the command runs in the new tab's default
  cwd. GUI targets ignore folder.
- **Scope:** standalone Bun app **and** the Elgato plugin (matches the cmux work).
- **GUI new-session mechanism:** ⌘N keystroke (see investigation below). The
  mechanism is per-target data so a deep link can replace it later without code
  changes.

## Deep-link investigation (why ⌘N, not a deep link)

Both GUI apps are Electron with a registered URL scheme, but neither exposes a
documented "new conversation" deep link:

- **Claude.app** (`claude://`): the `open-url` handler routes only auth callbacks
  (`claude://claude.ai/mcp-auth-callback/sdk`) and `claude://cowork/{agent, space,
  web, cli-wrapper, shared-artifact, export-to-google-drive}`. No `claude://new`.
- **Amazon Quick.app** (`awsquick://`): the only real deep links are
  `awsquick://connector-refresh` and a placeholder `awsquick://something`. The
  `new-chat` / `new-conversation` / `new_tab` strings are internal React
  routes/CSS (`history.pushState(…, "/chat/<id>/new-chat")`), not scheme routes.

Therefore Launch uses the conventional **⌘N** shortcut, sent via System Events
after focusing the app. This requires macOS Accessibility permission for the
controlling process. The target registry stores the new-session mechanism
(`"cmd-n"`) as data, so a verified deep link (`newSession: { url: "…" }`) can be
slotted in later per target.

## Architecture

### Target registry — `streamdecker/shared/targets.ts`

Pure data + types; no `@elgato/streamdeck` import (so it is unit-testable under
`bun test` and bundlable for the plugin).

```ts
export type TargetId = "kiro-cli" | "claude-code" | "amazon-quick" | "claude-app";

export type LaunchTarget =
  | {
      id: TargetId;
      label: string;
      kind: "terminal";
      command: string;       // run in a new tab
      detectCommand: string; // used by Focus to find the right tab
    }
  | {
      id: TargetId;
      label: string;
      kind: "gui";
      appName: string;       // for `open -a`
      bundleId: string;
      newSession: "cmd-n" | "none"; // how Launch starts a new conversation
    };

// Plus, on every target, icon base-names used by the actions to set the key image:
//   launchIcon: string;  focusIcon: string;
// kiro-cli reuses the existing "kiro-launch" / "kiro-focus".

export type TerminalTarget = Extract<LaunchTarget, { kind: "terminal" }>;
export type GuiTarget = Extract<LaunchTarget, { kind: "gui" }>;

export const TARGETS: Record<TargetId, LaunchTarget>;
export function getTarget(id: string): LaunchTarget | undefined;
```

Registry contents:

- `kiro-cli`: terminal, command `kiro-cli chat`, detect `kiro-cli`
- `claude-code`: terminal, command `claude`, detect `claude`
- `amazon-quick`: gui, app `Amazon Quick`, bundle `com.amazon.QuickWork.mac`, `cmd-n`
- `claude-app`: gui, app `Claude`, bundle `com.anthropic.claudefordesktop`, `cmd-n`

### App launcher — `streamdecker/shared/app-launcher.ts`

Handles GUI targets via `open` + AppleScript. Injectable runners for tests.

```ts
// open -a "<appName>" (launches or foregrounds)
export async function focusApp(appName: string, run?: Exec): Promise<void>;
// open -a "<appName>", then (if newSession==="cmd-n") System Events keystroke "n" using command down
export async function launchApp(target: GuiTarget, run?: Exec): Promise<void>;
```

The ⌘N is sent with a short delay after `open -a` so the app is frontmost. No
`@elgato/streamdeck` import.

### Terminal targets — reuse `TerminalBackend`

- **Launch:** `backend.openTab(folder ? 'cd "<folder>" && <command>' : '<command>')`
  — already supported; a new tab is a new session.
- **Focus:** generalize `TerminalBackend.focus()` to accept an optional
  `detectCommand` so it can focus the tab running `claude` vs `kiro-cli`.
  - `AppleScriptBackend.focus(detectCommand?)` — scan tabs for the given command
    (defaults to the configured `terminal.detectCommand`, preserving today's
    behavior).
  - `CmuxBackend.focus(detectCommand?)` — stays app-level (`set-app-focus active`);
    cmux surfaces are not reliably matched by running command. Documented as a
    known limitation.

### Dispatcher — `streamdecker/shared/actions/launch-target.ts` (shared logic)

Pure-ish functions both consumers call:

```ts
export async function launchTarget(id: TargetId, folder?: string): Promise<void>;
export async function focusTarget(id: TargetId): Promise<void>;
```

- terminal → `TerminalBackend` (`openTab` / `focus(detectCommand)`)
- gui → `app-launcher` (`launchApp` / `focusApp`)

### Elgato plugin actions

- `launch-target` (`wtf.sauhsoj.streamdecker.launch-target`): property inspector
  with a **target** dropdown + optional **folder** field; `onKeyDown` →
  `launchTarget(target, folder)`. Sets the key title from the target label.
- `focus-target` (`wtf.sauhsoj.streamdecker.focus-target`): PI with a **target**
  dropdown; `onKeyDown` → `focusTarget(target)`.
- New property-inspector HTML under `wtf.sauhsoj.streamdecker.sdPlugin/ui/`.
- Manifest gains the two actions.

The existing `launch-kiro-cli` / `launch-kiro-folder` actions remain for backward
compatibility (kiro-cli is also reachable via the new generalized action).

### Standalone app

- Config `ActionId` enum gains `target.launch` and `target.focus`; button config
  carries an optional `target` (TargetId) and `folder`.
- `main.ts` button dispatch routes these to `launchTarget` / `focusTarget`.
- The emulator config UI lets a button pick its target (dropdown) — minimal
  addition mirroring existing button config.

## Icons

New per-target button icons, generated in the existing **house style** (purple
ghost mascot) but visually themed after each product, via the repo's icon
pipeline (**Amazon Titan Image Generator v2** on Bedrock, `us-west-2`, per
`scripts/generate-icons.md`).

**Prerequisite (implementation-time):** valid AWS credentials with Bedrock access
to the Titan image model, plus `boto3` + `Pillow` (installable via `uv`). This
machine currently has no AWS auth configured, so the icon-generation task is gated
on the user authenticating; it does not block the code tasks.

**Assets needed** (kiro-cli reuses existing `kiro-launch`/`kiro-focus`):

| target | launch icon | focus icon |
|---|---|---|
| `claude-code` | `claude-code-launch` | `claude-code-focus` |
| `amazon-quick` | `amazon-quick-launch` | `amazon-quick-focus` |
| `claude-app` | `claude-app-launch` | `claude-app-focus` |

- Sizes/format follow the existing convention: `<name>.png` (72), `<name>-96.png`,
  `<name>-144.png`, written to `shared/icons/` and copied into the plugin's
  `wtf.sauhsoj.streamdecker.sdPlugin/imgs/`.
- **Prompts** extend the base template ("A cute purple ghost mascot character
  {description}. Dark navy background #1a1a2e. Purple body #9b7ed9, pink cheeks…")
  with product cues, e.g.:
  - claude-code — "…holding a glowing terminal prompt, with a warm clay-orange
    Anthropic-style accent" (launch adds a small rocket; focus adds a focus-ring/eye).
  - amazon-quick — "…with an orange lightning/spark motif evoking the Amazon Quick
    mark."
  - claude-app — "…hugging a rounded clay-orange chat bubble (Claude desktop)."
- Launch vs focus variants differ by an action glyph (launch ▶/rocket, focus
  ⌖/focus-ring), matching how `kiro-launch` vs `kiro-focus` differ today.
- The Elgato actions and standalone renderer call `setImage`/render using the
  target's `launchIcon`/`focusIcon` base-name resolved through the existing
  `resolveIcon()` path.

## Error handling

- Unknown/missing target id → action shows a Stream Deck alert (`showAlert`) and
  logs; no throw escapes the handler.
- GUI: `open -a` failure (app missing) → alert + log. ⌘N best-effort; if
  Accessibility is denied the keystroke silently no-ops (documented).
- Terminal: reuse existing backend permission checks and alert-on-`none`.

## Testing

- **Unit — registry:** `getTarget` returns correct shape; all four ids present;
  unknown id → undefined.
- **Unit — app-launcher:** injected runner asserts exact `open -a "<app>"` and the
  ⌘N AppleScript (`keystroke "n" using command down`) for `cmd-n`, and that Focus
  does **not** send ⌘N.
- **Unit — dispatcher:** mock `TerminalBackend` + app-launcher; assert terminal
  ids call `openTab`/`focus(detectCommand)` and gui ids call `launchApp`/`focusApp`;
  folder only applied to terminal Launch.
- **Unit — terminal focus generalization:** `AppleScriptBackend.focus("claude")`
  emits an AppleScript referencing `claude`.
- **Manual smoke:** each target Launch + Focus from the device/emulator; verify GUI
  ⌘N opens a new conversation (with Accessibility granted).

## Out of scope

- Picker-page selection UI.
- GUI deep-link routes (kept as a future drop-in via the registry).
- cmux per-surface focus-by-command (cmux Focus stays app-level).
- Generated app-icon (.icns) changes for the bundle; only Stream Deck button
  icons are produced.
