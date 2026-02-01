# Refactor Plan: Unified Config & Mode Switching

## Summary

This document tracks the refactoring of streamdecker from three separate implementations to a unified architecture with mode switching.

## Current State (Problems)

### 1. Three Implementations, Same Actions

| Implementation | Location | Language | Actions |
|----------------|----------|----------|---------|
| streamdecker | `streamdecker/` | TypeScript/Bun | 8 |
| sdPlugin | `wtf.sauhsoj.streamdecker.sdPlugin/` | TypeScript/Node | 11 |
| BTT | `create-btt-buttons.py` | Python | 8 |

### 2. Hardcoded Paths

```typescript
// src/kiro-utils.ts - BROKEN for other users
export const SCRIPTS_DIR = "/Users/sauhsoj/src/personal/sauhsoj-streamdecker/...";
```

### 3. Neo SDK Patch (Fragile)

`scripts/patch-sdk.mjs` modifies `node_modules/@elgato/streamdeck` at install time:
- Breaks on SDK updates
- Requires `PrivateAPI: true` in manifest
- Can't be distributed via Elgato Marketplace

### 4. Duplicate AppleScript

Same terminal automation exists in:
- `streamdecker/src/actions/kiro.ts` (embedded strings)
- `sdPlugin/scripts/*.applescript` (files)
- `create-btt-buttons.py` (references scripts)

### 5. Inconsistent Config

- streamdecker: Zod schema in `~/.config/streamdecker/config.json`
- sdPlugin: HTML Property Inspectors
- BTT: Python dict in source code

## Target State

### Single Config File

`~/.config/streamdecker/config.json` controls everything:

```json
{
  "mode": "standalone",
  "device": { "type": "neo" },
  "buttons": [
    { "position": 0, "action": "kiro.focus", "icon": "kiro-focus" },
    { "position": 1, "action": "kiro.cycle", "icon": "kiro-cycle" }
  ],
  "terminal": { "app": "auto" },
  "agents": { "favorites": ["default", "jupyter", "git"] }
}
```

### Mode Switching

```bash
# Edit config to change mode
streamdecker config set mode btt

# Or via CLI flag
streamdecker --mode elgato --export
```

### Shared Action Library

```
src/actions/
├── index.ts      # Action registry
├── kiro.ts       # All kiro-cli actions
├── terminal.ts   # Terminal abstraction
└── applescript.ts
```

## Tasks

### Phase 1: Foundation

- [x] Create docs/ARCHITECTURE.md
- [x] Create docs/REFACTOR-PLAN.md
- [x] Create unified config schema (`src/config/schema.ts`)
- [x] Create portable path resolver (`src/config/paths.ts`)

### Phase 2: Shared Actions

- [x] Refactor `src/actions/` to be mode-agnostic
- [x] Create terminal abstraction layer (`src/actions/terminal.ts`)
- [x] Create shared kiro actions (`src/actions/kiro.ts`)

### Phase 3: Exporters

- [x] Create BTT exporter (`src/exporters/btt.ts`)
- [x] Create Elgato exporter (`src/exporters/elgato.ts`)

### Phase 4: Cleanup

- [x] Remove `scripts/patch-sdk.mjs`
- [x] Remove Neo info bar from sdPlugin (standalone-only)
- [x] Update sdPlugin to use shared config and portable paths
- [x] Fix icon inconsistencies

### Phase 5: Config UI

- [x] Add Settings panel to web emulator
- [x] Add `/api/config` GET/PUT endpoints
- [x] WebSocket broadcast of config changes

## Breaking Changes

### For sdPlugin Users

- Neo info bar no longer available (use standalone mode)
- Config now in `~/.config/streamdecker/config.json` instead of Property Inspector

### For BTT Users

- `create-btt-buttons.py` deprecated
- Use `streamdecker --mode btt --export` instead

## Migration Guide

### From sdPlugin to Standalone

1. Install streamdecker.app
2. Quit Stream Deck software
3. Run streamdecker (takes over USB)

### From sdPlugin to Elgato Mode

1. Edit `~/.config/streamdecker/config.json`:
   ```json
   { "mode": "elgato" }
   ```
2. Run `streamdecker --export`
3. Restart Stream Deck software

### From BTT Script to BTT Mode

1. Edit `~/.config/streamdecker/config.json`:
   ```json
   { "mode": "btt" }
   ```
2. Run `streamdecker --export`
3. Import generated triggers in BTT

## Timeline

- Phase 1: Foundation (current)
- Phase 2: Shared Actions
- Phase 3: Exporters
- Phase 4: Cleanup & Testing

## References

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Target architecture
- [neo-infobar-research.md](./neo-infobar-research.md) - Why Neo info bar requires standalone
