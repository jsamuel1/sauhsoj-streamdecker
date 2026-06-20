import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { getTerminalBackend } from "../terminal/factory.js";

@action({ UUID: "wtf.sauhsoj.streamdecker.send-yes" })
export class SendYesAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    try {
      const backend = await getTerminalBackend();
      if (!(await backend.checkPermission())) {
        await ev.action.showAlert();
        return;
      }
      await backend.send("y");
    } catch (err) {
      streamDeck.logger.error(`SendYes failed: ${err}`);
      await ev.action.showAlert();
    }
  }
}
