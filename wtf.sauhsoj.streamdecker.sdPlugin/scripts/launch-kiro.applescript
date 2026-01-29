#!/usr/bin/osascript
-- Launch Kiro: Open new iTerm tab with folder picker + kiro-cli chat

set cmd to "/bin/zsh -l /Users/sauhsoj/src/personal/sauhsoj-streamdecker/wtf.sauhsoj.streamdecker.sdPlugin/scripts/launch-kiro-picker.sh"

tell application "iTerm"
  activate
  if (count of windows) = 0 then
    create window with default profile command cmd
  else
    tell current window
      create tab with default profile command cmd
    end tell
  end if
end tell
return "ok"
