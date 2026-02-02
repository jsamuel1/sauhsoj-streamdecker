# Streamdecker

Stream Deck controller for kiro-cli.

## Directory Structure

```
sauhsoj-streamdecker/
├── streamdecker/                    # Standalone app (Bun + menubar)
│   ├── src/
│   │   ├── main.ts                 # Entry point
│   │   ├── updater.ts              # Auto-update from GitHub releases
│   │   ├── deck/connection.ts      # Stream Deck HID connection
│   │   ├── gui/tray.ts             # Menubar tray
│   │   └── infobar/                # Neo LCD info bar renderer
│   ├── emulator/                   # Web-based emulator (http://127.0.0.1:3848)
│   ├── shared/
│   │   ├── actions/                # Kiro actions (focus, cycle, launch, etc.)
│   │   └── config/                 # Config loader, paths
│   ├── scripts/                    # Shell scripts (folder picker, agent picker)
│   ├── fonts/                      # Nunito font for info bar
│   └── build-app.sh                # Build signed .app bundle
│
├── wtf.sauhsoj.streamdecker.sdPlugin/  # Elgato Stream Deck plugin
│   ├── manifest.json               # Plugin manifest
│   ├── bin/plugin.js               # Compiled plugin code
│   ├── scripts/                    # AppleScript actions
│   ├── imgs/                       # Plugin icons
│   ├── ui/                         # Property inspector UIs
│   ├── Kiro-Neo.streamDeckProfile  # Neo profile (8 keys)
│   ├── Kiro-Mini.streamDeckProfile # Mini profile (6 keys)
│   └── Kiro-OG.streamDeckProfile   # OG profile (15 keys)
│
├── shared/icons/                   # Consolidated icon assets
├── btt/                            # BetterTouchTool preset
├── docs/                           # Project documentation
└── scripts/                        # Build scripts, icon generation
```

## Modes

- **standalone** - Direct USB/HID control with full features (Neo info bar, auto-update)
- **elgato** - Plugin for Elgato Stream Deck software with profiles
- **btt** - BetterTouchTool preset export

## Features

- Focus Kiro - Bring kiro-cli terminal to foreground
- Cycle Tabs - Cycle through kiro-cli terminal tabs
- Alert - Jump to tab with pending prompt
- Launch - Open folder picker (short press) or last folder (long press)
- Yes/No/Trust - Send responses to kiro-cli prompts
- Switch Agent - Agent picker page or direct agent buttons
- Neo Info Bar - LCD strip showing agent, context %, calendar
- Web Emulator - Browser-based emulator at http://127.0.0.1:3848
- Auto-Update - Check for updates from GitHub releases

## Installation

Download from [GitHub Releases](https://github.com/jsamuel1/sauhsoj-streamdecker/releases):

- `Streamdecker.dmg` - Standalone macOS app
- `wtf.sauhsoj.streamdecker.streamDeckPlugin` - Elgato plugin installer
- `Kiro-*.streamDeckProfile` - Pre-configured profiles

## Development

```bash
# Run standalone app
cd streamdecker && bun run dev

# Build .app bundle
cd streamdecker && ./build-app.sh

# Build Elgato plugin
npm run build
```

## Config

Config stored in `~/.config/streamdecker/config.json`:

- `mode` - standalone, elgato, or btt
- `device.type` - neo, mini, or og
- `agents.favorites` - Favorite agents for quick access
- `agents.shortcuts` - Keyboard shortcuts per agent

## Icons

Generated using Amazon Nova Canvas via Bedrock. Kiro ghost mascot from [kiro.dev](https://kiro.dev).
