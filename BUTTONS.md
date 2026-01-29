# Stream Deck Neo Button Layout

## Layout

```
┌─────────┬─────────┬─────────┬─────────┐
│  Focus  │  Cycle  │  Alert  │ Launch  │  ← Top Row
├─────────┼─────────┼─────────┼─────────┤
│   Yes   │   No    │  Trust  │  Agent  │  ← Bottom Row
└─────────┴─────────┴─────────┴─────────┘
```

## Button Details

| Position | ID | Icon | Description |
|----------|-----|------|-------------|
| Top 1 | KIRO-FOCUS | kiro-focus.png | Focus first iTerm tab running `kiro-cli` |
| Top 2 | KIRO-CYCLE | kiro-switch.png | Cycle to next iTerm tab running `kiro-cli` |
| Top 3 | KIRO-ALERT | kiro-thinking.png | Find next idle (not processing) `kiro-cli` tab |
| Top 4 | KIRO-LAUNCH | kiro-launch.png | Folder picker → cd → `kiro-cli chat` (tab auto-closes on exit) |
| Bottom 1 | KIRO-YES | kiro-yes.png | Send `y` to current iTerm session (approve action) |
| Bottom 2 | KIRO-NO | kiro-no.png | Send `n` to current iTerm session (reject action) |
| Bottom 3 | KIRO-TRUST | kiro-logo.png | Send `t` to current iTerm session (trust mode) |
| Bottom 4 | KIRO-AGENT | kiro-agent.png | Agent picker → `/agent switch <name>` |

## Configuration Files

| File | Purpose |
|------|---------|
| `~/.kiro/kiro-picker-favorites` | Favorite folders (appear first in picker) |
| `~/.kiro/kiro-picker-recent-dirs` | Recent folders (auto-maintained) |
| `~/.kiro/kiro-picker-recent-agents` | Recent agents (auto-maintained) |

## Icon Sources

All icons in `wtf.sauhsoj.kiro-icons.sdIconPack/icons/` (144x144, cropped to 96x96):

| Icon | Description |
|------|-------------|
| kiro-focus.png | Eye/focus symbol |
| kiro-switch.png | Arrows/cycle symbol |
| kiro-thinking.png | Thought bubble |
| kiro-launch.png | Rocket symbol |
| kiro-yes.png | Checkmark |
| kiro-no.png | X symbol |
| kiro-logo.png | Kiro ghost logo |
| kiro-agent.png | Person/avatar symbol |

## Recreating Buttons

```bash
cd /Users/sauhsoj/src/personal/sauhsoj-streamdecker
python3 create-btt-buttons.py --delete
python3 create-btt-buttons.py --apply
```
