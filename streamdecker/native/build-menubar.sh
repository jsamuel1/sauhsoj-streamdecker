#!/bin/bash
# Build the native macOS menubar helper as a universal (arm64 + x86_64) binary.
# Skips rebuilding when the binary is newer than the source.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$DIR/menubar/main.swift"
OUT_DIR="$DIR/bin"
OUT="$OUT_DIR/streamdecker-menubar"

mkdir -p "$OUT_DIR"

if [[ -f "$OUT" && "$OUT" -nt "$SRC" ]]; then
  echo "[build-menubar] up to date: $OUT"
  exit 0
fi

echo "[build-menubar] compiling universal binary..."
ARM64="$OUT_DIR/.menubar-arm64"
X8664="$OUT_DIR/.menubar-x86_64"

swiftc -O -target arm64-apple-macos11 -o "$ARM64" "$SRC"
swiftc -O -target x86_64-apple-macos11 -o "$X8664" "$SRC"
lipo -create -output "$OUT" "$ARM64" "$X8664"
rm -f "$ARM64" "$X8664"
chmod +x "$OUT"

echo "[build-menubar] built: $OUT"
lipo -archs "$OUT"
