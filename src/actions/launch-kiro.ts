import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

@action({ UUID: "wtf.sauhsoj.streamdecker.launch-kiro-cli" })
export class LaunchKiroCliAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    try {
      await execAsync(`osascript -e '
        tell application "iTerm"
          activate
          tell current window
            create tab with default profile
            tell current session
              write text "kiro-cli chat"
            end tell
          end tell
        end tell
      '`);
    } catch (err) {
      streamDeck.logger.error(`Failed to launch kiro-cli: ${err}`);
      await ev.action.showAlert();
    }
  }
}
