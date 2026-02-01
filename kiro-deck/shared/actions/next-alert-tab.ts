import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { exec } from "child_process";
import { promisify } from "util";
import { SCRIPTS_DIR, checkiTermPermission } from "../kiro-utils.js";

const execAsync = promisify(exec);

@action({ UUID: "wtf.sauhsoj.streamdecker.next-alert-tab" })
export class NextAlertTabAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    if (!(await checkiTermPermission())) {
      streamDeck.logger.error(
        "No iTerm automation permission - check System Settings > Privacy > Automation"
      );
      await ev.action.showAlert();
      return;
    }

    try {
      const result = await execAsync(`osascript "${SCRIPTS_DIR}/next-alert-tab.applescript"`);
      streamDeck.logger.info(`NextAlertTab result: ${result.stdout.trim()}`);

      if (result.stdout.trim() === "none") {
        await ev.action.showAlert();
      }
    } catch (err) {
      streamDeck.logger.error(`NextAlertTab failed: ${err}`);
      await ev.action.showAlert();
    }
  }
}
