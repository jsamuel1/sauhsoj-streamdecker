#!/bin/bash
# build-app.sh - Build Kiro Deck.app bundle

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="Streamdecker"
BUNDLE_ID="wtf.sauhsoj.kiro-deck"
APP_DIR="$SCRIPT_DIR/dist/${APP_NAME}.app"
CONTENTS="$APP_DIR/Contents"
MACOS="$CONTENTS/MacOS"
RESOURCES="$CONTENTS/Resources"
BUN_PATH="$(command -v bun)"

echo "Building ${APP_NAME}.app..."

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "Version: $VERSION"

# Clean previous build
rm -rf "$APP_DIR"

# Create directory structure
mkdir -p "$MACOS" "$RESOURCES"

# Copy bun binary into the app (so permissions are tied to this app)
cp "$BUN_PATH" "$MACOS/bun"

# Copy the entire app source
cp -r src "$RESOURCES/"
cp -r shared "$RESOURCES/"
cp -r emulator "$RESOURCES/"
cp -r fonts "$RESOURCES/"
cp -r scripts "$RESOURCES/"
cp -r node_modules "$RESOURCES/"
cp package.json "$RESOURCES/"
cp tsconfig.json "$RESOURCES/"
cp -r ../shared/icons "$RESOURCES/"

# Build and copy Elgato plugin (for elgato mode installation)
echo "Building Elgato plugin..."
(cd .. && npm run build)
cp -r ../wtf.sauhsoj.streamdecker.sdPlugin "$RESOURCES/"

# Create .streamDeckPlugin installer package (must contain the .sdPlugin folder)
PLUGIN_PKG="$RESOURCES/wtf.sauhsoj.streamdecker.streamDeckPlugin"
(cd .. && zip -r "$PLUGIN_PKG" wtf.sauhsoj.streamdecker.sdPlugin -x "*.DS_Store")
echo "Created plugin installer: $PLUGIN_PKG"

# Fix systray2 binary name (it looks for tray_darwin, not tray_darwin_release)
TRAY_BIN="$RESOURCES/node_modules/systray2/traybin"
if [[ -f "$TRAY_BIN/tray_darwin_release" && ! -f "$TRAY_BIN/tray_darwin" ]]; then
    cp "$TRAY_BIN/tray_darwin_release" "$TRAY_BIN/tray_darwin"
    chmod +x "$TRAY_BIN/tray_darwin"
fi

# Create launcher that uses embedded bun
cat > "$MACOS/kiro-deck" << 'LAUNCHER'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RESOURCES="$SCRIPT_DIR/../Resources"
cd "$RESOURCES"
exec "$SCRIPT_DIR/bun" run src/main.ts
LAUNCHER
chmod +x "$MACOS/kiro-deck"

# Create Info.plist
cat > "$CONTENTS/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleDisplayName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>${BUNDLE_ID}</string>
    <key>CFBundleVersion</key>
    <string>${VERSION}</string>
    <key>CFBundleShortVersionString</key>
    <string>${VERSION}</string>
    <key>CFBundleExecutable</key>
    <string>kiro-deck</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>12.0</string>
    <key>LSUIElement</key>
    <true/>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSAppleEventsUsageDescription</key>
    <string>Kiro Deck needs to control iTerm to manage kiro-cli sessions.</string>
    <key>NSAppleScriptEnabled</key>
    <true/>
</dict>
</plist>
EOF

# Create icon (convert PNG to icns)
if command -v iconutil &> /dev/null; then
    ICONSET="$RESOURCES/AppIcon.iconset"
    mkdir -p "$ICONSET"
    # Use the agent icon as app icon (has the ghost)
    ICON_SRC="../shared/icons/kiro-agent-144.png"
    if [[ -f "$ICON_SRC" ]]; then
        sips -z 16 16 "$ICON_SRC" --out "$ICONSET/icon_16x16.png" 2>/dev/null
        sips -z 32 32 "$ICON_SRC" --out "$ICONSET/icon_16x16@2x.png" 2>/dev/null
        sips -z 32 32 "$ICON_SRC" --out "$ICONSET/icon_32x32.png" 2>/dev/null
        sips -z 64 64 "$ICON_SRC" --out "$ICONSET/icon_32x32@2x.png" 2>/dev/null
        sips -z 128 128 "$ICON_SRC" --out "$ICONSET/icon_128x128.png" 2>/dev/null
        sips -z 256 256 "$ICON_SRC" --out "$ICONSET/icon_128x128@2x.png" 2>/dev/null
        sips -z 256 256 "$ICON_SRC" --out "$ICONSET/icon_256x256.png" 2>/dev/null
        sips -z 512 512 "$ICON_SRC" --out "$ICONSET/icon_256x256@2x.png" 2>/dev/null
        sips -z 512 512 "$ICON_SRC" --out "$ICONSET/icon_512x512.png" 2>/dev/null
        cp "$ICON_SRC" "$ICONSET/icon_512x512@2x.png" 2>/dev/null
        iconutil -c icns "$ICONSET" -o "$RESOURCES/AppIcon.icns" 2>/dev/null && rm -rf "$ICONSET"
    fi
