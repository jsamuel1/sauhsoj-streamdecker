#!/bin/bash
# Build the native macOS menubar helper.
# Produces a universal (arm64 + x86_64) binary when both toolchains are present,
# and gracefully falls back to whichever architecture(s) can be built (e.g.
# arm64-only on an Apple Silicon Mac without the x86_64 Swift cross-compile libs).
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

echo "[build-menubar] compiling..."
ARM64="$OUT_DIR/.menubar-arm64"
X8664="$OUT_DIR/.menubar-x86_64"
rm -f "$ARM64" "$X8664"

# Build each slice best-effort; `if` keeps `set -e` from aborting on a failure.
slices=()
if swiftc -O -target arm64-apple-macos11 -o "$ARM64" "$SRC" 2>/dev/null; then
  slices+=("$ARM64")
else
  echo "[build-menubar] warning: arm64 slice failed to build"
fi
if swiftc -O -target x86_64-apple-macos11 -o "$X8664" "$SRC" 2>/dev/null; then
  slices+=("$X8664")
else
  echo "[build-menubar] note: x86_64 slice unavailable (skipping) — this Mac likely lacks the x86_64 Swift toolchain"
fi

if [[ ${#slices[@]} -eq 0 ]]; then
  echo "[build-menubar] error: no architecture could be built" >&2
  exit 1
fi

if [[ ${#slices[@]} -eq 1 ]]; then
  cp "${slices[0]}" "$OUT"
else
  lipo -create -output "$OUT" "${slices[@]}"
fi
rm -f "$ARM64" "$X8664"
chmod +x "$OUT"

echo "[build-menubar] built: $OUT"
lipo -archs "$OUT"
