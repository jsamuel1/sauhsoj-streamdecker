import { WebSocketServer, WebSocket } from 'ws';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getConfig, updateConfig, checkModeSwitch, executeModeSwitch, getPluginStatus, installPlugin, type Config } from '../shared/config/index.js';
import { exportBttTriggers } from '../shared/exporters/btt.js';
import { exportElgatoProfile } from '../shared/exporters/elgato.js';

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
  onConfigChange?: (config: Config) => void;
  onModeSwitch?: (newMode: string, oldMode: string) => Promise<void>;
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
    const self = this;
    Bun.serve({
      port: HTTP_PORT,
      hostname: '127.0.0.1',
      async fetch(req) {
        const url = new URL(req.url);
        
        // API: Get config
        if (url.pathname === '/api/config' && req.method === 'GET') {
          return Response.json(getConfig());
        }
        
        // API: Update config
        if (url.pathname === '/api/config' && req.method === 'PUT') {
          try {
            const body = await req.json();
            const updated = updateConfig(body);
            self.onConfigChange?.(updated);
            self.broadcast({ type: 'configChanged', config: updated });
            return Response.json(updated);
          } catch (e) {
            return Response.json({ error: String(e) }, { status: 400 });
          }
        }
        
        // API: Check mode switch requirements
        if (url.pathname === '/api/mode/check' && req.method === 'POST') {
          try {
            const { mode } = await req.json();
            const check = await checkModeSwitch(mode);
            return Response.json(check);
          } catch (e) {
            return Response.json({ error: String(e) }, { status: 400 });
          }
        }
        
        // API: Execute mode switch (start/stop apps, export config)
        if (url.pathname === '/api/mode/switch' && req.method === 'POST') {
          try {
            const { mode, manageElgatoAutostart } = await req.json();
            const currentConfig = getConfig();
            const oldMode = currentConfig.mode;
            
            // Let app disconnect from device if switching away from standalone
            if (self.onModeSwitch) {
              await self.onModeSwitch(mode, oldMode);
            }
            
            // Execute app start/stop
            const result = await executeModeSwitch(mode, { manageElgatoAutostart });
            
            // Export config for the new mode
            let exportPath: string | null = null;
            if (mode === 'btt') {
              exportPath = exportBttTriggers();
            } else if (mode === 'elgato') {
              exportPath = exportElgatoProfile();
            }
            
            // Update config
            const updated = updateConfig({ mode });
            self.onConfigChange?.(updated);
            self.broadcast({ type: 'configChanged', config: updated });
            
            return Response.json({ ...result, exportPath, config: updated });
          } catch (e) {
            return Response.json({ error: String(e) }, { status: 400 });
          }
        }
        
        // API: Get plugin status
        if (url.pathname === '/api/plugin/status' && req.method === 'GET') {
          return Response.json(getPluginStatus());
        }
        
        // API: Install/update plugin
        if (url.pathname === '/api/plugin/install' && req.method === 'POST') {
          try {
            const result = await installPlugin();
            return Response.json(result);
          } catch (e) {
            return Response.json({ error: String(e) }, { status: 400 });
          }
        }
        
        // API: Import profile (opens the .streamDeckProfile file)
        if (url.pathname === '/api/profile/import' && req.method === 'POST') {
          try {
            const profilePath = exportElgatoProfile();
            if (profilePath) {
              const { exec } = await import('child_process');
              const { promisify } = await import('util');
              const execAsync = promisify(exec);
              await execAsync(`open "${profilePath}"`);
              return Response.json({ success: true, path: profilePath });
            }
            return Response.json({ error: 'Profile not found' }, { status: 404 });
          } catch (e) {
            return Response.json({ error: String(e) }, { status: 400 });
          }
        }
        
        // Static files
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
