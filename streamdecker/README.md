# Kiro Deck

Stream Deck controller for kiro-cli.

## Requirements

- macOS
- [Bun](https://bun.sh) runtime
- Stream Deck Neo or Mini
- iTerm2

## Installation

```bash
git clone https://github.com/jsamuel1/sauhsoj-streamdecker.git
cd sauhsoj-streamdecker/kiro-deck
chmod +x install.sh uninstall.sh
./install.sh
```

This installs Kiro Deck as a login item that starts automatically.

## Manual Run

```bash
bun run src/main.ts
```

## Uninstall

```bash
./uninstall.sh
```

## Configuration

Config file: `~/.config/kiro-deck/config.json`

```json
{
  "deviceType": "neo",
  "favoriteAgents": ["default", "jupyter", "git", "notes"],
  "agentShortcuts": {
    "debug": "ctrl+shift+d"
  }
}
```

## Features

- 8 buttons (Neo) or 6 buttons (Mini) for kiro-cli control
- Agent picker page - press Agent to see recent agents on buttons
- Info bar shows status messages
- Web emulator at http://127.0.0.1:3848
- Menubar tray with config window

## Button Layout (Neo)

```
[Focus] [Cycle] [Alert] [Launch]
[Yes]   [No]    [Trust] [Agent]
```

## Logs

```bash
tail -f /tmp/kiro-deck.log
```
