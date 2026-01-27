import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { focusTerminal } from "../kiro-utils.js";

@action({ UUID: "wtf.sauhsoj.streamdecker.focus-kiro" })
export class FocusKiroAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    try {
      await focusTerminal();
    } catch (err) {
      streamDeck.logger.error(`Failed to focus terminal: ${err}`);
      await ev.action.showAlert();
    }
  }
}
