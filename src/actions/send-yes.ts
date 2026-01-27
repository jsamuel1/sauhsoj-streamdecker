import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { focusTerminal, sendKeystroke } from "../kiro-utils.js";

@action({ UUID: "wtf.sauhsoj.streamdecker.send-yes" })
export class SendYesAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    try {
      await focusTerminal();
      await sendKeystroke("y");
    } catch (err) {
      streamDeck.logger.error(`Failed to send yes: ${err}`);
      await ev.action.showAlert();
    }
  }
}
