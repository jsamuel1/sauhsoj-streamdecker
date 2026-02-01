# sauhsoj-streamdecker

Streamdecker - Stream Deck controller for kiro-cli.

## Architecture

```
sauhsoj-streamdecker/
├── kiro-deck/              # Main application (Bun)
│   ├── src/main.ts         # Entry point
│   ├── emulator/           # Web-based Stream Deck emulator
│   └── build-app.sh        # Build signed .app bundle
│
├── shared/                 # Shared modules
│   ├── actions/            # Kiro-cli actions (focus, cycle, send keys)
│   ├── config/             # Config schema, loader, app management
│   └── exporters/          # BTT and Elgato profile exporters
│
├── wtf.sauhsoj.streamdecker.sdPlugin/  # Elgato plugin (bundled component)
└── wtf.sauhsoj.kiro-icons.sdIconPack/  # Icon pack
```

## Modes

Streamdecker supports three modes of operation:

- **standalone** - Direct USB/HID control of Stream Deck (full features including Neo info bar)
- **elgato** - Installs plugin to Elgato Stream Deck software
- **btt** - Exports triggers to BetterTouchTool

## Features

- **Focus Kiro** - Bring kiro-cli terminal window to foreground
- **Switch Agent** - Switch kiro-cli to a different agent
- **Send Yes/No/Trust** - Send responses to kiro-cli prompts
- **Cycle Tabs** - Cycle through kiro-cli terminal tabs
- **Neo Info Bar** - LCD strip showing agent name, context %, calendar (standalone mode only)
- **Web Emulator** - Browser-based Stream Deck emulator at http://127.0.0.1:3848

## Installation

Download the latest release from GitHub Releases, or build from source:

```bash
cd kiro-deck
bun install
./build-app.sh
```

## Development

```bash
# Run standalone app
cd kiro-deck && bun run dev

# Run emulator only
cd kiro-deck && bun run emulator

# Build Elgato plugin
npm run build
```

## Icons

Icons generated using Amazon Nova Canvas via Bedrock. The Kiro ghost mascot logo is from [kiro.dev](https://kiro.dev).
