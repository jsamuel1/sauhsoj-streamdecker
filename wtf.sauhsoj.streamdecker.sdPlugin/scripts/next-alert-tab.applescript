#!/usr/bin/osascript
-- Next Alert Tab: Find next kiro-cli tab that is idle (not processing)

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
        set n to name of theSession
        set p to is processing of theSession
        if n contains "kiro-cli" and p is false then
          select tab checkIdx
          return "found"
        end if
      end if
    end repeat
  end tell
  return "none"
end tell
