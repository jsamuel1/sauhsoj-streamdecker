import streamDeck, {
  action,
  DidReceiveSettingsEvent,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
} from "@elgato/streamdeck";
import { getTarget, type TargetId } from "../targets.js";
import { focusTarget } from "./target-dispatch.js";
import { targetIconDataUrl } from "./target-image.js";

interface Settings {
  target?: TargetId;
}

@action({ UUID: "wtf.sauhsoj.streamdecker.focus-target" })
export class FocusTargetAction extends SingletonAction {
  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    await this.applyImage(ev);
  }
  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent): Promise<void> {
    await this.applyImage(ev);
  }
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    const { target } = ev.payload.settings as Settings;
    if (!target || !getTarget(target)) {
      await ev.action.showAlert();
      return;
    }
    try {
      await focusTarget(target);
    } catch (err) {
      streamDeck.logger.error(`FocusTarget failed: ${err}`);
      await ev.action.showAlert();
    }
  }

  private async applyImage(ev: WillAppearEvent | DidReceiveSettingsEvent): Promise<void> {
    const { target } = ev.payload.settings as Settings;
    const t = target ? getTarget(target) : undefined;
    if (!t) return;
    const url = targetIconDataUrl(t.focusIcon);
    if (url) await ev.action.setImage(url);
    else await ev.action.setTitle(t.label);
  }
}
