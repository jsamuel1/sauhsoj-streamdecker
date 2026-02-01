# Kiro Deck Architecture

## Overview

Kiro Deck is a Stream Deck integration for kiro-cli that supports three operational modes:

| Mode | Description | Device Control |
|------|-------------|----------------|
| `standalone` | Direct USB/HID control, full features including Neo info bar | kiro-deck app |
| `btt` | Exports config to BetterTouchTool triggers | BTT |
| `elgato` | Exports config to .sdPlugin profile | Elgato software |

## Design Principles

1. **Single source of truth**: All button layouts, actions, and settings in one config file
2. **No hardcoded paths**: All paths relative or use XDG conventions
3. **Shared action library**: One implementation of AppleScript/terminal actions
4. **Mode-specific features**: Neo info bar only in standalone mode

## Directory Structure

```
sauhsoj-streamdecker/
├── src/
│   ├── config/
│   │   ├── schema.ts          # Zod schema for unified config
│   │   ├── loader.ts          # Config loading/saving
│   │   └── paths.ts           # Portable path resolution
│   ├── actions/
│   │   ├── index.ts           # Action registry
│   │   ├── kiro.ts            # Kiro-cli actions (focus, cycle, etc.)
│   │   ├── terminal.ts        # Terminal abstraction layer
│   │   └── applescript.ts     # AppleScript execution
│   └── exporters/
│       ├── btt.ts             # BTT trigger generator
│       └── elgato.ts          # sdPlugin profile generator
├── kiro-deck/                 # Standalone app (Bun)
│   └── src/
│       ├── main.ts            # Entry point
│       ├── deck/              # Stream Deck HID control
│       └── infobar/           # Neo LCD rendering (standalone only)
├── wtf.sauhsoj.streamdecker.sdPlugin/  # Elgato plugin
│   ├── manifest.json
│   └── bin/                   # Built plugin code
└── scripts/                   # Shared shell scripts
```

## Unified Config Schema

Location: `~/.config/kiro-deck/config.json`

```typescript
interface Config {
  // Operating mode
  mode: 'standalone' | 'btt' | 'elgato';
  
  // Device settings
  device: {
    type: 'neo' | 'mini';
    brightness?: number;  // 0-100, standalone only
  };
  
  // Button layout (8 buttons for Neo, 6 for Mini)
  buttons: Array<{
    position: number;     // 0-7 for Neo, 0-5 for Mini
    action: string;       // Action ID from registry
    icon?: string;        // Icon name (resolved from icons/)
    label?: string;       // Optional text overlay
  }>;
  
  // Theme (standalone only)
  theme?: {
    accentColor: string;
    backgroundColor: string;
  };
  
  // Info bar sources (standalone only)
  infoBar?: {
    sources: string[];    // ['kiro', 'calendar', 'time']
    updateInterval: number;
  };
  
  // Terminal settings
  terminal: {
    app: 'iTerm' | 'Terminal' | 'Warp' | 'WezTerm' | 'auto';
    detectCommand: string;  // Process name to detect (default: 'kiro-cli')
  };
  
  // Agent management
  agents: {
    favorites: string[];
    shortcuts: Record<string, string>;  // agent -> keyboard shortcut
  };
}
```

## Action Registry

All actions are defined once and used by all modes:

| Action ID | Description | AppleScript |
|-----------|-------------|-------------|
| `kiro.focus` | Focus first kiro-cli tab | Yes |
| `kiro.cycle` | Cycle through kiro tabs | Yes |
| `kiro.alert` | Find idle/waiting tab | Yes |
| `kiro.launch` | Launch new kiro session | Yes |
| `kiro.yes` | Send 'y' keystroke | Yes |
| `kiro.no` | Send 'n' keystroke | Yes |
| `kiro.trust` | Send 't' keystroke | Yes |
| `kiro.agent` | Open agent picker | Yes |

## Mode Switching

### Standalone Mode

- Takes exclusive control of Stream Deck via USB
- Renders buttons dynamically with canvas
- Updates Neo info bar with live data
- Runs as menubar app

### BTT Mode

- Generates BTT triggers from config
- Exports to `~/.config/kiro-deck/btt-triggers.json`
- Can auto-import via BTT API
- No info bar support

### Elgato Mode

- Generates/updates .sdPlugin profile
- Copies to Stream Deck plugins directory
- Uses static icons (no dynamic rendering)
- No info bar support (SDK limitation)

## Migration from Current State

### Problems Being Fixed

1. **Hardcoded paths** in `src/kiro-utils.ts`:
   ```typescript
   // BEFORE (bad)
   export const SCRIPTS_DIR = "/Users/sauhsoj/src/personal/...";
   
   // AFTER (good)
   export const SCRIPTS_DIR = getScriptsDir();  // Resolves dynamically
   ```

2. **Neo SDK patch** in `scripts/patch-sdk.mjs`:
   - Removed entirely
   - Info bar only available in standalone mode
   - Plugin uses standard SDK without modifications

3. **Duplicate AppleScript** across implementations:
   - Consolidated into `src/actions/`
   - Shared by all modes

4. **Scattered config**:
   - kiro-deck: `~/.config/kiro-deck/config.json`
   - sdPlugin: Property Inspector HTML
   - BTT: Python dict in source
   - Now: Single unified config

## Icon Resolution

Icons are resolved in order:

1. `~/.config/kiro-deck/icons/{name}.png` (user override)
2. `{app}/icons/{name}.png` (bundled with app)
3. `wtf.sauhsoj.kiro-icons.sdIconPack/icons/{name}.png` (icon pack)

## Build & Export Commands

```bash
# Standalone mode (default)
cd kiro-deck && bun run src/main.ts

# Export to BTT
bun run src/exporters/btt.ts

# Export to Elgato
bun run src/exporters/elgato.ts

# Switch mode via CLI
kiro-deck --mode btt --export
kiro-deck --mode elgato --export
```

## Future Considerations

- Multi-profile support (different layouts for different contexts)
- Action chaining (macros)
- Plugin system for custom actions
- Cross-platform support (Windows/Linux)
