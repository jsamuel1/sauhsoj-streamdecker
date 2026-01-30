import SysTray from 'systray2';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { getConfig, saveConfig, type Config } from '../config/config.js';
import { runAppleScript } from '../actions/applescript.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load icon as base64 - try multiple paths
const iconPaths = [
  join(__dirname, '../../wtf.sauhsoj.kiro-icons.sdIconPack/icons/kiro-logo.png'),
  join(__dirname, '../../../wtf.sauhsoj.kiro-icons.sdIconPack/icons/kiro-logo.png'),
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
  onDeviceChange?: (device: 'neo' | 'mini') => void;
}

export async function showConfigDialog(): Promise<void> {
  const config = getConfig();
  const result = await runAppleScript(`
    set deviceList to {"neo", "mini"}
    set currentDevice to "${config.deviceType}"
    set chosen to choose from list deviceList with prompt "Select Stream Deck device:" default items {currentDevice}
    if chosen is false then return ""
    return item 1 of chosen
  `);
  
  if (result && (result === 'neo' || result === 'mini')) {
    saveConfig({ ...config, deviceType: result });
    return;
  }
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
        await showConfigDialog();
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
