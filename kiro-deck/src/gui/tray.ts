import SysTray from 'systray2';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { exec } from 'child_process';

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

export function openConfigUI(): void {
  // Open the emulator/config web UI in default browser
  const htmlPath = join(__dirname, '../../emulator/index.html');
  exec(`open "${htmlPath}"`);
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
