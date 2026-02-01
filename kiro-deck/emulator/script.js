const WS_URL = 'ws://127.0.0.1:3847';
const API_URL = 'http://127.0.0.1:3848/api/config';
let ws = null;
let currentDevice = 'neo';
let detectedDevice = null;
let isConnected = false;
let config = null;

const buttonLabels = ['Focus', 'Cycle', 'Alert', 'Launch', 'Yes', 'No', 'Trust', 'Agent'];
const buttonActions = ['kiro.focus', 'kiro.cycle', 'kiro.alert', 'kiro.launch', 'kiro.yes', 'kiro.no', 'kiro.thinking', 'kiro.agent'];

// Config management
async function loadConfig() {
  try {
    const res = await fetch(API_URL);
    config = await res.json();
    populateSettingsForm();
  } catch (e) {
    console.error('Failed to load config:', e);
  }
}

async function saveConfig(newConfig) {
  try {
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });
    config = await res.json();
    populateSettingsForm();
    return true;
  } catch (e) {
    console.error('Failed to save config:', e);
    return false;
  }
}

function populateSettingsForm() {
  if (!config) return;
  const form = document.getElementById('settings-form');
  form.mode.value = config.mode || 'standalone';
  form.deviceType.value = config.device?.type || 'neo';
  form.terminalApp.value = config.terminal?.app || 'auto';
  form.favoriteAgents.value = (config.agents?.favorites || []).join(', ');
  form.accentColor.value = config.theme?.accentColor || '#9046ff';
  form.launchAtLogin.checked = config.launchAtLogin !== false;
}

function getFormConfig() {
  const form = document.getElementById('settings-form');
  return {
    mode: form.mode.value,
    device: { type: form.deviceType.value },
    terminal: { app: form.terminalApp.value },
    agents: { favorites: form.favoriteAgents.value.split(',').map(s => s.trim()).filter(Boolean) },
    theme: { accentColor: form.accentColor.value },
    launchAtLogin: form.launchAtLogin.checked
  };
}

function connect() {
  if (ws && ws.readyState === WebSocket.CONNECTING) return;
  
  ws = new WebSocket(WS_URL);
  
  ws.onopen = () => {
    isConnected = true;
    updateStatusBtn();
  };
  
  ws.onclose = () => {
    isConnected = false;
    updateStatusBtn();
    setTimeout(connect, 2000);
  };
  
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'buttonImage') {
      const img = document.getElementById(`btn-${msg.index}`);
      if (img) {
        img.src = `data:image/png;base64,${msg.data}`;
        img.classList.add('loaded');
      }
      const miniImg = document.getElementById(`mini-btn-${msg.index}`);
      if (miniImg) {
        miniImg.src = `data:image/png;base64,${msg.data}`;
        miniImg.classList.add('loaded');
      }
    } else if (msg.type === 'infoBar') {
      const img = document.getElementById('info-bar-img');
      img.src = `data:image/png;base64,${msg.data}`;
      img.classList.add('loaded');
    } else if (msg.type === 'detectedDevice') {
      detectedDevice = msg.device;
      updateDeviceSelect();
      switchDevice(msg.device);
    } else if (msg.type === 'buttonLabels') {
      msg.labels.forEach((label, i) => {
        buttonLabels[i] = label;
        updateLabel(i, label);
      });
    } else if (msg.type === 'configChanged') {
      config = msg.config;
      populateSettingsForm();
    }
  };
}

function send(msg) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function updateStatusBtn() {
  const btn = document.getElementById('status-btn');
  if (isConnected) {
    btn.textContent = 'Connected';
    btn.className = 'status-btn connected';
  } else {
    btn.textContent = 'Reconnect';
    btn.className = 'status-btn disconnected';
  }
}

function updateDeviceSelect() {
  const select = document.getElementById('device-select');
  select.innerHTML = '';
  ['neo', 'mini'].forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d === 'neo' ? 'Stream Deck Neo' : 'Stream Deck Mini';
    if (d === detectedDevice) opt.textContent += ' (detected)';
    opt.selected = d === currentDevice;
    select.appendChild(opt);
  });
}

function updateLabel(index, label) {
  // Labels are now on the button image itself, action shown below
}

function updateAction(index, action) {
  const el = document.getElementById(`action-${index}`);
  if (el) el.textContent = action;
}

