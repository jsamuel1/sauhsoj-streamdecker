import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { focusTerminal, sendKeystroke } from "../kiro-utils.js";

@action({ UUID: "wtf.sauhsoj.streamdecker.send-thinking" })
export class SendThinkingAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    try {
      await focusTerminal();
      await sendKeystroke("t");
    } catch (err) {
      streamDeck.logger.error(`Failed to send thinking: ${err}`);
      await ev.action.showAlert();
    }
  }
}
