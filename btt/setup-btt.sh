#!/bin/bash
# Setup BTT Stream Deck triggers for Kiro CLI

set -e

echo "Adding Kiro Stream Deck buttons to BetterTouchTool..."

# Launch Kiro
osascript <<'EOF'
tell application "BetterTouchTool"
  set triggerJSON to "{
    \"BTTStreamDeckButtonName\": \"Launch Kiro\",
    \"BTTTriggerType\": 719,
    \"BTTTriggerClass\": \"BTTTriggerTypeStreamDeck\",
    \"BTTPredefinedActionType\": 195,
    \"BTTInlineAppleScript\": \"tell application \\\"iTerm\\\"\\n  activate\\n  if (count of windows) = 0 then\\n    create window with default profile\\n  end if\\n  tell current window\\n    create tab with default profile\\n    tell current session\\n      write text \\\"kiro-cli chat\\\"\\n    end tell\\n  end tell\\nend tell\",
    \"BTTEnabled\": 1,
    \"BTTEnabled2\": 1,
    \"BTTUUID\": \"KIRO-LAUNCH-001\",
    \"BTTOrder\": 0,
    \"BTTTriggerConfig\": {
      \"BTTStreamDeckBackgroundColor\": \"40, 80, 160, 255\",
      \"BTTStreamDeckCornerRadius\": 12,
      \"BTTStreamDeckImageHeight\": 30,
      \"BTTStreamDeckIconType\": 2,
      \"BTTStreamDeckSFSymbolName\": \"terminal\",
      \"BTTStreamDeckIconColor1\": \"255, 255, 255, 255\",
      \"BTTStreamDeckTextOffsetY\": 15,
      \"BTTStreamDeckButtonTitle\": \"Launch\"
    }
  }"
  return add_new_trigger triggerJSON
end tell
EOF

# Focus Kiro
osascript <<'EOF'
tell application "BetterTouchTool"
  set triggerJSON to "{
    \"BTTStreamDeckButtonName\": \"Focus Kiro\",
    \"BTTTriggerType\": 719,
    \"BTTTriggerClass\": \"BTTTriggerTypeStreamDeck\",
    \"BTTPredefinedActionType\": 195,
    \"BTTInlineAppleScript\": \"tell application \\\"iTerm\\\"\\n  activate\\n  tell current window\\n    set tabCount to count of tabs\\n    repeat with i from 1 to tabCount\\n      set theSession to current session of tab i\\n      set tabName to name of theSession\\n      if tabName contains \\\"kiro-cli\\\" then\\n        select tab i\\n        return \\\"found\\\"\\n      end if\\n    end repeat\\n  end tell\\nend tell\",
    \"BTTEnabled\": 1,
    \"BTTEnabled2\": 1,
    \"BTTUUID\": \"KIRO-FOCUS-002\",
    \"BTTOrder\": 1,
    \"BTTTriggerConfig\": {
      \"BTTStreamDeckBackgroundColor\": \"60, 120, 180, 255\",
      \"BTTStreamDeckCornerRadius\": 12,
      \"BTTStreamDeckImageHeight\": 30,
      \"BTTStreamDeckIconType\": 2,
      \"BTTStreamDeckSFSymbolName\": \"eye\",
      \"BTTStreamDeckIconColor1\": \"255, 255, 255, 255\",
      \"BTTStreamDeckTextOffsetY\": 15,
      \"BTTStreamDeckButtonTitle\": \"Focus\"
    }
  }"
  return add_new_trigger triggerJSON
end tell
EOF

