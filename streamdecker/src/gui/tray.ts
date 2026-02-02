import SysTray from 'systray2';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { spawn, type ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getIconsDir } from '../../shared/config/paths.js';
import { checkForUpdate, downloadAndInstall, getCurrentVersion } from '../updater.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load menubar icon as base64
let iconBase64 = '';
const iconPath = join(getIconsDir(), 'kiro-menubar@2x.png');
if (existsSync(iconPath)) {
  iconBase64 = readFileSync(iconPath).toString('base64');
  console.log(`[Tray] Loaded icon from: ${iconPath}`);
} else {
  console.log(`[Tray] Icon not found: ${iconPath}`);
}

export interface TrayCallbacks {
  onConfigure?: () => void;
  onAbout?: () => void;
  onQuit?: () => void;
  onCheckUpdate?: () => void;
}

let configWindowProc: ChildProcess | null = null;

export function openConfigUI(): void {
  if (configWindowProc) return;
  
  const webviewScript = join(__dirname, 'webview.ts');
  console.log(`[Tray] Opening webview: ${webviewScript}`);
  
  configWindowProc = spawn('bun', ['run', webviewScript], { 
    stdio: 'inherit',
    cwd: join(__dirname, '../..'),
  });
  
  configWindowProc.on('error', (err) => console.error('[Tray] Webview error:', err));
  configWindowProc.on('close', (code) => {
    console.log(`[Tray] Webview closed with code ${code}`);
    configWindowProc = null;
  });
}

export function createTray(callbacks: TrayCallbacks): SysTray {
  console.log('[Tray] Creating systray...');
  console.log(`[Tray] Icon base64 length: ${iconBase64.length}`);
  
  const version = getCurrentVersion();
  
  const systray = new SysTray({
    menu: {
      icon: iconBase64,
      title: '',
      tooltip: 'Streamdecker',
      items: [
        { title: `Streamdecker v${version}`, enabled: false },
        { title: '─────────', enabled: false },
        { title: 'Configure...', enabled: true },
        { title: 'Check for Updates...', enabled: true },
        { title: 'About', enabled: true },
        { title: '─────────', enabled: false },
        { title: 'Quit', enabled: true },
      ],
    },
    debug: true,
    copyDir: true,
  });
  
  console.log('[Tray] Systray created');

  systray.onClick(async (action) => {
    switch (action.seq_id) {
      case 2:
        openConfigUI();
        callbacks.onConfigure?.();
        break;
      case 3:
        handleCheckUpdate();
        callbacks.onCheckUpdate?.();
        break;
      case 4:
        callbacks.onAbout?.();
        break;
      case 6:
        callbacks.onQuit?.();
        break;
    }
  });
  
  // Check for updates on startup (silent)
  setTimeout(() => checkUpdateSilent(), 5000);

  return systray;
}

async function handleCheckUpdate(): Promise<void> {
  console.log('[Tray] Checking for updates...');
  const update = await checkForUpdate();
  
  if (!update) {
    console.log('[Tray] Update check failed');
    return;
  }
  
  if (update.available) {
    console.log(`[Tray] Update available: ${update.current} -> ${update.latest}`);
    // Use osascript to show dialog
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
      const { stdout } = await execAsync(`osascript -e 'display dialog "Update available: v${update.latest}\\n\\nCurrent version: v${update.current}\\n\\nDownload and install now?" buttons {"Later", "Update"} default button "Update" with title "Streamdecker Update"'`);
      
      if (stdout.includes('Update')) {
        console.log('[Tray] User chose to update');
        await downloadAndInstall();
      }
    } catch {
      // User clicked Later or closed dialog
    }
  } else {
    console.log('[Tray] Already up to date');
    const { exec } = await import('child_process');
    exec(`osascript -e 'display notification "You are running the latest version (v${update.current})" with title "Streamdecker"'`);
  }
}

async function checkUpdateSilent(): Promise<void> {
  const update = await checkForUpdate();
  if (update?.available) {
    console.log(`[Tray] Update available: v${update.latest}`);
    const { exec } = await import('child_process');
    exec(`osascript -e 'display notification "Update available: v${update.latest}" with title "Streamdecker" subtitle "Click Check for Updates to install"'`);
  }
}
