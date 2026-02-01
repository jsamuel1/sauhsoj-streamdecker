import streamDeck, {
  action,
  DidReceiveSettingsEvent,
  KeyDownEvent,
  SingletonAction,
} from "@elgato/streamdeck";
import { focusTerminal, sendCommand } from "../kiro-utils.js";

@action({ UUID: "wtf.sauhsoj.streamdecker.switch-agent" })
export class SwitchAgentAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    const settings = ev.payload.settings as { agentName?: string };
    const agentName = settings.agentName || "default";

    try {
      await focusTerminal();
      await sendCommand(`/agent switch ${agentName}`);
    } catch (err) {
      streamDeck.logger.error(`Failed to switch agent: ${err}`);
      await ev.action.showAlert();
    }
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent): Promise<void> {
    const settings = ev.payload.settings as { agentName?: string };
    const agentName = settings.agentName || "default";
    await ev.action.setTitle(agentName);
  }
}
