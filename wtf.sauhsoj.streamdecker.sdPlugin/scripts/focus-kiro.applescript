#!/usr/bin/osascript
-- Focus Kiro: Activate iTerm and focus first tab containing 'kiro-cli'

tell application "iTerm"
  activate
  tell current window
    set tabCount to count of tabs
    repeat with i from 1 to tabCount
      set theSession to current session of tab i
      set tabName to name of theSession
      if tabName contains "kiro-cli" then
        select tab i
        return "found"
      end if
    end repeat
  end tell
  return "none"
end tell
