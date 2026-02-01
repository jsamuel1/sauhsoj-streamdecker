#!/bin/bash
# uninstall.sh - Remove Kiro Deck login item

PLIST_NAME="wtf.sauhsoj.kiro-deck"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_NAME}.plist"

echo "Uninstalling Kiro Deck..."

launchctl unload "$PLIST_PATH" 2>/dev/null || true
rm -f "$PLIST_PATH"

echo "✅ Kiro Deck uninstalled"
