import SysTray from 'systray2';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { spawn, type ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getIconsDir } from '../../../shared/config/paths.js';

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
  
  const systray = new SysTray({
    menu: {
      icon: iconBase64,
      title: '',
      tooltip: 'Kiro Deck',
      items: [
        { title: 'Kiro Deck', enabled: false },
        { title: '─────────', enabled: false },
        { title: 'Configure...', enabled: true },
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
        callbacks.onAbout?.();
        break;
      case 5:
        callbacks.onQuit?.();
        break;
    }
  });

  return systray;
}
