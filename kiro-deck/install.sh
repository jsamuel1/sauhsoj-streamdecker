#!/bin/bash
# install.sh - Install Kiro Deck as a login item

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUN_PATH="$(command -v bun)"
PLIST_NAME="wtf.sauhsoj.kiro-deck"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_NAME}.plist"

if [[ -z "$BUN_PATH" ]]; then
    echo "Error: bun not found in PATH"
    exit 1
fi

echo "Installing Kiro Deck..."
echo "  App: $SCRIPT_DIR"
echo "  Bun: $BUN_PATH"

# Install dependencies
cd "$SCRIPT_DIR"
bun install

# Create LaunchAgent plist
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_NAME}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${BUN_PATH}</string>
        <string>run</string>
        <string>${SCRIPT_DIR}/src/main.ts</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/kiro-deck.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/kiro-deck.log</string>
    <key>WorkingDirectory</key>
    <string>${SCRIPT_DIR}</string>
</dict>
</plist>
EOF

# Load the agent
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

echo "✅ Kiro Deck installed and running"
echo "   Logs: /tmp/kiro-deck.log"
echo "   To uninstall: ./uninstall.sh"
