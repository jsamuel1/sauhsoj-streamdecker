# cmux CLI command mapping (captured live)

Captured 2026-06-20 against cmux.app `com.cmuxterm.app`, CLI
`/opt/homebrew/bin/cmux` (app-bundled at
`/Applications/cmux.app/Contents/Resources/bin/cmux`), socket control mode
`automation`. `cmux ping` → `PONG`.

## Backend method → cmux argv

| Method | argv | Notes |
|---|---|---|
| `focus()` | `set-app-focus active` | Brings cmux to foreground. Always `ok`. |
| `send(text)` | `send -- "<text>\n"` | Trailing newline submits the line (real `\n` byte, per cmux-mcp `CommandExecutor`). Targets `$CMUX_SURFACE_ID` → focused surface when unset. |
| `sendKey(key)` | `send-key <key>` | e.g. `escape`, `ctrl+c`. |
| `openTab(command)` | `new-surface --type terminal` then `send --surface <newRef> -- "<command>\n"` | `new-surface` prints `OK surface:N pane:N workspace:N`; parse `surface:N`. |
| `cycleTab()` | `list-pane-surfaces` → pick next ref after the focused one → `move-surface --surface <ref> --focus true` | `none` when <2 surfaces. |
| `nextAlertTab()` | `list-notifications --json` → first notification uuid → `open-notification --id <uuid>` then `set-app-focus active` | `none` when no notifications. `open-notification` focuses the notification's workspace+surface and marks it read. |

## Output formats (verified)

### `list-pane-surfaces`
```
* surface:1  Terminal  [selected]
  surface:2  Terminal
```
- Focused surface: line begins with `* ` and ends with `[selected]`.
- Other surfaces: two-space indent, no marker.
- Ref shape: `surface:<n>`. `--id-format both` adds a UUID column:
  `* surface:1 1036A743-E3FF-4B09-A572-B122B1ADA4E2  Terminal  [selected]`.

### `new-surface --type terminal`
```
OK surface:2 pane:1 workspace:1
```

### `list-notifications`
- Text (default): `No notifications` when empty.
- `--json`: a JSON array. Empty:
  ```
  [

  ]
  ```
- **Populated shape is INFERRED** (no live notification available at capture
  time). The parser is field-name-agnostic: it scans the raw `--json` text for
  the first UUID and passes it to `open-notification --id`. `list-notifications.json`
  fixture reflects a plausible shape; only the presence of a UUID matters.

### `identify` (alternative current-surface source)
JSON with `focused.surface_ref` (e.g. `"surface:1"`). Not used by the backend —
`cycleTab` derives the focused surface from the `* `/`[selected]` marker in
`list-pane-surfaces`, avoiding a second call.

## Parsing contract (encoded by parse.test.ts)

- `parseSurfaceRefs(output)` → ordered `surface:<n>` refs (regex `\bsurface:\w+\b` per line).
- `parseCurrentSurfaceRef(output)` → the ref on the `* `-prefixed / `[selected]` line, else `undefined`.
- `parseFirstNotificationId(jsonText)` → first UUID match, else `null`.
- `nextSurfaceRef(refs, current)` → next ref after `current`, wrapping; `null` if <2 refs; first non-current ref if `current` unknown.
