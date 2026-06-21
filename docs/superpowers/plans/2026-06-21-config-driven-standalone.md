# Config-Driven Standalone — Implementation Plan (Plan 2 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the standalone Bun app render and dispatch its Stream Deck buttons from `config.buttons` (with a per-button editor in the emulator), so the Plan 1 Launch/Focus targets and any action are user-configurable.

**Architecture:** Add `target.launch`/`target.focus` to the config `ActionId` and `target`/`folder` to `ButtonSchema`. Extract button icon/label/slot resolution into a pure, unit-tested `src/buttons.ts`. Refactor `main.ts` to render/dispatch from `config.buttons` (preserving the agent page, Launch long-press, and info-bar paging). Make the emulator render from config and gain a per-button editor.

**Tech Stack:** TypeScript, Bun (`bun test`), zod (config), `@napi-rs/canvas` + `sharp` (button rendering), the emulator (vanilla HTML/JS served at :3848).

**Scope note:** Standalone + emulator only. The Elgato plugin (Plan 1) is unchanged. No drag-reorder or icon upload.

---

## Working agreements
- **Branch:** `feat/config-driven-standalone` (already checked out).
- **Test runner:** `bun test` from `streamdecker/`. Colocated `*.test.ts`.
- Commit after each task; end commit bodies with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- `src/buttons.ts` and `shared/**` must NOT import `@elgato/streamdeck`.

## File structure
| File | Responsibility |
|---|---|
| `streamdecker/shared/targets.ts` | export `TARGET_IDS` tuple; derive `TargetId` from it (modify) |
| `streamdecker/shared/config/schema.ts` | `ActionId` += target actions; `ButtonSchema` += `target`/`folder` (modify) |
| `streamdecker/shared/config/schema.test.ts` | new acceptance tests (modify) |
| `streamdecker/src/buttons.ts` | pure icon/label/slot resolution (create) |
| `streamdecker/src/buttons.test.ts` | unit tests (create) |
| `streamdecker/src/main.ts` | render+dispatch from `config.buttons` (modify) |
| `streamdecker/emulator/script.js` | render grid from config; per-button editor (modify) |
| `streamdecker/emulator/index.html` | editor markup (modify) |
| `README.md` | document config-driven buttons (modify) |

---

## Task 1: Schema — target actions, button target/folder, shared target-id list

**Files:**
- Modify: `streamdecker/shared/targets.ts`
- Modify: `streamdecker/shared/config/schema.ts:4-26`
- Test: `streamdecker/shared/config/schema.test.ts`

- [ ] **Step 1: Write failing tests** — append to `streamdecker/shared/config/schema.test.ts`:

```ts
import { ButtonSchema, ActionId } from "./schema.js";

test("ActionId accepts the new target actions", () => {
  expect(ActionId.parse("target.launch")).toBe("target.launch");
  expect(ActionId.parse("target.focus")).toBe("target.focus");
});

test("ButtonSchema accepts target + folder for a target action", () => {
  const b = ButtonSchema.parse({
    position: 3,
    action: "target.launch",
    target: "claude-code",
    folder: "/tmp/proj",
  });
  expect(b.target).toBe("claude-code");
  expect(b.folder).toBe("/tmp/proj");
});

test("ButtonSchema still parses a plain kiro button and rejects a bad target", () => {
  expect(ButtonSchema.parse({ position: 0, action: "kiro.focus" }).action).toBe("kiro.focus");
  expect(() => ButtonSchema.parse({ position: 0, action: "kiro.focus", target: "nope" })).toThrow();
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `cd /Users/jsamuel/src/sauhsoj-streamdecker/streamdecker && bun test shared/config/schema.test.ts`
Expected: FAIL (`target.launch` not in enum; `target` not allowed).

- [ ] **Step 3: Add the shared target-id tuple in `targets.ts`**

Replace the `TargetId` type definition with a tuple-derived version (keeps a single source of truth; the resulting union is identical):

```ts
export const TARGET_IDS = ["kiro-cli", "claude-code", "amazon-quick", "claude-app"] as const;
export type TargetId = (typeof TARGET_IDS)[number];
```
(Place `TARGET_IDS` above `TargetId`; remove the old `export type TargetId = "kiro-cli" | ...` literal line. Everything else in `targets.ts` stays.)

- [ ] **Step 4: Update `schema.ts`**

At the top, import the tuple:
```ts
import { z } from "zod";
import { TARGET_IDS } from "../targets.js";
```
Add the two actions to the `ActionId` enum (after `"kiro.agent.picker"`):
```ts
  "kiro.agent.picker",
  "target.launch",
  "target.focus",
