---
name: tech-stack
description: Technology choices, design system, and project structure for Kiro Deck. Includes Bun runtime, Stream Deck library, Nova Canvas API details, Kiro color palette, and icon generation workflow. Read when making implementation decisions or understanding architecture.
---

# Kiro Deck - Tech Stack & Design

## Runtime & Core

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Runtime** | Bun | Fast startup, native TypeScript, good macOS integration |
| **Stream Deck** | @elgato-stream-deck/node | Proven library, full Neo LCD support |
| **GUI Framework** | Tauri v2 | Native macOS menubar, lightweight, Rust backend |
| **Image Rendering** | Canvas (node-canvas or @napi-rs/canvas) | Text rendering for info bar |

## macOS Integration

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **AppleScript** | osascript via Bun shell | Simple, reliable for app control |
| **Accessibility** | @aspect-build/macos-accessibility (or native) | Keyboard simulation |
| **App Detection** | NSWorkspace via native bindings | Frontmost app monitoring |
| **Calendar** | EventKit via native bindings or icalBuddy | Calendar integration |

## Image Generation

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **AI Model** | Amazon Nova Canvas (amazon.nova-canvas-v1:0) | High quality, supports inpainting/variations |
| **AWS SDK** | @aws-sdk/client-bedrock-runtime | Official SDK |
| **Image Processing** | Sharp | Resize, color extraction, format conversion |

### Nova Canvas Capabilities

Model: `amazon.nova-canvas-v1:0`

**Task Types:**
- `TEXT_IMAGE` - Generate base icons from text prompts
- `INPAINTING` - Modify masked regions (add action indicators, badges)
- `OUTPAINTING` - Replace background while preserving subject
- `BACKGROUND_REMOVAL` - Extract subject with transparent background
- `COLOR_GUIDED_GENERATION` - Generate with specific color palette

**Key Parameters:**
- `seed` (0-858,993,459) - Deterministic generation for reproducibility
- `negativePrompt` - Exclude unwanted elements ("text", "watermark")
- `maskPrompt` - Natural language region selection ("the icon", "background")
- `colorHexList` - Array of hex colors to incorporate (1-10 colors)
- `controlStrength` (0-1.0) - How closely to follow reference/colors

**Icon Generation Workflow:**
1. Generate base icon: `TEXT_IMAGE` with prompt + `colorHexList` for app theme
2. Create pressed state: `INPAINTING` with `maskPrompt: "background"` to brighten
3. Create disabled state: `COLOR_GUIDED_GENERATION` with desaturated colors
4. For app-themed icons: Extract colors from app icon, use as `colorHexList`

