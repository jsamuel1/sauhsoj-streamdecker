# Kiro Stream Deck BTT Setup

BetterTouchTool configuration for Stream Deck with Kiro CLI controls.

## Features

### 8 Buttons

- **Focus** - Activates iTerm and focuses first kiro-cli tab
- **Cycle** - Cycles through kiro-cli tabs
- **Alert** - Finds idle kiro-cli tabs
- **Launch** - Opens new iTerm tab with folder picker + kiro-cli
- **Yes** - Sends 'y' to iTerm
- **No** - Sends 'n' to iTerm
- **Trust** - Sends 't' to trust all pending changes
- **Agent** - Switch kiro-cli agent

### Neo LCD Info Bar

- Shows next calendar event within 2 hours
- Color-coded urgency (red < 5min, yellow < 15min, green 15+min)
- Updates every 30 seconds

## Setup

### Prerequisites

1. Install BetterTouchTool: `brew install --cask bettertouchtool`
2. Quit Elgato Stream Deck app
3. In BTT preferences, enable "Fully Controlled by BetterTouchTool" for Stream Deck
4. Enable BTT scripting server (Preferences → Advanced → Enable Scripting Server)

### Installation

From the repo root, run:

```bash
python3 create-btt-buttons.py --apply
```

### Commands

```bash
python3 create-btt-buttons.py --list     # Show button status
python3 create-btt-buttons.py --apply    # Apply all buttons
python3 create-btt-buttons.py --delete   # Delete all buttons
python3 create-btt-buttons.py KIRO-YES   # Apply single button
```

## Files

- `../create-btt-buttons.py` - Main installer (uses shared scripts)
- `calendar-widget.applescript` - Calendar script for Neo LCD
- `kiro-streamdeck.bttpreset` - BTT preset JSON (manual import fallback)

## Troubleshooting

### Buttons not appearing

- Ensure Stream Deck is in "Fully Controlled by BTT" mode
- Check BTT preferences → Stream Deck section
- Try restarting BTT

### Calendar not updating

- Grant Calendar access to BetterTouchTool in System Preferences → Privacy
- Test script manually: `osascript btt/calendar-widget.applescript`

### Keystrokes not working

- Grant Accessibility access to BetterTouchTool
- Grant Accessibility access to iTerm
