#!/usr/bin/osascript
-- Cycle Kiro Tabs: Cycle through iTerm tabs containing 'kiro-cli' in their name

tell application "iTerm"
  activate
  tell current window
    set tabCount to count of tabs
    set currentIdx to 0
    
    repeat with i from 1 to tabCount
      if tab i is current tab then
        set currentIdx to i
        exit repeat
      end if
    end repeat
    
    repeat with i from 1 to tabCount
      set checkIdx to ((currentIdx + i - 1) mod tabCount) + 1
      if checkIdx is not currentIdx then
        set theSession to current session of tab checkIdx
        set tabName to name of theSession
        if tabName contains "kiro-cli" then
          select tab checkIdx
          return "found"
        end if
      end if
    end repeat
  end tell
  return "none"
end tell
