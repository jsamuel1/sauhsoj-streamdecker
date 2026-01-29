# BetterTouchTool Stream Deck Trigger Structure

## Critical: Fixed Row/Col is a NESTED OBJECT with STRING values

**WRONG (causes crash):**
```json
"BTTStreamDeckFixedRow": 0,
"BTTStreamDeckFixedCol": 0
```

**CORRECT:**
```json
"BTTStreamDeckFixedRow": {
  "BTTStreamDeckFixedCol": "0",
  "BTTStreamDeckFixedRow": "0"
},
"BTTStreamDeckUseFixedRowCol": 1
```

## Working Type 719 Button Structure (from manual creation)

```json
{
  "BTTTriggerType": 719,
  "BTTTriggerClass": "BTTTriggerTypeStreamDeck",
  "BTTUUID": "unique-id",
  "BTTOrder": 0,
  "BTTActionsToExecute": [
    {
      "BTTIsPureAction": true,
      "BTTPredefinedActionType": 195,
      "BTTPredefinedActionName": "Run Apple Script (async in background)",
      "BTTAdditionalActionData": {
        "BTTAppleScriptRunInBackground": true,
        "BTTAIScriptType": 3,
        "BTTScriptType": 2,
        "BTTAppleScriptUsePath": true,
        "BTTAppleScriptPath": "/path/to/script.applescript"
      }
    }
  ],
  "BTTTriggerConfig": {
    "BTTStreamDeckImageHeight": 144,
    "BTTStreamDeckCornerRadius": 12,
    "BTTStreamDeckBackgroundColor": "0.000000, 0.000000, 0.000000, 255.000000",
    "BTTStreamDeckResizeImage": 2,
    "BTTStreamDeckImage": "base64-encoded-tiff-image",
    "BTTStreamDeckIconColor1": "255, 255, 255, 255",
    "BTTStreamDeckMainTab": 1,
    "BTTStreamDeckFixedRow": {
      "BTTStreamDeckFixedCol": "0",
      "BTTStreamDeckFixedRow": "0"
    },
    "BTTStreamDeckUseFixedRowCol": 1,
    "ShowHud": 1,
    "BTTShowHUD": 1,
    "BTTHUDText": "HUD Title",
    "BTTHUDDetailText": "HUD Detail {title}",
    "BTTHUDSFSymbol": "symbol-name"
  }
}
```

## Script Types (BTTScriptType in BTTAdditionalActionData)

- 0 = AppleScript inline
- 1 = JavaScript (JAX)
- 2 = AppleScript from file path

## BTTAIScriptType

- 3 = AppleScript

## Trigger Types

- Type 719 = Stream Deck Button (for actions)
- Type 725 = AppleScript Widget (for dynamic content)
- Type 790 = Stream Deck Neo LCD Item

## BTTStreamDeckMainTab values

- 1 = Image tab (for buttons with images)
- 3 = Script tab (for AppleScript widgets)

## Image format

- BTTStreamDeckImage: base64-encoded TIFF
- BTTStreamDeckImageHeight/Width: 144 for Stream Deck Neo
- BTTStreamDeckResizeImage: 2 (fill/zoom)

## HUD (Heads Up Display) options

- ShowHud: 1, BTTShowHUD: 1
- BTTHUDText: main text
- BTTHUDDetailText: detail text (supports {title} variable)
- BTTHUDSFSymbol: SF Symbol name for HUD icon
