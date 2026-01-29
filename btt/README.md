# Kiro Stream Deck BTT Preset

BetterTouchTool configuration for Stream Deck Neo with Kiro CLI controls and calendar info bar.

## Features

### 6 Buttons
- **Launch Kiro** - Opens new iTerm tab with `kiro-cli chat`
- **Focus Kiro** - Activates iTerm and focuses first kiro-cli tab
- **Yes** - Sends 'y' keystroke to iTerm
- **No** - Sends 'n' keystroke to iTerm
- **Cycle** - Cycles through kiro-cli tabs
- **Think** - Sends "think about this" + Enter

### Neo LCD Info Bar
- Shows next calendar event within 2 hours
- Color-coded urgency:
  - 🔴 Red: < 5 minutes
  - 🟡 Yellow: < 15 minutes
  - 🟢 Green: 15+ minutes
- Updates every 30 seconds

## Setup

### Prerequisites
1. Install BetterTouchTool: `brew install --cask bettertouchtool`
2. Quit Elgato Stream Deck app
3. In BTT preferences, enable "Fully Controlled by BetterTouchTool" for Stream Deck

### Installation

Run the setup script to add all triggers:

```bash
./setup-btt.sh
```

Or import manually via BTT's AppleScript API (see setup-btt.sh for details).

### Manual Import (Alternative)

If the setup script doesn't work, you can import the preset file:
1. Open BetterTouchTool
2. Go to Presets menu
3. Import `kiro-streamdeck.bttpreset`

## Files

- `kiro-streamdeck.bttpreset` - BTT preset JSON (for manual import)
- `calendar-widget.applescript` - Calendar script for Neo LCD
- `setup-btt.sh` - Setup script to add triggers via AppleScript API

## Troubleshooting

### Buttons not appearing
- Ensure Stream Deck is in "Fully Controlled by BTT" mode
- Check BTT preferences → Stream Deck section
- Try restarting BTT

### Calendar not updating
- Grant Calendar access to BetterTouchTool in System Preferences → Privacy
- Test script manually: `osascript calendar-widget.applescript`

### Keystrokes not working
- Grant Accessibility access to BetterTouchTool
- Grant Accessibility access to iTerm
