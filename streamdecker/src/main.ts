import { deckConnection } from './deck/connection.js';
import { renderInfoBar } from './infobar/renderer.js';
import { sources } from './infobar/sources.js';
import { EmulatorServer } from '../emulator/server.js';
import { createTray } from './gui/tray.js';
import sharp from 'sharp';
import { GlobalFonts, createCanvas } from '@napi-rs/canvas';
import { existsSync } from 'fs';
import { join } from 'path';

// Import from shared modules
import { getIconsDir, getFontsDir } from '../shared/config/paths.js';
import { getConfig, updateConfig, isFirstRun, markFirstRunComplete } from '../shared/config/loader.js';
import {
  focusKiro,
  cycleKiroTabs,
  alertIdleKiro,
  sendYes,
  sendNo,
  sendTrust,
  switchAgent,
  getAgentList,
  launchKiro,
  launchKiroWithPicker,
} from '../shared/actions/kiro.js';
import { focusApp, sendKeystroke } from '../shared/actions/terminal.js';
import { buttonsByPosition, resolveButtonIcon, resolveButtonLabel } from './buttons.js';
import { launchTarget, focusTarget } from '../shared/actions/target-dispatch.js';
import type { Button } from '../shared/config/schema.js';

const ICONS_DIR = getIconsDir();
const FONT_PATH = join(getFontsDir(), 'Nunito-ExtraBold.ttf');

// Register custom font
GlobalFonts.registerFromPath(FONT_PATH, 'Nunito');

// Page state
type Page = 'main' | 'agents';
let currentPage: Page = 'main';
let agentList: string[] = [];

function deviceSlots(): number {
  return getConfig().device.type === 'mini' ? 6 : 8;
}

function currentButtons(): (Button | null)[] {
  return buttonsByPosition(getConfig().buttons, deviceSlots());
}

let emulator: EmulatorServer | null = null;
let infoBarSourceIndex = 0;
let tray: ReturnType<typeof createTray> | null = null;

// Cache button images for sending to new emulator clients
const buttonImageCache: Map<number, string> = new Map();
let infoBarCache: string | null = null;

// Long-press tracking for Launch button
const LONG_PRESS_MS = 500;
let launchButtonDownTime: number | null = null;

// Action registry for button presses (short press)
const ActionRegistry: Record<string, (button: Button) => Promise<void>> = {
  'kiro.focus': async () => { await focusKiro(); },
  'kiro.cycle': async () => { await cycleKiroTabs(); },
  'kiro.alert': async () => { await alertIdleKiro(); },
  'kiro.launch': async () => { await launchKiroWithPicker(); },
  'kiro.yes': async () => { await sendYes(); },
  'kiro.no': async () => { await sendNo(); },
  'kiro.trust': async () => { await sendTrust(); },
  'target.launch': async (b) => { if (b.target) await launchTarget(b.target, b.folder || undefined); },
  'target.focus': async (b) => { if (b.target) await focusTarget(b.target); },
};

