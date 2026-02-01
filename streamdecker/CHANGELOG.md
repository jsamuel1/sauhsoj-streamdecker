# Changelog

## [0.2.0] - 2026-01-31

### Added

- Agent picker page: Press Agent button to show recent agents on Stream Deck buttons
- Select any agent directly from the deck, returns to main page automatically
- Page buttons return to main page when on agent picker
- Reads agents from `~/.kiro/agents/*.json` with recent-first ordering

### Changed

- Agent switch no longer changes iTerm tabs unexpectedly
- Launch button uses bundled `launch-kiro-picker.sh` with fzf folder picker
- Scripts use `command -v` for portable fzf/kiro-cli paths

### Fixed

- Font rendering now uses @napi-rs/canvas (no system font install required)
- Replaced AWS Diatype with Nunito ExtraBold (OFL licensed)
- Removed all hardcoded paths from scripts

## [0.1.0] - 2026-01-30

### Added

- Initial release
- Stream Deck Neo/Mini support via @elgato-stream-deck/node
- Button actions: Focus, Cycle, Alert, Launch, Yes, No, Trust, Agent
- Info bar display with Kiro status and calendar sources
- Menubar tray app with native webview config window
- Web-based emulator on http://127.0.0.1:3848
- WebSocket sync between hardware and emulator
