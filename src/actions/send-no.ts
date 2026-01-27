import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { focusTerminal, sendKeystroke } from "../kiro-utils.js";

@action({ UUID: "wtf.sauhsoj.streamdecker.send-no" })
export class SendNoAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    try {
      await focusTerminal();
      await sendKeystroke("n");
    } catch (err) {
      streamDeck.logger.error(`Failed to send no: ${err}`);
      await ev.action.showAlert();
    }
  }
}