fi

echo "✅ Built: $APP_DIR"
echo ""

# Load signing identity from .env.local if present
if [[ -f "$SCRIPT_DIR/.env.local" ]]; then
    source "$SCRIPT_DIR/.env.local"
fi

if [[ -z "$DEVELOPER_ID" ]]; then
    # Check for available signing identities
    IDENTITIES=$(security find-identity -v -p codesigning | grep "Developer ID Application" | grep -v "CSSMERR")
    COUNT=$(echo "$IDENTITIES" | grep -c "Developer ID" || true)
    
    if [[ "$COUNT" -eq 1 ]]; then
        # Extract the identity string
        FOUND_ID=$(echo "$IDENTITIES" | sed -n 's/.*"\(Developer ID Application: [^"]*\)".*/\1/p')
        echo "Found signing identity: $FOUND_ID"
        read -p "Save to .env.local and sign? [Y/n] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            echo "DEVELOPER_ID=\"$FOUND_ID\"" >> "$SCRIPT_DIR/.env.local"
            DEVELOPER_ID="$FOUND_ID"
            echo "Added to .env.local"
        fi
    fi
fi

if [[ -n "$DEVELOPER_ID" ]]; then
    echo "Signing native binaries..."
    # Sign all .node, .dylib, and binary files in node_modules with entitlements
    find "$RESOURCES/node_modules" -type f \( -name "*.node" -o -name "*.dylib" -o -name "tray_darwin_release" -o -name "tray_darwin" \) | while read -r binary; do
        codesign --force --options runtime --entitlements "$SCRIPT_DIR/entitlements.plist" --sign "$DEVELOPER_ID" "$binary" 2>/dev/null || true
    done
    
    # Sign bun with entitlements
    codesign --force --options runtime --entitlements "$SCRIPT_DIR/entitlements.plist" --sign "$DEVELOPER_ID" "$MACOS/bun"
    
    echo "Signing app with: $DEVELOPER_ID"
    codesign --deep --force --options runtime --entitlements "$SCRIPT_DIR/entitlements.plist" --sign "$DEVELOPER_ID" "$APP_DIR"
    echo "✅ Signed"
    
    # Notarization (requires APPLE_ID, APPLE_TEAM_ID, APPLE_APP_PASSWORD)
    if [[ -n "$APPLE_ID" && -n "$APPLE_TEAM_ID" && -n "$APPLE_APP_PASSWORD" ]]; then
        echo "Creating DMG for notarization..."
        DMG_PATH="$SCRIPT_DIR/dist/Streamdecker.dmg"
        DMG_TMP="$SCRIPT_DIR/dist/dmg_tmp"
        
        # Create DMG contents
        rm -rf "$DMG_TMP"
        mkdir -p "$DMG_TMP"
        cp -r "$APP_DIR" "$DMG_TMP/"
        ln -s /Applications "$DMG_TMP/Applications"
        
        # Create DMG
        hdiutil create -volname "Streamdecker" -srcfolder "$DMG_TMP" -ov -format UDZO "$DMG_PATH"
        rm -rf "$DMG_TMP"
        
        # Sign DMG
        codesign --force --sign "$DEVELOPER_ID" "$DMG_PATH"
        
        echo "Submitting for notarization..."
        xcrun notarytool submit "$DMG_PATH" \
            --apple-id "$APPLE_ID" \
            --team-id "$APPLE_TEAM_ID" \
            --password "$APPLE_APP_PASSWORD" \
            --wait
        
        echo "Stapling notarization ticket..."
        xcrun stapler staple "$DMG_PATH"
        
        echo "✅ Notarized"
    else
        echo ""
        echo "To notarize, add to .env.local:"
        echo "  APPLE_ID=\"your@email.com\""
        echo "  APPLE_TEAM_ID=\"SL6CE3V9L5\""
        echo "  APPLE_APP_PASSWORD=\"xxxx-xxxx-xxxx-xxxx\"  # from appleid.apple.com"
    fi
else
    echo "To sign, create .env.local with:"
    echo "  DEVELOPER_ID=\"Developer ID Application: Your Name (TEAMID)\""
    echo ""
    echo "Or run manually:"
    echo "  codesign --deep --force --sign \"Developer ID Application: ...\" \"$APP_DIR\""
fi
echo ""
echo "To install:"
echo "  cp -r \"$APP_DIR\" /Applications/"
