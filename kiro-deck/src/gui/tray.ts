import SysTray from 'systray2';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load menubar icon as base64
const iconPaths = [
  join(__dirname, '../../wtf.sauhsoj.kiro-icons.sdIconPack/icons/kiro-menubar@2x.png'),
  join(__dirname, '../../../wtf.sauhsoj.kiro-icons.sdIconPack/icons/kiro-menubar@2x.png'),
];

let iconBase64 = '';
for (const p of iconPaths) {
  try {
    iconBase64 = readFileSync(p).toString('base64');
    break;
  } catch {}
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
    debug: false,
    copyDir: true,
  });

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
