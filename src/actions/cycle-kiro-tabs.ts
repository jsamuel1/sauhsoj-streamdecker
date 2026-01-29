import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { exec } from "child_process";
import { promisify } from "util";
import { SCRIPTS_DIR, checkiTermPermission } from "../kiro-utils.js";

const execAsync = promisify(exec);

@action({ UUID: "wtf.sauhsoj.streamdecker.cycle-kiro-tabs" })
export class CycleKiroTabsAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    if (!(await checkiTermPermission())) {
      await ev.action.showAlert();
      return;
    }

    try {
      const result = await execAsync(`osascript "${SCRIPTS_DIR}/cycle-kiro-tabs.applescript"`);
      if (result.stdout.trim() === "none") {
        await ev.action.showAlert();
      }
    } catch (err) {
      streamDeck.logger.error(`CycleKiroTabs failed: ${err}`);
      await ev.action.showAlert();
    }
  }
}
