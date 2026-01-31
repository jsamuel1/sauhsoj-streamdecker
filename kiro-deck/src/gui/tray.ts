import SysTray from 'systray2';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Get icon path - works in both dev and .app bundle
function getIconPath(): string {
  const execPath = process.execPath;
  if (execPath.includes('.app/Contents/MacOS')) {
    return join(dirname(execPath), '..', 'Resources', 'icons', 'kiro-menubar@2x.png');
  }
  return join(__dirname, '../../wtf.sauhsoj.kiro-icons.sdIconPack/icons/kiro-menubar@2x.png');
}

// Load menubar icon as base64
let iconBase64 = '';
const iconPath = getIconPath();
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

let configWindowProc: ReturnType<typeof spawn> | null = null;

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
