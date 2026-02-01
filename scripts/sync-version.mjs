#!/usr/bin/env node
// Sync version from package.json to plugin manifest.json
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));
const manifestPath = join(root, 'wtf.sauhsoj.streamdecker.sdPlugin/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

if (manifest.Version !== pkg.version) {
  manifest.Version = pkg.version;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`[sync-version] Updated manifest to ${pkg.version}`);
} else {
  console.log(`[sync-version] Version already ${pkg.version}`);
}
