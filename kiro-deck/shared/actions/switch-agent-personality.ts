import streamDeck, {
  action,
  DidReceiveSettingsEvent,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
} from "@elgato/streamdeck";
import { exec } from "child_process";
import { promisify } from "util";
import { readdir } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

const execAsync = promisify(exec);

@action({ UUID: "wtf.sauhsoj.streamdecker.switch-agent-personality" })
export class SwitchAgentPersonalityAction extends SingletonAction {
  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    const settings = ev.payload.settings as { agentFile?: string };
    if (settings.agentFile) {
      const name = this.extractAgentName(settings.agentFile);
      await ev.action.setTitle(name);
    }
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent): Promise<void> {
    const settings = ev.payload.settings as { agentFile?: string };
    if (settings.agentFile) {
      const name = this.extractAgentName(settings.agentFile);
      await ev.action.setTitle(name);
    }
  }

  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    const settings = ev.payload.settings as { agentFile?: string };
    const agentFile = settings.agentFile;

    if (!agentFile) {
      await ev.action.showAlert();
      return;
    }

    const agentName = this.extractAgentName(agentFile);

    try {
      await execAsync(`osascript -e '
        tell application "iTerm"
          activate
          tell current session of current window
            write text "/agent switch ${agentName}"
          end tell
        end tell
      '`);
    } catch (err) {
      streamDeck.logger.error(`Failed to switch agent: ${err}`);
      await ev.action.showAlert();
    }
  }

  private extractAgentName(filename: string): string {
    // Extract the part after the last hyphen, or use the whole name
    const base = filename.replace(".json", "");
    const parts = base.split("-");
    return parts[parts.length - 1];
  }

  static async getAvailableAgents(): Promise<string[]> {
    const agentsDir = join(homedir(), ".kiro", "agents");
    try {
      const files = await readdir(agentsDir);
      return files.filter(
        (f) => f.endsWith(".json") && !f.includes("example") && !f.includes(".bak")
      );
    } catch {
      return [];
    }
  }
}
