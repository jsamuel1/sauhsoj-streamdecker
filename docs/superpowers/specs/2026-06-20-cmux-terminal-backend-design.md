# cmux Terminal Backend — Design

**Date:** 2026-06-20
**Status:** Approved (pending spec review)

## Goal

Let streamdecker drive [cmux](https://github.com/manaflow-ai/cmux) as a terminal
backend, as an alternative to the current iTerm/AppleScript automation. cmux is a
Ghostty-based macOS terminal purpose-built for AI coding agents and is controlled
through the `cmux` CLI over its control socket (already enabled locally via
`automation.socketControlMode: "automation"`).

## Decisions

These were settled during brainstorming:

- **Control path:** Shell out to the `cmux` CLI via `execFile` (no shell). Mirrors
  how the codebase already shells out to `osascript`, and matches cmux-mcp's
  hardening (arguments passed as argv, never through a shell).
- **Scope:** Standalone Bun app **and** the Elgato plugin. Both consume
  `streamdecker/shared/actions/`, so a single backend refactor covers both. The
  BetterTouchTool preset stays iTerm-only.
- **Architecture:** Introduce a `TerminalBackend` interface with two
  implementations — `AppleScriptBackend` (existing terminals) and `CmuxBackend`.
  Actions call the interface; config + detection pick the backend.
- **Alert detection:** Use `cmux list-notifications` to find the surface needing
  attention (cmux's kiro integration already routes approval cards/attention
  there). No screen-scraping.
- **Selection:** Auto-detect with cmux **preferred** — checked first so a running
  cmux wins over iTerm. Explicit `terminal.app: "cmux"` still forces it.
- **Cycle semantics:** Cycle among **all surfaces** in the current workspace. In
  cmux each surface is effectively an agent session, so this matches cmux's model
  and avoids fragile title-based filtering.

## Architecture

### `TerminalBackend` interface

New module under `streamdecker/shared/terminal/`. Every terminal-touching action
calls this interface instead of `osascript`/`cmux` directly.

```ts
interface TerminalBackend {
  name: string;
  checkPermission(): Promise<boolean>;     // AppleScript automation perm; cmux → always true
  focus(): Promise<"ok" | "none">;          // bring kiro terminal to front
  cycleTab(): Promise<"ok" | "none">;       // next surface/tab
  nextAlertTab(): Promise<"ok" | "none">;   // jump to tab needing attention
  launch(folder: string): Promise<void>;    // new tab → cd → kiro-cli chat
  send(text: string): Promise<void>;        // type + enter (yes/no/trust, agent switch)
  sendKey(key: string): Promise<void>;      // control chars / special keys
}
```

Return values use `"ok" | "none"` to preserve the existing action behavior, where
`"none"` triggers `ev.action.showAlert()` on the Stream Deck key.

### Implementations

- **`AppleScriptBackend`** — lifts today's `osascript` logic (the installed
  `.applescript` files, the inline launch AppleScript, and the `System Events`
  keystrokes), parameterized by app name. Covers `iTerm`, `Terminal`, `Warp`,
  `WezTerm`. `checkPermission()` keeps the existing automation-permission probe
  (`check-iterm-permission.applescript`).
- **`CmuxBackend`** — shells out to the `cmux` CLI (resolved on PATH;
  `/opt/homebrew/bin/cmux` locally) via `execFile`.

### Factory + detection

`getTerminalBackend()` reads config, runs detection, and returns the appropriate
backend (cached after first resolution).

Detection order when `terminal.app === "auto"`:

1. **cmux first** — selected when `pgrep -x cmux` reports the app running **and**
   `cmux` is resolvable on PATH (`which cmux`).
2. Otherwise fall through to the existing list: `iTerm`, `Terminal`, `Warp`,
   `WezTerm` (first running wins).

An explicit `terminal.app` value bypasses detection and forces that backend.

## cmux CLI mapping

| Backend method | cmux command(s) |
|---|---|
| `focus()` | `cmux set-app-focus active` |
| `cycleTab()` | `cmux list-pane-surfaces` → determine next surface → `cmux move-surface --surface <id> --focus true` |
| `nextAlertTab()` | `cmux list-notifications` → focus first flagged surface via `cmux move-surface --surface <id> --focus true` (+ `set-app-focus active`); return `"none"` if no notifications |
| `launch(folder)` | `cmux new-surface --type terminal` → capture new surface id → `cmux send --surface <id> -- "cd <folder> && kiro-cli chat\n"` |
| `send(text)` | `cmux send -- "<text>\n"` (focused surface) — used by yes (`y`), no (`n`), trust (`t`), agent switch |
| `sendKey(key)` | `cmux send-key <key>` (e.g. `escape`, `ctrl+c`) |

Notes:
- `cmux send` appends the trailing newline we include in the payload to submit the
  line, consistent with cmux-mcp's `CommandExecutor`.
- `cycleTab()` tracks "next" relative to the currently focused surface among the
  ordered `list-pane-surfaces` output, wrapping around.
- All surface ids and notification targets come from parsing CLI output; parsing
  is isolated in small helpers so it can be unit-tested against captured fixtures.

## Affected files

- `streamdecker/shared/config/schema.ts` — add `"cmux"` to `TerminalSchema.app`.
- `streamdecker/shared/actions/terminal.ts` — detection now prefers cmux; helpers
  move into the backend modules.
- `streamdecker/shared/kiro-utils.ts` — the duplicated terminal helpers
  (`focusTerminal`, `sendKeystroke`, `sendCommand`, `checkiTermPermission`)
  consolidate into the backends; this file keeps only what's genuinely shared.
- `streamdecker/shared/actions/*.ts` — `focus-kiro`, `cycle-kiro-tabs`,
  `next-alert-tab`, `launch-kiro-folder`, `send-yes`, `send-no`, `send-thinking`,
  `switch-agent-personality` call backend methods instead of `osascript`/inline
  commands.
- `streamdecker/shared/terminal/` (new) — `types.ts`, `applescript-backend.ts`,
  `cmux-backend.ts`, `index.ts` (factory + detection).

## Cleanup folded in

The terminal helpers are currently duplicated across `terminal.ts` and
`kiro-utils.ts`. That duplication is the direct obstacle to adding a second
backend, so it is consolidated into the backend modules as part of this work. No
unrelated refactoring beyond the terminal layer.

## Testing

- **Unit — `CmuxBackend`:** mock `execFile`; assert exact `cmux` argv for each
  method (`focus`, `cycleTab`, `nextAlertTab`, `launch`, `send`, `sendKey`).
- **Unit — output parsing:** parse captured `list-pane-surfaces` and
  `list-notifications` fixtures into surface ids / next-target selection.
- **Unit — detection/factory:** mock `pgrep`/`which`; verify cmux-preferred order,
  explicit-app override, and fallback to AppleScript terminals.
- **Manual smoke:** run `bun run dev` with cmux running; exercise Focus, Cycle,
  Alert, Launch, Yes/No/Trust, and Agent switch buttons.

## Out of scope

- BetterTouchTool preset (remains iTerm/AppleScript).
- Direct control-socket/protocol implementation (CLI only).
- Filtering cmux surfaces to "running kiro" (cycle covers all surfaces).