# Yes button
osascript <<'EOF'
tell application "BetterTouchTool"
  set triggerJSON to "{
    \"BTTStreamDeckButtonName\": \"Send Yes\",
    \"BTTTriggerType\": 719,
    \"BTTTriggerClass\": \"BTTTriggerTypeStreamDeck\",
    \"BTTPredefinedActionType\": 195,
    \"BTTInlineAppleScript\": \"tell application \\\"iTerm\\\" to activate\\ndelay 0.1\\ntell application \\\"System Events\\\" to keystroke \\\"y\\\"\",
    \"BTTEnabled\": 1,
    \"BTTEnabled2\": 1,
    \"BTTUUID\": \"KIRO-YES-003\",
    \"BTTOrder\": 2,
    \"BTTTriggerConfig\": {
      \"BTTStreamDeckBackgroundColor\": \"34, 139, 34, 255\",
      \"BTTStreamDeckCornerRadius\": 12,
      \"BTTStreamDeckImageHeight\": 30,
      \"BTTStreamDeckIconType\": 2,
      \"BTTStreamDeckSFSymbolName\": \"checkmark.circle\",
      \"BTTStreamDeckIconColor1\": \"255, 255, 255, 255\",
      \"BTTStreamDeckTextOffsetY\": 15,
      \"BTTStreamDeckButtonTitle\": \"Yes\"
    }
  }"
  return add_new_trigger triggerJSON
end tell
EOF

# No button
osascript <<'EOF'
tell application "BetterTouchTool"
  set triggerJSON to "{
    \"BTTStreamDeckButtonName\": \"Send No\",
    \"BTTTriggerType\": 719,
    \"BTTTriggerClass\": \"BTTTriggerTypeStreamDeck\",
    \"BTTPredefinedActionType\": 195,
    \"BTTInlineAppleScript\": \"tell application \\\"iTerm\\\" to activate\\ndelay 0.1\\ntell application \\\"System Events\\\" to keystroke \\\"n\\\"\",
    \"BTTEnabled\": 1,
    \"BTTEnabled2\": 1,
    \"BTTUUID\": \"KIRO-NO-004\",
    \"BTTOrder\": 3,
    \"BTTTriggerConfig\": {
      \"BTTStreamDeckBackgroundColor\": \"178, 34, 34, 255\",
      \"BTTStreamDeckCornerRadius\": 12,
      \"BTTStreamDeckImageHeight\": 30,
      \"BTTStreamDeckIconType\": 2,
      \"BTTStreamDeckSFSymbolName\": \"xmark.circle\",
      \"BTTStreamDeckIconColor1\": \"255, 255, 255, 255\",
      \"BTTStreamDeckTextOffsetY\": 15,
      \"BTTStreamDeckButtonTitle\": \"No\"
    }
  }"
  return add_new_trigger triggerJSON
end tell
EOF

# Cycle button
osascript <<'EOF'
tell application "BetterTouchTool"
  set triggerJSON to "{
    \"BTTStreamDeckButtonName\": \"Cycle Tabs\",
    \"BTTTriggerType\": 719,
    \"BTTTriggerClass\": \"BTTTriggerTypeStreamDeck\",
    \"BTTPredefinedActionType\": 195,
    \"BTTInlineAppleScript\": \"tell application \\\"iTerm\\\"\\n  activate\\n  tell current window\\n    set tabCount to count of tabs\\n    set currentIdx to 0\\n    repeat with i from 1 to tabCount\\n      if tab i is selected then\\n        set currentIdx to i\\n        exit repeat\\n      end if\\n    end repeat\\n    set foundNext to false\\n    repeat with i from (currentIdx + 1) to tabCount\\n      set theSession to current session of tab i\\n      if name of theSession contains \\\"kiro-cli\\\" then\\n        select tab i\\n        set foundNext to true\\n        exit repeat\\n      end if\\n    end repeat\\n    if not foundNext then\\n      repeat with i from 1 to (currentIdx - 1)\\n        set theSession to current session of tab i\\n        if name of theSession contains \\\"kiro-cli\\\" then\\n          select tab i\\n          exit repeat\\n        end if\\n      end repeat\\n    end if\\n  end tell\\nend tell\",
    \"BTTEnabled\": 1,
    \"BTTEnabled2\": 1,
    \"BTTUUID\": \"KIRO-CYCLE-005\",
    \"BTTOrder\": 4,
    \"BTTTriggerConfig\": {
      \"BTTStreamDeckBackgroundColor\": \"128, 0, 128, 255\",
      \"BTTStreamDeckCornerRadius\": 12,
      \"BTTStreamDeckImageHeight\": 30,
      \"BTTStreamDeckIconType\": 2,
      \"BTTStreamDeckSFSymbolName\": \"arrow.triangle.2.circlepath\",
      \"BTTStreamDeckIconColor1\": \"255, 255, 255, 255\",
      \"BTTStreamDeckTextOffsetY\": 15,
      \"BTTStreamDeckButtonTitle\": \"Cycle\"
    }
  }"
  return add_new_trigger triggerJSON
