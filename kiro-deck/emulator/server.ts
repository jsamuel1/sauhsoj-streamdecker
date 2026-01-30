import { WebSocketServer, WebSocket } from 'ws';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3847;
const HTTP_PORT = 3848;

export class EmulatorServer {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();
  onButtonDown?: (index: number) => void;
  onButtonUp?: (index: number) => void;
  onPageLeft?: () => void;
  onPageRight?: () => void;
  onClientConnect?: (send: (msg: object) => void) => void;
  onDeviceChange?: (device: 'neo' | 'mini') => void;
  private detectedDevice: 'neo' | 'mini' | null = null;

  constructor() {
    // WebSocket server
    this.wss = new WebSocketServer({ port: PORT, host: '127.0.0.1' });
    console.log(`[Emulator] WebSocket on ws://127.0.0.1:${PORT}`);

    // HTTP server for web UI
    this.startHttpServer();

    this.wss.on('connection', (ws) => {
      console.log('[Emulator] Client connected');
      this.clients.add(ws);

      if (this.detectedDevice) {
        ws.send(JSON.stringify({ type: 'detectedDevice', device: this.detectedDevice }));
      }

      this.onClientConnect?.((msg) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
      });

      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'buttonDown') this.onButtonDown?.(msg.index);
        else if (msg.type === 'buttonUp') this.onButtonUp?.(msg.index);
        else if (msg.type === 'pageLeft') this.onPageLeft?.();
        else if (msg.type === 'pageRight') this.onPageRight?.();
        else if (msg.type === 'setDevice') this.onDeviceChange?.(msg.device);
      });

      ws.on('close', () => this.clients.delete(ws));
    });
  }

  private startHttpServer() {
    Bun.serve({
      port: HTTP_PORT,
      hostname: '127.0.0.1',
      fetch(req) {
        const url = new URL(req.url);
        let path = url.pathname === '/' ? '/index.html' : url.pathname;
        const filePath = join(__dirname, path);
        
        try {
          const content = readFileSync(filePath);
          const ext = path.split('.').pop();
          const types: Record<string, string> = {
            html: 'text/html',
            css: 'text/css',
            js: 'application/javascript',
          };
          return new Response(content, {
            headers: { 'Content-Type': types[ext || 'html'] || 'text/plain' },
          });
        } catch {
          return new Response('Not found', { status: 404 });
        }
      },
    });
    console.log(`[Emulator] HTTP on http://127.0.0.1:${HTTP_PORT}`);
  }

  setDetectedDevice(device: 'neo' | 'mini') {
    this.detectedDevice = device;
    this.broadcast({ type: 'detectedDevice', device });
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
