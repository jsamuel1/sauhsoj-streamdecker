# Neo Info Bar Research

Investigation into how Elgato's Stream Deck Neo info bar works and whether third-party plugins can control it.

## Summary

**Conclusion: Neo info bar is native-only. Third-party plugins cannot control it.**

The Neo info bar is controlled exclusively by native C++ Key Adaptors (`KA_DigitalTime`, `KA_Pagination`) that use internal layout services. There is no SDK path for third-party plugins to render to the info bar.

## Architecture Overview

### Viewmodel Hierarchy

```
esd::viewmodels::Controller (base)
├── esd::viewmodels::Device
├── esd::viewmodels::Keypad      # Regular buttons (third-party supported)
├── esd::viewmodels::Encoder     # Stream Deck+ dials (third-party supported)
└── esd::viewmodels::Neo         # Neo info bar (native only)
```

### Key Adaptor Classes

| Class | Purpose | Third-Party? |
|-------|---------|--------------|
| `KA_Custom` | Handles all third-party plugin commands | Yes |
| `KA_DigitalTime` | Native Digital Time display | No |
| `KA_Pagination` | Native Page Indicator display | No |

### Valid Controller Types

Only two controller types are valid for third-party plugins:
- `"Keypad"` - regular buttons
- `"Encoder"` - Stream Deck+ dials

`"Neo"` is NOT a valid third-party controller type (confirmed via binary string analysis).

## KA_Custom (Third-Party Path)

`KA_Custom` handles all SDK commands from plugins:

```cpp
void KA_Custom::HandleCommandFromPlugin(const nlohmann::json &)
void KA_Custom::sdkEventSetFeedbackLayoutProcessor(const SDKCommand &)  // Encoder only
void KA_Custom::sdkEventSetImageProcessor(const SDKCommand &)
void KA_Custom::sdkEventSetTitleProcessor(const SDKCommand &)
void KA_Custom::sdkEventSetResourcesProcessor(const SDKCommand &)
```

**Critical:** `sdkEventSetFeedbackLayoutProcessor` only works for Encoder (Stream Deck+), not Neo.

## KA_DigitalTime (Native Path)

Native Key Adaptor for Digital Time:

```cpp
bool KA_DigitalTime::init()
void KA_DigitalTime::fixup()
void KA_DigitalTime::refreshLayout()
```

- Uses `esd::layouts::DateTimeService` for time data
- Uses `esd::layouts::Runner` for rendering
- Has NO JavaScript code - purely native C++

## Layout Services

```
esd::layouts::DateTimeService  # Provides time/date data
esd::layouts::PageService      # Provides page indicator data
esd::layouts::Runner           # Renders layouts to device
esd::layouts::Service          # Base service class
```

### Layout Element Types

```
esd::layouts::elements::hours
esd::layouts::elements::minutes
esd::layouts::elements::colon
esd::layouts::elements::am_pm
esd::layouts::elements::date
esd::layouts::elements::year
esd::layouts::elements::month
esd::layouts::elements::day
esd::layouts::elements::timezone
```

## InfobarLayouts Structure

Location: `/Applications/Elgato Stream Deck.app/Contents/Resources/InfobarLayouts/`

### Layout Variants

13 different layout variants exist in `InfobarLayouts/DigitalTime/`:
- `digital_time_01.sdLayoutEx` through `digital_time_21.sdLayoutEx`
- Each bundle contains: `manifest.json`, `fonts/`, `images/`
- Custom TTF fonts embedded per layout (Orbitron, Roboto, VT323, etc.)

### Layout Manifest Structure

```json
{
  "themes": [{
    "id": "red",
    "primaryColor": "#FF3C4E",
    "colors": { /* theme-specific colors */ },
    "fonts": { /* theme-specific fonts */ },
    "images": { /* theme-specific images */ }
  }],
  "elements": [
    { "key": "hour1", "type": "hours", "show_zero": true },
    { "key": "colon1", "type": "colon", "animated": false },
    { "key": "min1", "type": "minutes", "show_zero": true },
    { "key": "am_pm", "type": "am/pm", "capitalize": true }
  ],
  "template": {
    "items": [
      { "key": "hour1", "type": "text", "rect": [11, 0, 75, 50], ... },
      { "key": "min1", "type": "text", "rect": [98, 0, 75, 50], ... }
    ]
  }
}
```

### Rendering Pipeline (Native Only)

1. Plugin registration via manifest
2. Layout discovery from `InfobarLayouts/`
3. Theme selection by user
4. Template processing: `{{variable}}` replacement with theme values
5. Live data binding (time/date) via `esd::layouts::DateTimeService`
6. zOrder-based layered rendering to Neo display

### Key Features

- Template system with `{{variable}}` syntax
- Font embedding per layout
- Multi-theme support per layout
- Real-time data updates
- Declarative visual structure with styling separation

**Info bar dimensions: 232x50 pixels**

## Built-in Plugin Manifests

Both Digital Time and Pagination plugins:

```json
{
  "Controllers": ["Neo"],
  "PrivateAPI": true,
  "CodePath": null  // NO JavaScript - native only
}
```

## Evidence Neo is Native-Only

1. **No CodePath**: Digital Time plugin has no JavaScript code
2. **Controller validation**: Error message "invalid controller type defined" suggests Neo isn't valid for third-party
3. **Binary strings**: Only "Keypad" and "Encoder" exist as controller type strings
4. **Separate viewmodel**: `esd::viewmodels::Neo` is distinct from Encoder
5. **CFeedbackComposer**: Used by Encoder viewmodel, not Neo
6. **System plugin prefix**: `com.elgato.streamdeck.system.*` has special privileges

## Commands Tested (All Failed)

| Command | Result |
|---------|--------|
| `setTitle` | Sent successfully, no display update |
| `setImage` (SVG) | Sent successfully, no display update |
| `setFeedback` | Sent successfully, no display update |
| `setFeedbackLayout` | Sent successfully, no display update |

## PrivateAPI Investigation

The `PrivateAPI` manifest flag exists but only enables specific features:
- Error message found: `"private api not allowed: ShouldShowRefreshButton"`
- This suggests PrivateAPI enables UI features, not Neo control

No evidence of any PrivateAPI commands for Neo info bar control.

## Recommendation

Remove the `infobar-calendar` action from the plugin. The Neo info bar cannot be controlled by third-party plugins.

Alternative approaches:
1. Display calendar info on a regular Keypad button instead
2. Wait for Elgato to potentially expose Neo API in future SDK versions
3. Request feature from Elgato via their developer forums
