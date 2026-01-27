import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

@action({ UUID: "wtf.sauhsoj.streamdecker.next-alert-tab" })
export class NextAlertTabAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    try {
      const result = await execAsync(`osascript -e '
        tell application "iTerm"
          activate
          tell current window
            set currentIdx to 0
            set tabCount to count of tabs
            
            -- Find current tab index
            repeat with i from 1 to tabCount
              if item i of tabs is current tab then
                set currentIdx to i
                exit repeat
              end if
            end repeat
            
            -- Find next kiro-cli tab with alert (is processing = true means waiting)
            repeat with offset from 1 to tabCount
              set nextIdx to ((currentIdx + offset - 1) mod tabCount) + 1
              tell current session of tab nextIdx
                if name contains "kiro-cli" and is processing then
                  select tab nextIdx
                  return "found"
                end if
              end tell
            end repeat
            return "none"
          end tell
        end tell
      '`);

      if (result.stdout.trim() === "none") {
        await ev.action.showAlert();
      }
    } catch (err) {
      streamDeck.logger.error(`Failed to find alert tab: ${err}`);
      await ev.action.showAlert();
    }
  }
}
