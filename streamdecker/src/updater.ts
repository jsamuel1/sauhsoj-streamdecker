import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync, createWriteStream, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const REPO = 'jsamuel1/sauhsoj-streamdecker';
const GITHUB_API = `https://api.github.com/repos/${REPO}/releases/latest`;

interface Release {
  tag_name: string;
  html_url: string;
  assets: { name: string; browser_download_url: string }[];
}

/**
 * Get current app version from package.json
 */
export function getCurrentVersion(): string {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  
  // Check bundled app first
  const execPath = process.execPath;
  if (execPath.includes('.app/Contents/MacOS')) {
    const pkgPath = join(dirname(execPath), '..', 'Resources', 'package.json');
    if (existsSync(pkgPath)) {
      return JSON.parse(readFileSync(pkgPath, 'utf-8')).version;
    }
  }
  
  // Development
  const devPkg = join(__dirname, '../../package.json');
  if (existsSync(devPkg)) {
    return JSON.parse(readFileSync(devPkg, 'utf-8')).version;
  }
  
  return '0.0.0';
}

/**
 * Check GitHub for latest release
 */
export async function checkForUpdate(): Promise<{ available: boolean; current: string; latest: string; url: string } | null> {
  try {
    const res = await fetch(GITHUB_API, {
      headers: { 'User-Agent': 'Streamdecker' }
    });
    
    if (!res.ok) return null;
    
    const release: Release = await res.json();
    const latest = release.tag_name.replace(/^v/, '');
    const current = getCurrentVersion();
    
    return {
      available: compareVersions(latest, current) > 0,
      current,
      latest,
      url: release.html_url
    };
  } catch (e) {
    console.error('[Updater] Check failed:', e);
    return null;
  }
}

/**
 * Download and install update
 */
export async function downloadAndInstall(): Promise<boolean> {
  try {
    const res = await fetch(GITHUB_API, {
      headers: { 'User-Agent': 'Streamdecker' }
    });
    
    if (!res.ok) return false;
    
    const release: Release = await res.json();
    const dmgAsset = release.assets.find(a => a.name.endsWith('.dmg'));
    
    if (!dmgAsset) {
      console.error('[Updater] No DMG found in release');
      return false;
    }
    
    console.log(`[Updater] Downloading ${dmgAsset.name}...`);
    
    // Download to temp
    const tmpPath = `/tmp/Streamdecker-update.dmg`;
    const dmgRes = await fetch(dmgAsset.browser_download_url);
    const buffer = await dmgRes.arrayBuffer();
    const fs = await import('fs');
    fs.writeFileSync(tmpPath, Buffer.from(buffer));
    
    console.log('[Updater] Mounting DMG...');
    await execAsync(`hdiutil attach "${tmpPath}" -quiet`);
    
    console.log('[Updater] Installing...');
    // Remove old app and copy new
    const appPath = '/Applications/Streamdecker.app';
    if (existsSync(appPath)) {
      rmSync(appPath, { recursive: true, force: true });
    }
    await execAsync(`cp -r "/Volumes/Streamdecker/Streamdecker.app" /Applications/`);
    
    console.log('[Updater] Cleaning up...');
    await execAsync(`hdiutil detach "/Volumes/Streamdecker" -quiet`);
    rmSync(tmpPath, { force: true });
    
    console.log('[Updater] Update installed. Restarting...');
    
    // Restart app
    setTimeout(() => {
      execAsync('open -a Streamdecker');
      process.exit(0);
    }, 500);
    
    return true;
  } catch (e) {
    console.error('[Updater] Install failed:', e);
    return false;
  }
}

/**
 * Compare semver versions. Returns >0 if a > b, <0 if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}