function switchDevice(device) {
  currentDevice = device;
  document.getElementById('neo-layout').style.display = device === 'neo' ? 'flex' : 'none';
  document.getElementById('mini-layout').style.display = device === 'mini' ? 'flex' : 'none';
  document.getElementById('info-bar-container').style.display = device === 'neo' ? 'block' : 'none';
  updateDeviceSelect();
}

// Button listeners
document.querySelectorAll('.deck-btn').forEach(btn => {
  const idx = parseInt(btn.dataset.index);
  btn.onmousedown = () => send({ type: 'buttonDown', index: idx });
  btn.onmouseup = () => send({ type: 'buttonUp', index: idx });
});

document.getElementById('page-left').onclick = () => send({ type: 'pageLeft' });
document.getElementById('page-right').onclick = () => send({ type: 'pageRight' });

document.getElementById('status-btn').onclick = () => {
  if (!isConnected) {
    ws?.close();
    connect();
  }
};

document.getElementById('device-select').onchange = (e) => {
  switchDevice(e.target.value);
  send({ type: 'setDevice', device: e.target.value });
};

// Mode switching with app management
async function checkModeSwitch(mode) {
  try {
    const res = await fetch('http://127.0.0.1:3848/api/mode/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    return await res.json();
  } catch (e) {
    console.error('Failed to check mode:', e);
    return null;
  }
}

async function executeModeSwitch(mode) {
  try {
    const res = await fetch('http://127.0.0.1:3848/api/mode/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    return await res.json();
  } catch (e) {
    console.error('Failed to switch mode:', e);
    return null;
  }
}

function showModeDialog(check, mode, onConfirm) {
  const dialog = document.getElementById('mode-dialog');
  const content = document.getElementById('mode-dialog-content');
  
  let html = `<h3>Switch to ${mode} mode?</h3>`;
  
  if (check.needsStop.length > 0) {
    const running = check.needsStop.filter((_, i) => check.areStopRunning[i]);
    if (running.length > 0) {
      html += `<p>⚠️ Will quit: <strong>${running.join(', ')}</strong></p>`;
    }
  }
  
  if (check.needsStart && !check.isStartRunning) {
    html += `<p>▶️ Will start: <strong>${check.needsStart}</strong></p>`;
  }
  
  if (mode === 'standalone') {
    html += `<p>Kiro Deck will take direct control of your Stream Deck via USB.</p>`;
  } else if (mode === 'btt') {
    html += `<p>Config will be exported to BTT triggers.</p>`;
  } else if (mode === 'elgato') {
    html += `<p>Config will be exported as a Stream Deck profile.</p>`;
  }
  
  content.innerHTML = html;
  dialog.style.display = 'block';
  
  document.getElementById('mode-confirm').onclick = async () => {
    dialog.style.display = 'none';
    await onConfirm();
  };
  document.getElementById('mode-cancel').onclick = () => {
    dialog.style.display = 'none';
  };
}

// Settings panel
document.getElementById('settings-btn').onclick = () => {
  document.getElementById('settings-panel').style.display = 'block';
  loadConfig();
};

document.getElementById('settings-close').onclick = () => {
  document.getElementById('settings-panel').style.display = 'none';
};

document.getElementById('settings-form').onsubmit = async (e) => {
  e.preventDefault();
  const newConfig = getFormConfig();
  const oldMode = config?.mode || 'standalone';
  const newMode = newConfig.mode;
  
  // If mode changed, show confirmation dialog
  if (newMode !== oldMode) {
    const check = await checkModeSwitch(newMode);
    if (check) {
      showModeDialog(check, newMode, async () => {
        const result = await executeModeSwitch(newMode);
        if (result) {
          let msg = `Switched to ${newMode} mode.`;
          if (result.started) msg += ` Started ${result.started}.`;
          if (result.stopped?.length) msg += ` Stopped ${result.stopped.join(', ')}.`;
          if (result.exportPath) msg += ` Exported to ${result.exportPath}`;
          alert(msg);
        }
        document.getElementById('settings-panel').style.display = 'none';
      });
      return;
    }
  }
  
  // No mode change, just save config
  if (await saveConfig(newConfig)) {
    document.getElementById('settings-panel').style.display = 'none';
    if (newConfig.device.type !== currentDevice) {
      switchDevice(newConfig.device.type);
      send({ type: 'setDevice', device: newConfig.device.type });
    }
  }
};

document.getElementById('export-btn').onclick = () => {
  if (!config) return;
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kiro-deck-config.json';
  a.click();
  URL.revokeObjectURL(url);
};

updateDeviceSelect();
loadConfig();
connect();