```
Extend `ButtonSchema`:
```ts
export const ButtonSchema = z.object({
  position: z.number().min(0).max(7),
  action: ActionId,
  icon: z.string().optional(),
  label: z.string().optional(),
  target: z.enum(TARGET_IDS).optional(),
  folder: z.string().optional(),
});
```

- [ ] **Step 5: Run to confirm pass**

Run: `cd /Users/jsamuel/src/sauhsoj-streamdecker/streamdecker && bun test shared/config/schema.test.ts && bun run typecheck`
Expected: all pass; typecheck clean. Also run full `bun test` — the existing target/dispatch tests must still pass (the `TargetId` change is type-identical).

- [ ] **Step 6: Commit**

```bash
cd /Users/jsamuel/src/sauhsoj-streamdecker
git add streamdecker/shared/targets.ts streamdecker/shared/config/schema.ts streamdecker/shared/config/schema.test.ts
git commit -m "feat(config): Add target actions and per-button target/folder"
```

---

## Task 2: Pure button-resolution module `src/buttons.ts`

**Files:**
- Create: `streamdecker/src/buttons.ts`
- Test: `streamdecker/src/buttons.test.ts`

- [ ] **Step 1: Write the failing test** — `streamdecker/src/buttons.test.ts`:

```ts
import { test, expect } from "bun:test";
import { resolveButtonIcon, resolveButtonLabel, buttonsByPosition } from "./buttons.js";
import type { Button } from "../shared/config/schema.js";

const b = (o: Partial<Button>): Button => ({ position: 0, action: "kiro.focus", ...o }) as Button;

test("resolveButtonIcon: explicit icon wins", () => {
  expect(resolveButtonIcon(b({ icon: "custom" }))).toBe("custom");
});

test("resolveButtonIcon: kiro default by action", () => {
  expect(resolveButtonIcon(b({ action: "kiro.trust" }))).toBe("kiro-trust");
  expect(resolveButtonIcon(b({ action: "kiro.agent.picker" }))).toBe("kiro-agent");
});

test("resolveButtonIcon: target action derives from the target", () => {
  expect(resolveButtonIcon(b({ action: "target.launch", target: "claude-code" }))).toBe("claude-code-launch");
  expect(resolveButtonIcon(b({ action: "target.focus", target: "claude-app" }))).toBe("claude-app-focus");
});

test("resolveButtonIcon: target action with no target falls through to null", () => {
  expect(resolveButtonIcon(b({ action: "target.launch" }))).toBeNull();
});

test("resolveButtonLabel: explicit, kiro default, and target-derived", () => {
  expect(resolveButtonLabel(b({ label: "Hi" }))).toBe("Hi");
  expect(resolveButtonLabel(b({ action: "kiro.cycle" }))).toBe("Cycle");
  expect(resolveButtonLabel(b({ action: "target.launch", target: "amazon-quick" }))).toBe("Quick");
});

