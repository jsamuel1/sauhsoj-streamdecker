#!/usr/bin/osascript
-- Send Keystroke: Send a key to iTerm
-- Usage: osascript send-keystroke.applescript "y"

on run argv
  set keyToSend to item 1 of argv
  
  tell application "iTerm"
    activate
  end tell
  
  delay 0.1
  
  tell application "System Events"
    keystroke keyToSend
  end tell
  
  return "ok"
end run
