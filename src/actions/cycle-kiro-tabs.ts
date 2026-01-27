import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

@action({ UUID: "wtf.sauhsoj.streamdecker.cycle-kiro-tabs" })
export class CycleKiroTabsAction extends SingletonAction {
  override async onKeyDown(_ev: KeyDownEvent): Promise<void> {
    try {
      await execAsync(`osascript -e '
        tell application "iTerm"
          activate
          tell current window
            set currentIdx to 0
            set tabCount to count of tabs
            set foundKiro to false
            
            -- Find current tab index
            repeat with i from 1 to tabCount
              if item i of tabs is current tab then
                set currentIdx to i
                exit repeat
              end if
            end repeat
            
            -- Find next kiro-cli tab
            repeat with offset from 1 to tabCount
              set nextIdx to ((currentIdx + offset - 1) mod tabCount) + 1
              tell current session of tab nextIdx
                if name contains "kiro-cli" then
                  select tab nextIdx
                  set foundKiro to true
                  exit repeat
                end if
              end tell
            end repeat
          end tell
        end tell
      '`);
    } catch (err) {
      streamDeck.logger.error(`Failed to cycle tabs: ${err}`);
    }
  }
}
