const WS_URL = 'ws://localhost:3847';
let ws = null;
let currentDevice = 'neo';

// Mini layout mapping (README): Top: Yes, No, Trust | Bottom: Focus, Cycle, Launch
// Mini indices: top row 4,5,6 | bottom row 0,1,3
const miniIndexMap = { 0: 4, 1: 5, 2: 6, 3: 0, 4: 1, 5: 3 };

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
    }
  };
}

function send(msg) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function switchDevice(device) {
  currentDevice = device;
  document.getElementById('neo-layout').style.display = device === 'neo' ? 'flex' : 'none';
  document.getElementById('mini-layout').style.display = device === 'mini' ? 'flex' : 'none';
  document.getElementById('info-bar-container').style.display = device === 'neo' ? 'block' : 'none';
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
document.getElementById('device-select').onchange = (e) => switchDevice(e.target.value);

connect();
