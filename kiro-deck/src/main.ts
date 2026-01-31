import { deckConnection } from './deck/connection.js';
import { executeAction } from './actions/index.js';
import { switchAgent } from './actions/kiro.js';
import { renderInfoBar } from './infobar/renderer.js';
import { sources } from './infobar/sources.js';
import { EmulatorServer } from '../emulator/server.js';
import { createTray } from './gui/tray.js';
import { loadConfig, saveConfig, getConfig } from './config/config.js';
import sharp from 'sharp';
import { GlobalFonts, createCanvas } from '@napi-rs/canvas';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '../../wtf.sauhsoj.kiro-icons.sdIconPack/icons');
const FONT_PATH = join(__dirname, '../fonts/Nunito-ExtraBold.ttf');
const RECENT_AGENTS_FILE = join(process.env.HOME || '', '.kiro', 'kiro-picker-recent-agents');

// Register custom font
GlobalFonts.registerFromPath(FONT_PATH, 'Nunito');

// Page state
type Page = 'main' | 'agents';
let currentPage: Page = 'main';
let agentList: string[] = [];

// Button layout matching BTT: row 1 (top 0-3), row 2 (bottom 4-7)
// BTT: row=1 col=1-4 is top row, row=2 col=1-4 is bottom row
// Stream Deck Neo: indices 0-3 top row (L-R), 4-7 bottom row (L-R)
const buttonActions = [
  'kiro.focus',    // 0 - top left (Focus)
  'kiro.cycle',    // 1 - (Cycle)
  'kiro.alert',    // 2 - (Alert)
  'kiro.launch',   // 3 - top right (Launch)
  'kiro.yes',      // 4 - bottom left (Yes)
  'kiro.no',       // 5 - (No)
  'kiro.thinking', // 6 - (Trust/Thinking)
  'kiro.agent',    // 7 - bottom right (Agent)
];

const buttonIcons = [
  'kiro-focus-96.png',
  'kiro-cycle-96.png',
  'kiro-alert-96.png',
  'kiro-launch-96.png',
  'kiro-yes-96.png',
  'kiro-no-96.png',
  'kiro-trust-96.png',
  'kiro-agent-96.png',
];

const buttonLabels = ['Focus', 'Cycle', 'Alert', 'Launch', 'Yes', 'No', 'Trust', 'Agent'];

let emulator: EmulatorServer | null = null;
let infoBarSourceIndex = 0;
let tray: ReturnType<typeof createTray> | null = null;

// Cache button images for sending to new emulator clients
const buttonImageCache: Map<number, string> = new Map();
let infoBarCache: string | null = null;

function getRecentAgents(maxCount: number): string[] {
  const agentsDir = join(process.env.HOME || '', '.kiro', 'agents');
  const allAgents: string[] = [];
  
  // Read all agent names from JSON files
  try {
    const files = readdirSync(agentsDir).filter(f => f.endsWith('.json') && !f.endsWith('.bak'));
    for (const file of files) {
      try {
        const data = JSON.parse(readFileSync(join(agentsDir, file), 'utf-8'));
        if (data.name) allAgents.push(data.name);
      } catch {}
    }
  } catch {}
  
  // Get recent agents order
  let recentOrder: string[] = [];
  if (existsSync(RECENT_AGENTS_FILE)) {
    try {
      recentOrder = readFileSync(RECENT_AGENTS_FILE, 'utf-8').trim().split('\n').filter(Boolean);
    } catch {}
  }
  
  // Sort: recent first, then alphabetically
  const recentSet = new Set(recentOrder);
  const recent = recentOrder.filter(a => allAgents.includes(a));
  const rest = allAgents.filter(a => !recentSet.has(a)).sort();
  
  return [...recent, ...rest].slice(0, maxCount);
}

async function renderAgentButton(name: string): Promise<Buffer> {
  // Create button with agent name using canvas, then convert via sharp
  const canvas = createCanvas(96, 96);
  const ctx = canvas.getContext('2d');
  
  // Background - Kiro purple
  ctx.fillStyle = '#9046ff';
  ctx.fillRect(0, 0, 96, 96);
  
  // Agent name - centered
  ctx.font = '800 18px Nunito';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  ctx.fillText(name, 48, 54);
  
  // Convert to raw RGB for Stream Deck
  const pngBuffer = canvas.toBuffer('image/png');
  return sharp(pngBuffer).removeAlpha().raw().toBuffer();
}

async function loadButtonIcon(index: number): Promise<Buffer | null> {
  const iconName = buttonIcons[index];
  if (!iconName) return null;
  
  const iconPath = join(ICONS_DIR, iconName);
  if (!existsSync(iconPath)) {
    console.log(`[Main] Icon not found: ${iconPath}`);
    return null;
  }
  
  const label = buttonLabels[index];
  
  // Load icon and add label at bottom
  const icon = sharp(iconPath).resize(96, 96);
  
  // Create label overlay using canvas with custom font
  const canvas = createCanvas(96, 96);
  const ctx = canvas.getContext('2d');
  ctx.font = '800 21px Nunito';
  ctx.textAlign = 'center';
  // Shadow
  ctx.fillStyle = 'black';
  ctx.fillText(label, 48, 89);
  // Text
  ctx.fillStyle = 'white';
  ctx.fillText(label, 48, 88);
  
  const labelBuffer = canvas.toBuffer('image/png');
  
  // Composite label onto icon
  const buffer = await icon
    .composite([{ input: labelBuffer, top: 0, left: 0 }])
    .removeAlpha()
    .raw()
    .toBuffer();
  
  return buffer;
}

