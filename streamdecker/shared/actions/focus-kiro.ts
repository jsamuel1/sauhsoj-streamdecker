import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { getTerminalBackend } from "../terminal/factory.js";

@action({ UUID: "wtf.sauhsoj.streamdecker.focus-kiro" })
export class FocusKiroAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    try {
      const backend = await getTerminalBackend();
      if (!(await backend.checkPermission())) {
        await ev.action.showAlert();
        return;
      }
      if ((await backend.focus()) === "none") {
        await ev.action.showAlert();
      }
    } catch (err) {
      streamDeck.logger.error(`FocusKiro failed: ${err}`);
      await ev.action.showAlert();
    }
  }
}
