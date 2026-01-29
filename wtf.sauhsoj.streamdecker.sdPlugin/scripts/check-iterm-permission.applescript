#!/usr/bin/osascript
-- Check if we have permission to control iTerm
-- Returns "ok" if permitted, triggers permission dialog if not

try
  tell application "iTerm"
    set testVar to name of current window
  end tell
  return "ok"
on error errMsg
  return "denied: " & errMsg
end try
