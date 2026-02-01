export interface InfoBarSource {
  name: string;
  getData(): Promise<{ text: string; color?: string }>;
}

export class KiroStatusSource implements InfoBarSource {
  name = 'kiro';
  async getData() {
    // TODO: Parse iTerm tab for agent/context %
    return { text: 'Kiro: Ready', color: '#9046ff' };
  }
}

export class CalendarSource implements InfoBarSource {
  name = 'calendar';
  async getData() {
    // TODO: Query macOS Calendar
    const now = new Date();
    const next = new Date(now.getTime() + 3600000);
    const time = next.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return { text: `Next: ${time}`, color: '#8dc8fb' };
  }
}

export const sources: InfoBarSource[] = [new KiroStatusSource(), new CalendarSource()];