**Reference:** [Serverless Advocate Blog](https://blog.serverlessadvocate.com/amazon-bedrock-ai-image-manipulation-with-amazon-nova-800511922208)

## Web Emulator

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend** | Vanilla HTML/CSS/JS | Minimal dependencies, fast load |
| **Communication** | WebSocket | Bidirectional, real-time |
| **Styling** | CSS matching Kiro theme | Consistent look |

## Configuration & Storage

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Config Format** | JSON with JSON Schema | Human-readable, validatable |
| **Location** | ~/.config/kiro-deck/ | XDG-compliant |
| **Schema Validation** | Zod | Runtime validation, TypeScript types |

## Auto-Update

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Update Check** | GitHub Releases API | Simple, free hosting |
| **Download** | fetch + fs | Built into Bun |
| **Installation** | Self-replace + restart | Simple for single binary |

---

## Design System

### Color Palette (Kiro Theme)

```
Primary Purple:    #9046ff
Light Purple:      #c6a0ff
Dark Background:   #18181b
Deeper Dark:       #211d25
White:             #ffffff
Gray Text:         #938f9b
Accent Green:      #80ffb5
Accent Blue:       #8dc8fb
Accent Pink:       #ffafd1
Accent Red:        #ff8080
```

### Typography

- **Primary Font**: SF Pro (system) or Inter
- **Monospace**: SF Mono or JetBrains Mono
- **Info Bar**: 16-18px for readability at small size

### Icon Style

- **Background**: Dark (#18181b or app-themed)
- **Character**: Friendly, slightly whimsical mascot/icon
- **Style**: Flat with subtle gradients, rounded corners
- **Action States**: 
  - Default: Full color
  - Pressed: Slightly brighter, subtle glow
  - Disabled: Desaturated, reduced opacity

### Info Bar Design

- **Background**: Dark (#18181b)
- **Accent Bar**: 4px left edge in status color
- **Icon**: 22px emoji or custom icon
- **Text**: 16px white, truncated with ellipsis
- **Status Colors**:
  - Purple (#9046ff): Idle/Ready
  - Blue (#8dc8fb): Upcoming event
  - Red (#ff8080): In meeting/urgent
  - Green (#80ffb5): Task/action available

### Menubar

- **Icon**: Kiro logo or Stream Deck icon
- **Style**: Native macOS appearance
- **Windows**: Native macOS windows with Kiro accent colors

---

## Project Structure

```
kiro-deck/
├── src/
│   ├── main.ts              # Entry point
│   ├── deck/
│   │   ├── connection.ts    # Stream Deck HID
│   │   ├── buttons.ts       # Button management
│   │   ├── infobar.ts       # Info bar rendering
│   │   └── emulator.ts      # WebSocket emulator server
│   ├── context/
│   │   ├── detector.ts      # App/terminal detection
│   │   ├── kiro.ts          # Kiro CLI specific
│   │   └── rules.ts         # Page switching rules
│   ├── pages/
│   │   ├── manager.ts       # Page lifecycle
│   │   ├── kiro.ts          # Kiro button page
│   │   └── presentation.ts  # Presentation page
│   ├── infobar/
│   │   ├── sources/         # Data source plugins
│   │   │   ├── kiro.ts
│   │   │   ├── calendar.ts
│   │   │   └── tasks.ts
│   │   └── renderer.ts      # Info bar compositor
│   ├── icons/
│   │   ├── generator.ts     # Nova Canvas integration
│   │   ├── themer.ts        # App color extraction
│   │   └── cache.ts         # Icon caching
│   ├── config/
│   │   ├── schema.ts        # Zod schemas
│   │   ├── loader.ts        # Config file handling
│   │   └── defaults.ts      # Default configuration
│   ├── gui/
│   │   ├── menubar.ts       # Menubar setup
│   │   ├── configure.ts     # Configure window
│   │   └── about.ts         # About window
│   └── updater/
│       └── index.ts         # Auto-update logic
├── emulator/
│   ├── index.html           # Emulator UI
│   ├── style.css
│   └── script.js
├── config/
│   └── default.json         # Default configuration
├── icons/
│   └── kiro/                # Kiro icon pack
├── docs/
│   └── project/             # Project documentation
├── package.json
├── tsconfig.json
└── bunfig.toml
```

---

## Dependencies

### Production

```json
{
  "@elgato-stream-deck/node": "^7.x",
  "@aws-sdk/client-bedrock-runtime": "^3.x",
  "sharp": "^0.33.x",
  "zod": "^3.x",
  "ws": "^8.x"
}
```

### Development

```json
{
  "typescript": "^5.x",
  "@types/node": "^20.x",
  "@types/ws": "^8.x"
}
```

### Optional (for native GUI)

```json
{
  "@aspect-build/macos-accessibility": "^x.x"
}
```

---

## Build & Distribution

### Development
```bash
bun run dev          # Run with hot reload
bun run emulator     # Start emulator server
bun test             # Run tests with emulator
```

### Production
```bash
bun run build        # Compile to single executable
bun run package      # Create .app bundle
```

### Distribution
- GitHub Releases for updates
- DMG installer for initial install
- Homebrew cask (future)
