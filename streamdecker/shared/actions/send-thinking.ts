import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { getTerminalBackend } from "../terminal/factory.js";

@action({ UUID: "wtf.sauhsoj.streamdecker.send-thinking" })
export class SendThinkingAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    try {
      const backend = await getTerminalBackend();
      if (!(await backend.checkPermission())) {
        await ev.action.showAlert();
        return;
      }
      await backend.send("t");
    } catch (err) {
      streamDeck.logger.error(`SendThinking failed: ${err}`);
      await ev.action.showAlert();
    }
  }
}
