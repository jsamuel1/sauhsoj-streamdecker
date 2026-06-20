import streamDeck, {
  action,
  DidReceiveSettingsEvent,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
} from "@elgato/streamdeck";
import { readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { getTerminalBackend } from "../terminal/factory.js";

const RECENT_FILE = join(homedir(), ".kiro", "streamdeck-recent-folders.json");

@action({ UUID: "wtf.sauhsoj.streamdecker.launch-kiro-folder" })
export class LaunchKiroFolderAction extends SingletonAction {
  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    const settings = ev.payload.settings as { folder?: string };
    if (settings.folder) {
      const name = settings.folder.split("/").pop() || settings.folder;
      await ev.action.setTitle(name);
    }
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent): Promise<void> {
    const settings = ev.payload.settings as { folder?: string };
    if (settings.folder) {
      const name = settings.folder.split("/").pop() || settings.folder;
      await ev.action.setTitle(name);
    }
  }

  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    const settings = ev.payload.settings as { folder?: string };
    const folder = settings.folder;

    if (!folder) {
      await ev.action.showAlert();
      return;
    }

    try {
      const backend = await getTerminalBackend();
      await backend.openTab(`cd "${folder}" && kiro-cli chat`);

      // Update recent folders
      await this.addToRecent(folder);
    } catch (err) {
      streamDeck.logger.error(`Failed to launch kiro-cli: ${err}`);
      await ev.action.showAlert();
    }
  }

  private async addToRecent(folder: string): Promise<void> {
    try {
      let recent: string[] = [];
      try {
        const data = await readFile(RECENT_FILE, "utf-8");
        recent = JSON.parse(data);
      } catch {
        // File doesn't exist yet
      }

      // Add to front, remove duplicates, keep max 10
      recent = [folder, ...recent.filter((f) => f !== folder)].slice(0, 10);
      await writeFile(RECENT_FILE, JSON.stringify(recent, null, 2));
    } catch (err) {
      streamDeck.logger.error(`Failed to update recent folders: ${err}`);
    }
  }

  static async getRecentFolders(): Promise<string[]> {
    try {
      const data = await readFile(RECENT_FILE, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
}
