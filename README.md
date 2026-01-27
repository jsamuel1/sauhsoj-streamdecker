# sauhsoj-streamdecker

Stream Deck plugin for kiro-cli integration and SA productivity.

## Features

- **Focus Kiro** - Bring kiro-cli terminal window to foreground
- **Switch Agent** - Switch kiro-cli to a different agent (configurable)
- **Send Yes** - Send 'y' to kiro-cli for confirmation prompts
- **Send No** - Send 'n' to kiro-cli for confirmation prompts  
- **Send Thinking** - Send 't' to request thinking/reasoning

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
