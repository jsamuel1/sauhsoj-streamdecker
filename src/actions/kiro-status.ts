import { action, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface KiroStatus {
  contextPercent: number | null;
  agent: string | null;
  path: string;
  waiting: boolean;
}

@action({ UUID: "wtf.sauhsoj.streamdecker.kiro-status" })
export class KiroStatusAction extends SingletonAction {
  private intervalId: NodeJS.Timeout | null = null;

  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    // Update immediately and then every 2 seconds
    await this.updateStatus(ev);
    this.intervalId = setInterval(() => this.updateStatus(ev), 2000);
  }

  override async onWillDisappear(_ev: WillDisappearEvent): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async updateStatus(ev: WillAppearEvent): Promise<void> {
    try {
      const status = await this.getCurrentKiroStatus();
      if (status) {
        const title = status.contextPercent !== null 
          ? `${status.contextPercent}%\n${status.agent || "?"}`
          : status.agent || "kiro";
        await ev.action.setTitle(title);
      } else {
        await ev.action.setTitle("—");
      }
    } catch {
      await ev.action.setTitle("—");
    }
  }

  private async getCurrentKiroStatus(): Promise<KiroStatus | null> {
    try {
      const result = await execAsync(`osascript -e '
        tell application "iTerm"
          if (count of windows) = 0 then return ""
          tell current session of current window
            return name
          end tell
        end tell
      '`);

      const name = result.stdout.trim();
      if (!name || !name.includes("kiro-cli")) return null;

      return this.parseTitle(name);
    } catch {
      return null;
    }
  }

  private parseTitle(title: string): KiroStatus {
    // Format: "kiro-cli [42%] default — ~/src/personal"
    // Or old format: "kiro-cli — ~/src/personal"
    const status: KiroStatus = {
      contextPercent: null,
      agent: null,
      path: "",
      waiting: false,
    };

    // Extract context %
    const pctMatch = title.match(/\[(\d+)%\]/);
    if (pctMatch) {
      status.contextPercent = parseInt(pctMatch[1], 10);
    }

    // Extract agent name (between ] and —)
    const agentMatch = title.match(/\]\s*(\w+)\s*—/);
    if (agentMatch) {
      status.agent = agentMatch[1];
    }

    // Extract path (after —)
    const pathMatch = title.match(/—\s*(.+)$/);
    if (pathMatch) {
      status.path = pathMatch[1].trim();
    }

    return status;
  }
}