test("buttonsByPosition: orders by position and fills gaps with null", () => {
  const arr = buttonsByPosition([b({ position: 2, action: "kiro.no" }), b({ position: 0, action: "kiro.yes" })], 4);
  expect(arr.length).toBe(4);
  expect(arr[0]?.action).toBe("kiro.yes");
  expect(arr[1]).toBeNull();
  expect(arr[2]?.action).toBe("kiro.no");
  expect(arr[3]).toBeNull();
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `cd /Users/jsamuel/src/sauhsoj-streamdecker/streamdecker && bun test src/buttons.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement `src/buttons.ts`**

```ts
import { getTarget } from "../shared/targets.js";
import type { Button } from "../shared/config/schema.js";

const ACTION_DEFAULTS: Record<string, { icon: string; label: string }> = {
  "kiro.focus": { icon: "kiro-focus", label: "Focus" },
  "kiro.cycle": { icon: "kiro-cycle", label: "Cycle" },
  "kiro.alert": { icon: "kiro-alert", label: "Alert" },
  "kiro.launch": { icon: "kiro-launch", label: "Launch" },
  "kiro.yes": { icon: "kiro-yes", label: "Yes" },
  "kiro.no": { icon: "kiro-no", label: "No" },
  "kiro.trust": { icon: "kiro-trust", label: "Trust" },
  "kiro.agent": { icon: "kiro-agent", label: "Agent" },
  "kiro.agent.picker": { icon: "kiro-agent", label: "Agents" },
};

function isTargetAction(action: string): boolean {
  return action === "target.launch" || action === "target.focus";
}

/** Icon base-name for a button: explicit icon → target-derived → kiro default → null. */
export function resolveButtonIcon(button: Button): string | null {
  if (button.icon) return button.icon;
  if (isTargetAction(button.action) && button.target) {
    const t = getTarget(button.target);
    if (t) return button.action === "target.launch" ? t.launchIcon : t.focusIcon;
  }
  return ACTION_DEFAULTS[button.action]?.icon ?? null;
}

/** Display label for a button: explicit label → target label → kiro default → "". */
export function resolveButtonLabel(button: Button): string {
  if (button.label) return button.label;
  if (isTargetAction(button.action) && button.target) {
    const t = getTarget(button.target);
    if (t) return t.label;
  }
  return ACTION_DEFAULTS[button.action]?.label ?? "";
}

/** Ordered slot array (length = slots) indexed by button.position; gaps are null. */
export function buttonsByPosition(buttons: Button[], slots: number): (Button | null)[] {
  const arr: (Button | null)[] = new Array(slots).fill(null);
  for (const btn of buttons) {
    if (btn.position >= 0 && btn.position < slots) arr[btn.position] = btn;
  }
  return arr;
}
```

- [ ] **Step 4: Run to confirm pass**

Run: `cd /Users/jsamuel/src/sauhsoj-streamdecker/streamdecker && bun test src/buttons.test.ts && bun run typecheck`
Expected: all pass; typecheck clean.

- [ ] **Step 5: Commit**

```bash
cd /Users/jsamuel/src/sauhsoj-streamdecker
git add streamdecker/src/buttons.ts streamdecker/src/buttons.test.ts
git commit -m "feat(standalone): Add pure button icon/label/slot resolver"
```

---

## Task 3: Refactor `main.ts` to render & dispatch from `config.buttons`

**Files:**
- Modify: `streamdecker/src/main.ts`

This is an integration refactor; READ `main.ts` fully first. Make these changes, preserving the agent page, Launch long-press, and info-bar paging.

- [ ] **Step 1: Replace the hardcoded layout arrays + imports**

At the top imports, add:
```ts
import { buttonsByPosition, resolveButtonIcon, resolveButtonLabel } from './buttons.js';
import { launchTarget, focusTarget } from '../shared/actions/target-dispatch.js';
import type { Button } from '../shared/config/schema.js';
```
Delete the `buttonActions`, `buttonIcons`, `buttonLabels` arrays. Add a helper that reads the current slots:
```ts
function deviceSlots(): number {
  return getConfig().device.type === 'mini' ? 6 : 8;
}
function currentButtons(): (Button | null)[] {
  return buttonsByPosition(getConfig().buttons, deviceSlots());
}
```

- [ ] **Step 2: Make icon loading button-driven**

Replace `loadButtonIcon(index)` so it resolves icon + label from a `Button` via the resolver (keep the existing canvas/sharp compositing exactly; only the icon name + label source changes):
```ts
async function loadButtonIcon(button: Button | null): Promise<Buffer | null> {
  if (!button) return null;
  const iconName = resolveButtonIcon(button);
  if (!iconName) return null;
  const iconPath = join(ICONS_DIR, `${iconName}-96.png`);
  const fallbackPath = join(ICONS_DIR, `${iconName}.png`);
  const path = existsSync(iconPath) ? iconPath : (existsSync(fallbackPath) ? fallbackPath : null);
  if (!path) { console.log(`[Main] Icon not found: ${iconName}`); return null; }
  const label = resolveButtonLabel(button);
  // ... existing sharp(path).resize(96,96) + canvas label composite, unchanged ...
}
```
Update `initButtons()` to iterate `currentButtons()`:
```ts
async function initButtons(sendToDevice: boolean = true) {
  const slots = currentButtons();
  for (let i = 0; i < slots.length; i++) {
    const buffer = await loadButtonIcon(slots[i]);
    if (buffer) {
      if (sendToDevice) await deckConnection.setButtonImage(i, buffer);
      const pngBuffer = await sharp(buffer, { raw: { width: 96, height: 96, channels: 3 } }).png().toBuffer();
      const b64 = pngBuffer.toString('base64');
      buttonImageCache.set(i, b64);
      emulator?.sendButtonImage(i, b64);
    }
  }
}
```

- [ ] **Step 3: Make dispatch button-driven**

Replace the `ActionRegistry` + `handleButtonDown`/`handleButtonUp` action lookups so the action comes from the resolved button at that index. Keep the agent-page branch and the `kiro.launch` long-press branch keyed off the slot's action:
```ts
const ActionRegistry: Record<string, (button: Button) => Promise<void>> = {
  'kiro.focus': async () => { await focusKiro(); },
  'kiro.cycle': async () => { await cycleKiroTabs(); },
  'kiro.alert': async () => { await alertIdleKiro(); },
  'kiro.launch': async () => { await launchKiroWithPicker(); },
  'kiro.yes': async () => { await sendYes(); },
  'kiro.no': async () => { await sendNo(); },
  'kiro.trust': async () => { await sendTrust(); },
  'target.launch': async (b) => { if (b.target) await launchTarget(b.target, b.folder || undefined); },
  'target.focus': async (b) => { if (b.target) await focusTarget(b.target); },
};

async function handleButtonDown(index: number) {
  const slot = currentButtons()[index];
  const actionId = slot?.action;

  if (actionId === 'kiro.launch' && currentPage === 'main') {
    launchButtonDownTime = Date.now();
    return;
  }
  if (currentPage === 'agents') { /* unchanged agent-select logic */ return; }
  if (actionId === 'kiro.agent' || actionId === 'kiro.agent.picker') { await showAgentPage(); return; }

  const handler = actionId ? ActionRegistry[actionId] : undefined;
  if (handler && slot) {
    try { await handler(slot); } catch (e) { console.error('[Main] Action failed:', e); }
  }
}

async function handleButtonUp(index: number) {
  const slot = currentButtons()[index];
  if (slot?.action === 'kiro.launch' && launchButtonDownTime !== null) {
    /* unchanged long-press logic: launchKiro() vs launchKiroWithPicker() */
  }
}
```
(Keep `app.iterm` out — it was unused-ish; if anything references it, retain it.)

- [ ] **Step 4: Re-render on config change**

In `main()`, where `emulator.onConfigChange`/`onDeviceChange` are set, ensure a buttons/device change re-renders: after `updateConfig(...)` for device change, and add an `onConfigChange` handler if present that calls `await showMainPage()`. (If `EmulatorServer` lacks `onConfigChange`, add it in Task 5 when wiring the editor; for now re-render on `onDeviceChange`.)

- [ ] **Step 5: Verify it runs**

Run: `cd /Users/jsamuel/src/sauhsoj-streamdecker/streamdecker && bun run typecheck` → clean.
Then: `timeout 8 bun run dev > /tmp/sd-p2.log 2>&1; tail -20 /tmp/sd-p2.log` → app starts, "[Deck] Connected", buttons render (default config = the kiro layout), no crash.

- [ ] **Step 6: Commit**

```bash
cd /Users/jsamuel/src/sauhsoj-streamdecker
git add streamdecker/src/main.ts
git commit -m "refactor(standalone): Render and dispatch buttons from config.buttons"
```

---

## Task 4: Emulator renders from config (and drop the kiro.thinking outlier)

**Files:**
- Modify: `streamdecker/emulator/script.js`
- Modify: `streamdecker/emulator/index.html`

- [ ] **Step 1: Render per-key action labels from config**

In `script.js`, delete the hardcoded `buttonActions` array (line ~10). In `loadConfig()` (or where config is applied), set each key's action label from `config.buttons` by position. Add:
```js
function renderButtonActions(config) {
  const slots = config.device?.type === 'mini' ? 6 : 8;
  const byPos = new Array(slots).fill(null);
  (config.buttons || []).forEach(b => { if (b.position >= 0 && b.position < slots) byPos[b.position] = b; });
  for (let i = 0; i < slots; i++) {
    const el = document.getElementById(`action-${i}`);
    if (el) el.textContent = byPos[i] ? byPos[i].action : '';
  }
}
```
Call `renderButtonActions(config)` after the config loads. Remove any reference to the old `buttonActions` constant and the `kiro.thinking` string.

- [ ] **Step 2: Verify**

Run the app (`timeout 8 bun run dev`), open `http://127.0.0.1:3848`, confirm the per-key labels show the config actions (default: focus/cycle/alert/launch/yes/no/trust/agent — note **trust**, not thinking). Confirm no console error referencing `buttonActions`.

- [ ] **Step 3: Commit**

```bash
cd /Users/jsamuel/src/sauhsoj-streamdecker
git add streamdecker/emulator/script.js streamdecker/emulator/index.html
git commit -m "feat(emulator): Render button actions from config"
```

---

## Task 5: Emulator per-button editor

**Files:**
- Modify: `streamdecker/emulator/index.html`
- Modify: `streamdecker/emulator/script.js`
- Modify (if needed): `streamdecker/emulator/server.ts` (only if an `onConfigChange` re-render hook is missing)

- [ ] **Step 1: Add editor markup** in the Settings modal of `index.html` (after the existing settings fields), a container the script fills:
```html
<div class="setting-group">
  <h3>Buttons</h3>
  <div id="button-editor"></div>
</div>
```

- [ ] **Step 2: Build the editor in `script.js`**

Add a function that, given the current config, renders one row per slot: an action `<select>` (all ActionIds), and — shown only when the action is `target.launch`/`target.focus` — a target `<select>` (kiro-cli/claude-code/amazon-quick/claude-app) plus, for `target.launch`, a folder `<input>`.
```js
const ACTION_IDS = ['kiro.focus','kiro.cycle','kiro.alert','kiro.launch','kiro.yes','kiro.no','kiro.trust','kiro.agent','kiro.agent.picker','target.launch','target.focus'];
const TARGET_IDS = ['kiro-cli','claude-code','amazon-quick','claude-app'];

function renderButtonEditor(config) {
  const slots = config.device?.type === 'mini' ? 6 : 8;
  const byPos = new Array(slots).fill(null);
  (config.buttons || []).forEach(b => { if (b.position < slots) byPos[b.position] = b; });
  const host = document.getElementById('button-editor');
  host.innerHTML = '';
  for (let i = 0; i < slots; i++) {
    const b = byPos[i] || { position: i, action: 'kiro.focus' };
    const row = document.createElement('div');
    row.className = 'button-row';
    row.dataset.position = String(i);
    const isTarget = b.action === 'target.launch' || b.action === 'target.focus';
    row.innerHTML = `
      <span>#${i}</span>
      <select class="b-action">${ACTION_IDS.map(a => `<option value="${a}" ${a===b.action?'selected':''}>${a}</option>`).join('')}</select>
      <select class="b-target" style="${isTarget?'':'display:none'}">${TARGET_IDS.map(t => `<option value="${t}" ${t===b.target?'selected':''}>${t}</option>`).join('')}</select>
      <input class="b-folder" placeholder="folder (launch)" value="${b.folder||''}" style="${b.action==='target.launch'?'':'display:none'}">`;
    row.querySelector('.b-action').addEventListener('change', (e) => {
      const v = e.target.value;
      row.querySelector('.b-target').style.display = (v==='target.launch'||v==='target.focus') ? '' : 'none';
      row.querySelector('.b-folder').style.display = (v==='target.launch') ? '' : 'none';
    });
    host.appendChild(row);
  }
}

function collectButtons() {
  return [...document.querySelectorAll('#button-editor .button-row')].map(row => {
    const action = row.querySelector('.b-action').value;
    const out = { position: Number(row.dataset.position), action };
    if (action === 'target.launch' || action === 'target.focus') {
      out.target = row.querySelector('.b-target').value;
      const f = row.querySelector('.b-folder').value.trim();
      if (action === 'target.launch' && f) out.folder = f;
    }
    return out;
  });
}
```
Call `renderButtonEditor(config)` whenever the settings modal opens. On settings Save, include `buttons: collectButtons()` in the `PUT /api/config` payload (extend the existing save path / `getFormConfig`).

- [ ] **Step 3: Ensure the server re-renders on save**

Confirm `emulator/server.ts`'s `PUT /api/config` calls `updateConfig` and triggers `onConfigChange`. In `main.ts`, wire `emulator.onConfigChange = async () => { await showMainPage(); }` (add the field to `EmulatorServer` if absent, invoking it after `updateConfig` in the PUT handler).

- [ ] **Step 4: Add minimal CSS** in `streamdecker/emulator/style.css` so rows are legible:
```css
.button-row { display: flex; gap: 6px; align-items: center; margin: 4px 0; }
.button-row select, .button-row input { flex: 1; }
```

- [ ] **Step 5: Verify end-to-end**

Run `bun run dev`; open the emulator; in Settings set slot #3 to `target.launch` / `claude-code` / folder blank; Save. Confirm: the config persists (`cat ~/.config/streamdecker/config.json` shows the button), the key re-renders with the Claude Code icon, and pressing it (emulator button) launches Claude Code in a new terminal tab. Set another slot to `target.focus`/`claude-app` and confirm it focuses Claude.

- [ ] **Step 6: Commit**

```bash
cd /Users/jsamuel/src/sauhsoj-streamdecker
git add streamdecker/emulator/index.html streamdecker/emulator/script.js streamdecker/emulator/style.css streamdecker/src/main.ts streamdecker/emulator/server.ts
git commit -m "feat(emulator): Add per-button editor (action + target + folder)"
```

---

## Task 6: Finalize

- [ ] **Step 1:** `cd streamdecker && bun test` — all green.
- [ ] **Step 2:** `cd streamdecker && bun run typecheck` — clean.
- [ ] **Step 3:** `npm run build` (root) — plugin bundle still builds (shared changes shouldn't break it).
- [ ] **Step 4: Manual smoke** — `bun run dev`: default layout renders (with **Trust**), agent page works (press Agent), Launch long-press works (short=picker, long=last folder), info-bar paging works, and an edited `target.launch`/`target.focus` button launches/focuses the right app.
- [ ] **Step 5: Docs** — update `README.md` Config section: `config.buttons` now drives the standalone layout; each button has `position`, `action` (incl. `target.launch`/`target.focus`), optional `icon`/`label`/`target`/`folder`; configurable via the emulator Settings. Commit:
```bash
git add README.md
git commit -m "docs: Document config-driven standalone buttons"
```

---

## Spec coverage check
- `config.buttons` as source of truth → Tasks 2, 3, 4.
- Standardize `kiro.trust` (drop `kiro.thinking`) → Tasks 3 (main.ts), 4 (script.js).
- `ActionId` += `target.launch`/`target.focus`; `ButtonSchema` += `target`/`folder` → Task 1.
- Testable `src/buttons.ts` → Task 2.
- Preserve agent page / Launch long-press / info-bar paging → Task 3.
- Emulator per-button editor → Task 5.
- Render emulator from config → Task 4.
- Out of scope (drag-reorder, icon upload, Elgato, BTT) → untouched.
- Testing (unit for buttons.ts + schema; manual smoke) → Tasks 1, 2, 6.
