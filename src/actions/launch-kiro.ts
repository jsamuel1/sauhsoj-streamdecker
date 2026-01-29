import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { exec } from "child_process";
import { promisify } from "util";
import { SCRIPTS_DIR } from "../kiro-utils.js";

const execAsync = promisify(exec);

@action({ UUID: "wtf.sauhsoj.streamdecker.launch-kiro-cli" })
export class LaunchKiroCliAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    try {
      await execAsync(`osascript "${SCRIPTS_DIR}/launch-kiro.applescript"`);
    } catch (err) {
      streamDeck.logger.error(`LaunchKiroCli failed: ${err}`);
      await ev.action.showAlert();
    }
  }
}
