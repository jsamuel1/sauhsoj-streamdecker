# sauhsoj-streamdecker

Stream Deck plugin for kiro-cli integration and SA productivity.

## Features

- **Focus Kiro** - Bring kiro-cli terminal window to foreground
- **Switch Agent** - Switch kiro-cli to a different agent (configurable)
- **Send Yes** - Send 'y' to kiro-cli for confirmation prompts
- **Send No** - Send 'n' to kiro-cli for confirmation prompts  
- **Send T** - Send 't' to trust all pending changes

## Installation

```bash
npm install
npm run build
```

Then symlink or copy the `.sdPlugin` folder to your Stream Deck plugins directory:

```bash
# macOS
ln -s "$(pwd)/wtf.sauhsoj.streamdecker.sdPlugin" ~/Library/Application\ Support/com.elgato.StreamDeck/Plugins/
```

## Development

```bash
npm run watch
```

## Icons

Icons generated using Amazon Nova Canvas via Bedrock. The Kiro ghost mascot logo is from [kiro.dev](https://kiro.dev).

## Monitored Applications

The plugin monitors these terminal apps to detect when kiro-cli is running:
- Terminal.app
- iTerm2
- Warp
- WezTerm

## Suggested Layouts

### Stream Deck Mini (6 buttons)

```
┌─────────┬─────────┬─────────┐
│  Send   │  Send   │  Send   │
│   Yes   │   No    │    T    │
├─────────┼─────────┼─────────┤
│  Focus  │ Switch  │ Launch  │
│  Kiro   │  Agent  │  Kiro   │
└─────────┴─────────┴─────────┘
```

- **Top row**: Response actions - Yes, No, Trust
- **Bottom row**: Navigation - focus terminal, switch agent, launch new session
