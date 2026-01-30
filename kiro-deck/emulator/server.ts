import { WebSocketServer, WebSocket } from 'ws';

const PORT = 3847;

export class EmulatorServer {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();
  onButtonDown?: (index: number) => void;
  onButtonUp?: (index: number) => void;
  onPageLeft?: () => void;
  onPageRight?: () => void;
  onClientConnect?: (send: (msg: object) => void) => void;

  constructor() {
    this.wss = new WebSocketServer({ port: PORT });
    console.log(`[Emulator] Server on ws://localhost:${PORT}`);

    this.wss.on('connection', (ws) => {
      console.log('[Emulator] Client connected');
      this.clients.add(ws);

      // Notify main app to send current state
      this.onClientConnect?.((msg) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
      });

      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'buttonDown') this.onButtonDown?.(msg.index);
        else if (msg.type === 'buttonUp') this.onButtonUp?.(msg.index);
        else if (msg.type === 'pageLeft') this.onPageLeft?.();
        else if (msg.type === 'pageRight') this.onPageRight?.();
      });

      ws.on('close', () => this.clients.delete(ws));
    });
  }

  sendButtonImage(index: number, base64: string) {
    this.broadcast({ type: 'buttonImage', index, data: base64 });
  }

  sendInfoBar(base64: string) {
    this.broadcast({ type: 'infoBar', data: base64 });
  }

  private broadcast(msg: object) {
    const data = JSON.stringify(msg);
    this.clients.forEach((c) => c.readyState === WebSocket.OPEN && c.send(data));
  }
}
