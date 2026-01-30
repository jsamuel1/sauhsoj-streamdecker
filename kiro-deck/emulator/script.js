const WS_URL = 'ws://127.0.0.1:3847';
let ws = null;
let currentDevice = 'neo';
let detectedDevice = null;
let isConnected = false;

const buttonLabels = ['Focus', 'Cycle', 'Alert', 'Launch', 'Yes', 'No', 'Trust', 'Agent'];
const buttonActions = ['kiro.focus', 'kiro.cycle', 'kiro.alert', 'kiro.launch', 'kiro.yes', 'kiro.no', 'kiro.thinking', 'kiro.agent'];

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

document.getElementById('edit-btn').onclick = () => {
  alert('Edit mode coming soon - will allow rearranging buttons and changing actions');
};

updateDeviceSelect();
connect();
