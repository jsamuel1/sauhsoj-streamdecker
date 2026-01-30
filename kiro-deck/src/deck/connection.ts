import { EventEmitter } from 'events';
import { openStreamDeck, listStreamDecks, type StreamDeck } from '@elgato-stream-deck/node';

export class DeckConnection extends EventEmitter {
  private device: StreamDeck | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isClosing = false;

  readonly BUTTON_SIZE = 96;
  readonly INFO_BAR_WIDTH = 248;
  readonly INFO_BAR_HEIGHT = 58;

  async connect(): Promise<void> {
    if (this.device) return;

    try {
      const devices = await listStreamDecks();
      if (devices.length === 0) {
        console.log('[Deck] No Stream Deck found, waiting...');
        this.scheduleReconnect();
        return;
      }

      this.device = await openStreamDeck(devices[0].path);
      console.log(`[Deck] Connected: ${this.device.MODEL}`);
      await this.device.clearPanel();
      this.setupEventHandlers();
      this.emit('connected', { model: this.device.MODEL });
    } catch (error) {
      console.error('[Deck] Connection error:', error);
      if (!this.isClosing) this.scheduleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.device) return;

    this.device.on('down', (keyIndex) => {
      this.emit('buttonDown', keyIndex);
    });

    this.device.on('up', (keyIndex) => {
      this.emit('buttonUp', keyIndex);
    });

    // Neo page buttons are encoder press events
    this.device.on('encoderDown', (encoderIndex) => {
      if (encoderIndex === 0) this.emit('pageLeft');
      else this.emit('pageRight');
    });

    this.device.on('error', () => this.handleDisconnect());
  }

  private handleDisconnect(): void {
    console.log('[Deck] Disconnected');
    this.device?.removeAllListeners();
    this.device = null;
    this.emit('disconnected');
    if (!this.isClosing) this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  async setButtonImage(index: number, buffer: Buffer): Promise<void> {
    if (!this.device || index < 0 || index >= 8) return;
    try {
      await this.device.fillKeyBuffer(index, buffer);
    } catch (e) {
      console.error(`[Deck] Button ${index} error:`, e);
    }
  }

  async setInfoBar(buffer: Buffer): Promise<void> {
    if (!this.device) return;
    try {
      // Neo uses fillLcd() for the info bar strip
      await (this.device as any).fillLcd(buffer, { format: 'rgba' });
    } catch (e) {
      console.error('[Deck] Info bar error:', e);
    }
  }

  async close(): Promise<void> {
    this.isClosing = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.device) {
      await this.device.clearPanel();
      await this.device.close();
      this.device = null;
    }
  }

  get isConnected(): boolean {
    return this.device !== null;
  }
}

export const deckConnection = new DeckConnection();