function getRecentAgents(maxCount: number): string[] {
  const agents = getAgentList();
  const config = getConfig();
  const recentOrder = config.agents.recent || [];
  
  // Sort: recent first, then rest
  const recentSet = new Set(recentOrder);
  const recent = recentOrder.filter(a => agents.includes(a));
  const rest = agents.filter(a => !recentSet.has(a)).sort();
  
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

async function loadButtonIcon(button: Button | null): Promise<Buffer | null> {
  if (!button) return null;

  const iconName = resolveButtonIcon(button);
  if (!iconName) return null;

  // Try <iconName>-96.png first, then <iconName>.png
  let iconPath = join(ICONS_DIR, `${iconName}-96.png`);
  if (!existsSync(iconPath)) {
    iconPath = join(ICONS_DIR, `${iconName}.png`);
    if (!existsSync(iconPath)) {
      console.log(`[Main] Icon not found: ${iconName}`);
      return null;
    }
  }

  const label = resolveButtonLabel(button);

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

async function showInfoBarMessage(text: string, color: string = '#9046ff', durationMs: number = 1500) {
  const buffer = await renderInfoBar(text, color);
  await deckConnection.setInfoBar(buffer);
  const pngBuffer = await sharp(buffer, { raw: { width: 248, height: 58, channels: 4 } })
    .png()
    .toBuffer();
  emulator?.sendInfoBar(pngBuffer.toString('base64'));
  
  // Restore normal info bar after delay
  setTimeout(() => updateInfoBar(), durationMs);
}

async function handleButtonDown(index: number) {
  console.log(`[Main] Button ${index} pressed (page: ${currentPage})`);

  const slot = currentButtons()[index];
  const actionId = slot?.action;

  // Track launch button for long-press (only on main page)
  if (actionId === 'kiro.launch' && currentPage === 'main') {
    launchButtonDownTime = Date.now();
    return; // Wait for button up
  }

  if (currentPage === 'agents') {
    // Agent page - select agent and return to main
    const agentName = agentList[index];
    if (agentName) {
      console.log(`[Main] Switching to agent: ${agentName}`);
      await showMainPage();
      await showInfoBarMessage(`→ Agent [${agentName}]`);

      // Check for keyboard shortcut in config
      const config = getConfig();
      const shortcut = config.agents.shortcuts?.[agentName];
      if (shortcut) {
        await focusApp('iTerm');
        await new Promise(r => setTimeout(r, 100));
        await sendKeystroke(shortcut);
      } else {
        await switchAgent(agentName);
      }
    }
    return;
  }

  // Main page
  if (actionId === 'kiro.agent' || actionId === 'kiro.agent.picker') {
    await showAgentPage();
    return;
  }

  if (!slot || !actionId) return;

  const action = ActionRegistry[actionId];
  if (action) {
    try {
      await action(slot);
    } catch (e) {
      console.error(`[Main] Action failed:`, e);
    }
  }
}

async function handleButtonUp(index: number) {
  const slot = currentButtons()[index];
  const actionId = slot?.action;

  // Handle launch button long-press
  if (actionId === 'kiro.launch' && launchButtonDownTime !== null) {
    const pressDuration = Date.now() - launchButtonDownTime;
    launchButtonDownTime = null;

    try {
      if (pressDuration >= LONG_PRESS_MS) {
        // Long press: launch in last used folder
        console.log('[Main] Launch long-press: last used folder');
        await launchKiro();
      } else {
        // Short press: folder picker
        console.log('[Main] Launch short-press: folder picker');
        await launchKiroWithPicker();
      }
    } catch (e) {
      console.error(`[Main] Launch action failed:`, e);
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

async function initButtons(sendToDevice: boolean = true) {
  const slots = currentButtons();
  for (let i = 0; i < slots.length; i++) {
    const buffer = await loadButtonIcon(slots[i]);
    if (buffer) {
      if (sendToDevice) {
        await deckConnection.setButtonImage(i, buffer);
      }

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
  const maxButtons = config.device.type === 'mini' ? 6 : 8;
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
  const config = getConfig();
  console.log(`[Main] Device type: ${config.device.type}`);
  
  // First run - open config
  if (isFirstRun()) {
    console.log('[Main] First run - setting up...');
    markFirstRunComplete();
    setTimeout(() => {
      const { openConfigUI } = require('./gui/tray.js');
      openConfigUI();
    }, 2000);
  }
  
  // Start menubar tray
  try {
    tray = createTray({
      onConfigure: () => console.log('[Tray] Config updated'),
      onAbout: () => console.log('[Tray] About: Kiro Deck v0.1.1'),
      onQuit: async () => {
        console.log('[Tray] Quit requested');
        await deckConnection.close();
        process.exit(0);
      },
    });
    console.log('[Main] Tray created');
  } catch (e) {
    console.error('[Main] Tray creation failed:', e);
  }
  
  // Start emulator server
  emulator = new EmulatorServer();
  emulator.onButtonDown = handleButtonDown;
  emulator.onButtonUp = handleButtonUp;
  emulator.onPageLeft = handlePageLeft;
  emulator.onPageRight = handlePageRight;
  emulator.onClientConnect = (send) => {
    buttonImageCache.forEach((b64, i) => send({ type: 'buttonImage', index: i, data: b64 }));
    if (infoBarCache) send({ type: 'infoBar', data: infoBarCache });
  };
  emulator.onDeviceChange = (device) => {
    const cfg = getConfig();
    if (cfg.device.type !== device) {
      updateConfig({ device: { ...cfg.device, type: device } });
      console.log(`[Main] Device type changed to: ${device}`);
    }
  };
  emulator.onConfigChange = async () => { await showMainPage(); };
  emulator.onModeSwitch = async (newMode, oldMode) => {
    console.log(`[Main] Mode switch: ${oldMode} -> ${newMode}`);
    if (oldMode === 'standalone' && newMode !== 'standalone') {
      // Release the Stream Deck so other apps can use it
      console.log('[Main] Disconnecting from Stream Deck for mode switch...');
      await deckConnection.close();
    } else if (oldMode !== 'standalone' && newMode === 'standalone') {
      // Reconnect to Stream Deck
      console.log('[Main] Reconnecting to Stream Deck...');
      await deckConnection.connect();
    }
  };
  
  // Connect to Stream Deck (only in standalone mode)
  deckConnection.on('connected', async (info) => {
    console.log(`[Main] Stream Deck connected: ${info.model}`);
    
    const detectedType = info.model?.toLowerCase().includes('mini') ? 'mini' : 'neo';
    const cfg = getConfig();
    if (cfg.device.type !== detectedType) {
      updateConfig({ device: { ...cfg.device, type: detectedType } });
      console.log(`[Main] Device type updated to: ${detectedType}`);
    }
    
    emulator?.setDetectedDevice(detectedType);
    await initButtons();
    await updateInfoBar();
  });
  
  deckConnection.on('disconnected', () => {
    console.log('[Main] Stream Deck disconnected');
  });
  
  deckConnection.on('buttonDown', handleButtonDown);
  deckConnection.on('buttonUp', handleButtonUp);
  deckConnection.on('pageLeft', handlePageLeft);
  deckConnection.on('pageRight', handlePageRight);
  
  // Only connect to device in standalone mode
  if (config.mode === 'standalone') {
    await deckConnection.connect();
    setInterval(updateInfoBar, 30000);
  } else {
    console.log(`[Main] Mode is ${config.mode}, not connecting to Stream Deck`);
    // Still render buttons for emulator preview
    await initButtons(false);
  }
  
  process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down...');
    await deckConnection.close();
    process.exit(0);
  });
  
  console.log('✅ Kiro Deck running. Press Ctrl+C to exit.');
}

main().catch(console.error);