async function updateInfoBar() {
  const source = sources[infoBarSourceIndex];
  const data = await source.getData();
  const buffer = await renderInfoBar(data.text, data.color);
  
  await deckConnection.setInfoBar(buffer);
  const pngBuffer = await sharp(buffer, { raw: { width: 248, height: 58, channels: 4 } })
    .png()
    .toBuffer();
  const b64 = pngBuffer.toString('base64');
  infoBarCache = b64;
  emulator?.sendInfoBar(b64);
}

async function handleButtonDown(index: number) {
  console.log(`[Main] Button ${index} pressed (page: ${currentPage})`);
  
  if (currentPage === 'agents') {
    // Agent page - select agent and return to main
    const agentName = agentList[index];
    if (agentName) {
      console.log(`[Main] Switching to agent: ${agentName}`);
      await showMainPage();
      await switchAgent(agentName);
    }
    return;
  }
  
  // Main page
  const actionId = buttonActions[index];
  if (actionId === 'kiro.agent') {
    // Show agent picker page
    await showAgentPage();
    return;
  }
  
  if (actionId) {
    try {
      await executeAction(actionId);
    } catch (e) {
      console.error(`[Main] Action failed:`, e);
    }
  }
}

async function handlePageLeft() {
  console.log('[Main] Page left');
  if (currentPage === 'agents') {
    await showMainPage();
    return;
  }
  // Cycle info bar source backward
  infoBarSourceIndex = (infoBarSourceIndex - 1 + sources.length) % sources.length;
  await updateInfoBar();
}

async function handlePageRight() {
  console.log('[Main] Page right');
  if (currentPage === 'agents') {
    await showMainPage();
    return;
  }
  // Cycle info bar source forward
  infoBarSourceIndex = (infoBarSourceIndex + 1) % sources.length;
  await updateInfoBar();
}

async function initButtons() {
  for (let i = 0; i < 8; i++) {
    const buffer = await loadButtonIcon(i);
    if (buffer) {
      await deckConnection.setButtonImage(i, buffer);
      
      // Also send to emulator as PNG base64
      const pngBuffer = await sharp(buffer, { raw: { width: 96, height: 96, channels: 3 } })
        .png()
        .toBuffer();
      const b64 = pngBuffer.toString('base64');
      buttonImageCache.set(i, b64);
      emulator?.sendButtonImage(i, b64);
    }
  }
}

async function showAgentPage() {
  currentPage = 'agents';
  const config = getConfig();
  const maxButtons = config.deviceType === 'mini' ? 6 : 8;
  agentList = getRecentAgents(maxButtons);
  
  for (let i = 0; i < maxButtons; i++) {
    const agentName = agentList[i];
    let buffer: Buffer;
    
    if (agentName) {
      buffer = await renderAgentButton(agentName);
    } else {
      // Empty button - dark background
      buffer = await sharp({
        create: { width: 96, height: 96, channels: 3, background: { r: 24, g: 24, b: 27 } }
      }).raw().toBuffer();
    }
    
    await deckConnection.setButtonImage(i, buffer);
    
    // Send to emulator
    const pngBuffer = await sharp(buffer, { raw: { width: 96, height: 96, channels: 3 } })
      .png()
      .toBuffer();
    emulator?.sendButtonImage(i, pngBuffer.toString('base64'));
  }
}

async function showMainPage() {
  currentPage = 'main';
  await initButtons();
}

async function main() {
  console.log('🎮 Kiro Deck starting...');
  
  // Load config
  const config = loadConfig();
  console.log(`[Main] Device type: ${config.deviceType}`);
  
  // Start menubar tray
  tray = createTray({
    onConfigure: () => console.log('[Tray] Config updated'),
    onAbout: () => console.log('[Tray] About: Kiro Deck v0.1.0'),
    onQuit: async () => {
      console.log('[Tray] Quit requested');
      await deckConnection.close();
      process.exit(0);
    },
  });
  
  // Start emulator server
  emulator = new EmulatorServer();
  emulator.onButtonDown = handleButtonDown;
  emulator.onButtonUp = () => {}; // No action on release
  emulator.onPageLeft = handlePageLeft;
  emulator.onPageRight = handlePageRight;
  emulator.onClientConnect = (send) => {
    // Send cached images to new client
    buttonImageCache.forEach((b64, i) => send({ type: 'buttonImage', index: i, data: b64 }));
    if (infoBarCache) send({ type: 'infoBar', data: infoBarCache });
  };
  emulator.onDeviceChange = (device) => {
    const config = getConfig();
    if (config.deviceType !== device) {
      saveConfig({ ...config, deviceType: device });
      console.log(`[Main] Device type changed to: ${device}`);
    }
  };
  
  // Connect to Stream Deck
  deckConnection.on('connected', async (info) => {
    console.log(`[Main] Stream Deck connected: ${info.model}`);
    
    // Auto-detect and save device type
    const detectedType = info.model?.toLowerCase().includes('mini') ? 'mini' : 'neo';
    const config = getConfig();
    if (config.deviceType !== detectedType) {
      saveConfig({ ...config, deviceType: detectedType });
      console.log(`[Main] Device type updated to: ${detectedType}`);
    }
    
    // Notify emulator of detected device
    emulator?.setDetectedDevice(detectedType);
    
    await initButtons();
    await updateInfoBar();
  });
  
  deckConnection.on('disconnected', () => {
    console.log('[Main] Stream Deck disconnected');
  });
  
  deckConnection.on('buttonDown', handleButtonDown);
  deckConnection.on('pageLeft', handlePageLeft);
  deckConnection.on('pageRight', handlePageRight);
  
  await deckConnection.connect();
  
  // Update info bar periodically
  setInterval(updateInfoBar, 30000);
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down...');
    await deckConnection.close();
    process.exit(0);
  });
  
  console.log('✅ Kiro Deck running. Press Ctrl+C to exit.');
}

main().catch(console.error);
