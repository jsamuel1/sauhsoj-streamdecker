import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { getTerminalBackend } from "../terminal/factory.js";

@action({ UUID: "wtf.sauhsoj.streamdecker.next-alert-tab" })
export class NextAlertTabAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    try {
      const backend = await getTerminalBackend();
      if (!(await backend.checkPermission())) {
        await ev.action.showAlert();
        return;
      }
      const result = await backend.nextAlertTab();
      streamDeck.logger.info(`NextAlertTab result: ${result}`);
      if (result === "none") {
        await ev.action.showAlert();
      }
    } catch (err) {
      streamDeck.logger.error(`NextAlertTab failed: ${err}`);
      await ev.action.showAlert();
    }
  }
}
