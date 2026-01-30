const WS_URL = 'ws://127.0.0.1:3847';
let ws = null;
let currentDevice = 'neo';
let detectedDevice = null;

function connect() {
  ws = new WebSocket(WS_URL);
  
  ws.onopen = () => {
    document.getElementById('status-dot').className = 'dot connected';
    document.getElementById('status-text').textContent = 'Connected';
  };
  
  ws.onclose = () => {
    document.getElementById('status-dot').className = 'dot disconnected';
    document.getElementById('status-text').textContent = 'Disconnected';
    setTimeout(connect, 2000);
  };
  
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'buttonImage') {
      // Update Neo button
      const img = document.getElementById(`btn-${msg.index}`);
      if (img) {
        img.src = `data:image/png;base64,${msg.data}`;
        img.classList.add('loaded');
      }
      // Update Mini button if it uses this index
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
    }
  };
}

function send(msg) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
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

function switchDevice(device) {
  currentDevice = device;
  document.getElementById('neo-layout').style.display = device === 'neo' ? 'flex' : 'none';
  document.getElementById('mini-layout').style.display = device === 'mini' ? 'flex' : 'none';
  document.getElementById('info-bar-container').style.display = device === 'neo' ? 'block' : 'none';
  updateDeviceSelect();
}

// Setup button listeners for both layouts
document.querySelectorAll('.deck-btn').forEach(btn => {
  const idx = parseInt(btn.dataset.index);
  btn.onmousedown = () => send({ type: 'buttonDown', index: idx });
  btn.onmouseup = () => send({ type: 'buttonUp', index: idx });
});

document.getElementById('page-left').onclick = () => send({ type: 'pageLeft' });
document.getElementById('page-right').onclick = () => send({ type: 'pageRight' });
document.getElementById('reconnect').onclick = () => { ws?.close(); connect(); };
document.getElementById('device-select').onchange = (e) => {
  switchDevice(e.target.value);
  send({ type: 'setDevice', device: e.target.value });
};

updateDeviceSelect();
connect();
