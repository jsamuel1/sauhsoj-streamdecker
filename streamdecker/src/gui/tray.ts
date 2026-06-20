import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { spawn, type ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getIconsDir } from '../../shared/config/paths.js';
import { checkForUpdate, downloadAndInstall, getCurrentVersion } from '../updater.js';
import { buildInitMessage, parseHelperLine, type MenuDef } from './menubar-protocol.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Menu item ids (must match the click handler below).
const ITEM_CONFIGURE = 2;
const ITEM_CHECK_UPDATE = 3;
const ITEM_ABOUT = 4;
const ITEM_QUIT = 6;

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

/** Resolve the native menubar helper binary across dev and bundled-.app contexts. */
function getMenubarBinPath(): string {
  // Bundled app: .app/Contents/Resources/native/bin/streamdecker-menubar
  const execPath = process.execPath;
  if (execPath.includes('.app/Contents/MacOS')) {
    return join(dirname(execPath), '..', 'Resources', 'native', 'bin', 'streamdecker-menubar');
  }
  // Development: relative to this source file (src/gui -> native/bin)
  return join(__dirname, '..', '..', 'native', 'bin', 'streamdecker-menubar');
}

/** Spawns and manages the native macOS menubar helper. */
export class MenubarTray {
  private proc: ChildProcess | null = null;

  constructor(callbacks: TrayCallbacks) {
    const binPath = getMenubarBinPath();
    if (!existsSync(binPath)) {
      console.error(
        `[Tray] Menubar helper not found at ${binPath}. Run "bun run build:menubar" to build it.`
      );
      return;
    }

    const version = getCurrentVersion();
    const menu: MenuDef = {
      icon: iconBase64,
      tooltip: 'Streamdecker',
      items: [
        { id: 0, title: `Streamdecker v${version}`, enabled: false },
        { separator: true },
        { id: ITEM_CONFIGURE, title: 'Configure...', enabled: true },
        { id: ITEM_CHECK_UPDATE, title: 'Check for Updates...', enabled: true },
        { id: ITEM_ABOUT, title: 'About', enabled: true },
        { separator: true },
        { id: ITEM_QUIT, title: 'Quit', enabled: true },
      ],
    };

    try {
      const proc = spawn(binPath, [], { stdio: ['pipe', 'pipe', 'inherit'] });
      this.proc = proc;

      proc.on('error', (err) => console.error('[Tray] Menubar helper error:', err));
      proc.on('exit', (code) => console.log(`[Tray] Menubar helper exited (${code})`));

      let buffer = '';
      proc.stdout?.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        let nl: number;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          this.handleMessage(line, callbacks);
        }
      });

      proc.stdin?.write(buildInitMessage(menu));
      console.log('[Tray] Menubar helper started');
    } catch (err) {
      console.error('[Tray] Failed to start menubar helper:', err);
    }
  }

  private handleMessage(line: string, callbacks: TrayCallbacks): void {
    const msg = parseHelperLine(line);
    if (!msg || msg.type !== 'click') return;
    switch (msg.id) {
      case ITEM_CONFIGURE:
        openConfigUI();
        callbacks.onConfigure?.();
        break;
      case ITEM_CHECK_UPDATE:
        handleCheckUpdate();
        callbacks.onCheckUpdate?.();
        break;
      case ITEM_ABOUT:
        callbacks.onAbout?.();
        break;
      case ITEM_QUIT:
        callbacks.onQuit?.();
        break;
    }
  }

  kill(): void {
    if (!this.proc) return;
    try {
      this.proc.stdin?.write('{"type":"quit"}\n');
    } catch {
      /* ignore */
    }
    this.proc.kill();
    this.proc = null;
  }
}

export function createTray(callbacks: TrayCallbacks): MenubarTray {
  console.log('[Tray] Creating menubar...');
  const tray = new MenubarTray(callbacks);
  // Check for updates on startup (silent)
  setTimeout(() => checkUpdateSilent(), 5000);
  return tray;
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
