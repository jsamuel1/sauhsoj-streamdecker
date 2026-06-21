# Config-Driven Standalone — Design (Plan 2 of 2)

**Date:** 2026-06-21
**Status:** Approved (pending spec review)

## Goal

Make the standalone Bun app render its Stream Deck buttons from `config.buttons`
(already defined in the schema but currently ignored) instead of hardcoded arrays,
so the Launch/Focus **targets** built in Plan 1 — and any button action — are
user-configurable. Add a per-button editor to the emulator Settings UI.

## Context / problem

Today the standalone hardcodes its layout in three places that must agree:
- `src/main.ts` — `buttonActions`, `buttonIcons`, `buttonLabels` arrays (8 fixed slots).
- `emulator/script.js` — its own `buttonActions` array + static `<span>` labels in `emulator/index.html`.
- `shared/config/schema.ts` — `ButtonSchema` + `DEFAULT_NEO_BUTTONS`/`DEFAULT_MINI_BUTTONS` exist but nothing reads them.

There is also an `ActionId` mismatch: `main.ts` uses `kiro.thinking` for the Trust
button while the schema's `ActionId` enum uses `kiro.trust`. ("Thinking" was always
Trust — standardize on `kiro.trust`.)

## Decisions

- **`config.buttons` is the single source of truth** for the standalone layout;
  defaults come from `DEFAULT_NEO_BUTTONS`/`DEFAULT_MINI_BUTTONS`.
- **Standardize on `kiro.trust`** (remove `kiro.thinking`), updating `main.ts` and
  the emulator.
- Add `target.launch` and `target.focus` to `ActionId`; add `target?: TargetId`
  and `folder?: string` to `ButtonSchema`.
- **Preserve existing behaviors**, now config-driven: the agent picker page
  (`kiro.agent`), the Launch long-press (`kiro.launch`: short = folder picker,
  long = last folder), and info-bar paging. `target.launch`/`target.focus` are
  plain press actions.
- **Emulator gains a per-button editor** (action dropdown per slot; target dropdown
  + folder for target actions). Saved via the existing `PUT /api/config`.
- **Out of scope:** drag-to-reorder, custom icon upload/picker (edit in place;
  icons derived), BTT, and any Elgato-plugin change (Plan 1 already covers Elgato).

## Architecture

### Schema (`streamdecker/shared/config/schema.ts`)

- `ActionId` enum: remove `kiro.thinking` if present (it isn't — it only exists in
  `main.ts`); add `"target.launch"`, `"target.focus"`. Keep existing
  `kiro.focus|cycle|alert|launch|yes|no|trust|agent|agent.picker`.
- `ButtonSchema`: add `target: TargetId optional` and `folder: string optional`.
  Import `TargetId` from `../targets.js` (pure module — safe).
- `DEFAULT_NEO_BUTTONS` / `DEFAULT_MINI_BUTTONS`: confirm they map positions to the
  current default layout using `kiro.trust` (not `kiro.thinking`).

### New testable module — `streamdecker/src/buttons.ts`

Pulls button→behavior resolution out of `main.ts` so it can be unit-tested and
`main.ts` shrinks. Pure where possible; the dispatch map references existing action
functions.

```ts
import type { Button } from "../shared/config/schema.js";

// Resolve the icon base-name for a button: explicit button.icon, else the
// target's launch/focus icon, else the kiro default for the action.
export function resolveButtonIcon(button: Button): string | null;

// Resolve the display label: button.label, else a default per action/target.
export function resolveButtonLabel(button: Button): string;

// Build an ordered slot array (length = device button count) from config.buttons,
// filling gaps with nulls so rendering/dispatch can index by position.
export function buttonsByPosition(buttons: Button[], slots: number): (Button | null)[];
```

Dispatch (which action runs on press) stays in `main.ts` as a `Record<ActionId, …>`
registry (it needs the live action functions + page/long-press state), but it reads
the action from the resolved `Button`. `target.launch`/`target.focus` call
`launchTarget(button.target, button.folder)` / `focusTarget(button.target)` from
`shared/actions/target-dispatch.js`.

### `main.ts` refactor

- Replace `buttonActions`/`buttonIcons`/`buttonLabels` with
  `buttonsByPosition(getConfig().buttons, slots)`.
- `loadButtonIcon(index)` → takes a `Button` (uses `resolveButtonIcon` +
  `resolveButtonLabel`) instead of array lookups; same canvas/sharp compositing.
- `handleButtonDown`/`handleButtonUp` read `slot.action` from the resolved buttons;
  keep the `kiro.launch` long-press branch and `kiro.agent` page branch.
- Add `target.launch`/`target.focus` to the action registry.
- Re-render on config change (the emulator already calls `onConfigChange`); when
  buttons change, call `resetBackendCache()` is NOT needed, but re-run
  `initButtons()` / `showMainPage()`.

### Emulator UI (`emulator/index.html`, `emulator/script.js`)

- Render the grid and per-key action labels from `config.buttons` (fetched via the
  existing `GET /api/config`), not the hardcoded `buttonActions`.
- Add a **per-button editor** in the Settings modal: for each position, an action
  `<select>` (all `ActionId`s); when the chosen action is `target.launch` or
  `target.focus`, reveal a target `<select>` (kiro-cli / claude-code / amazon-quick
  / claude-app) and, for `target.launch`, a folder text field. Optional label field.
- Save the assembled `buttons` array via `PUT /api/config` (existing endpoint →
  `updateConfig`), then the server pushes re-rendered images.

## Error handling

- Unknown/blank action on a slot → render an empty/dark key, no dispatch.
- `target.launch`/`target.focus` with no `target` set → the dispatcher already
  guards (logs + no-op); the key shows its label.
- Config parse errors already fall back to defaults (`loadConfig`).

## Testing

- **Unit (`src/buttons.test.ts`):** `resolveButtonIcon` (explicit / target-derived /
  kiro default / unknown→null), `resolveButtonLabel` (explicit / derived),
  `buttonsByPosition` (ordering, gaps→null, slot count).
- **Unit (schema):** `ActionId` accepts `target.launch`/`target.focus`;
  `ButtonSchema` accepts `target`/`folder`; defaults use `kiro.trust`.
- **Manual smoke:** run `bun run dev`; confirm the device + emulator render from
  config; edit a button to `target.launch` → `claude-code` in the emulator, save,
  and verify the key launches Claude Code; confirm agent page, Launch long-press,
  and info-bar paging still work.

## Out of scope

- Drag-to-reorder and custom icon upload/picker.
- Elgato plugin (done in Plan 1).
- BetterTouchTool preset.