end tell
EOF

# Think button
osascript <<'EOF'
tell application "BetterTouchTool"
  set triggerJSON to "{
    \"BTTStreamDeckButtonName\": \"Send Thinking\",
    \"BTTTriggerType\": 719,
    \"BTTTriggerClass\": \"BTTTriggerTypeStreamDeck\",
    \"BTTPredefinedActionType\": 195,
    \"BTTInlineAppleScript\": \"tell application \\\"iTerm\\\" to activate\\ndelay 0.1\\ntell application \\\"System Events\\\" to keystroke \\\"think about this\\\"\\ndelay 0.05\\ntell application \\\"System Events\\\" to key code 36\",
    \"BTTEnabled\": 1,
    \"BTTEnabled2\": 1,
    \"BTTUUID\": \"KIRO-THINK-006\",
    \"BTTOrder\": 5,
    \"BTTTriggerConfig\": {
      \"BTTStreamDeckBackgroundColor\": \"255, 165, 0, 255\",
      \"BTTStreamDeckCornerRadius\": 12,
      \"BTTStreamDeckImageHeight\": 30,
      \"BTTStreamDeckIconType\": 2,
      \"BTTStreamDeckSFSymbolName\": \"brain\",
      \"BTTStreamDeckIconColor1\": \"255, 255, 255, 255\",
      \"BTTStreamDeckTextOffsetY\": 15,
      \"BTTStreamDeckButtonTitle\": \"Think\"
    }
  }"
  return add_new_trigger triggerJSON
end tell
EOF

# Calendar widget (Shell Script Widget calling AppleScript)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
osascript <<EOF
tell application "BetterTouchTool"
  set triggerJSON to "{
    \"BTTStreamDeckButtonName\": \"Calendar\",
    \"BTTTriggerType\": 730,
    \"BTTTriggerClass\": \"BTTTriggerTypeStreamDeck\",
    \"BTTPredefinedActionType\": -1,
    \"BTTEnabled\": 1,
    \"BTTEnabled2\": 1,
    \"BTTUUID\": \"KIRO-CAL-008\",
    \"BTTOrder\": 6,
    \"BTTTriggerConfig\": {
      \"BTTStreamDeckBackgroundColor\": \"30, 30, 30, 255\",
      \"BTTStreamDeckCornerRadius\": 0,
      \"BTTScriptUpdateInterval\": 30,
      \"BTTScriptAlwaysRunOnInit\": 1,
      \"BTTStreamDeckMainTab\": 3,
      \"BTTScriptSettings\": {
        \"BTTShellScriptString\": \"osascript $SCRIPT_DIR/calendar-widget.applescript\",
        \"BTTShellScriptConfig\": \"/bin/bash:::-c:::-:::\"
      }
    }
  }"
  return add_new_trigger triggerJSON
end tell
EOF

echo "Done! Check your Stream Deck Neo."
echo ""
echo "If buttons don't appear:"
echo "1. Open BTT preferences → Stream Deck"
echo "2. Ensure 'Fully Controlled by BTT' is enabled"
echo "3. Try restarting BTT"
