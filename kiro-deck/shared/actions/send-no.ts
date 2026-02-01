import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { exec } from "child_process";
import { promisify } from "util";
import { SCRIPTS_DIR, checkiTermPermission } from "../kiro-utils.js";

const execAsync = promisify(exec);

@action({ UUID: "wtf.sauhsoj.streamdecker.send-no" })
export class SendNoAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    if (!(await checkiTermPermission())) {
      await ev.action.showAlert();
      return;
    }

    try {
      await execAsync(`osascript "${SCRIPTS_DIR}/send-keystroke.applescript" "n"`);
    } catch (err) {
      streamDeck.logger.error(`SendNo failed: ${err}`);
      await ev.action.showAlert();
    }
  }
}
