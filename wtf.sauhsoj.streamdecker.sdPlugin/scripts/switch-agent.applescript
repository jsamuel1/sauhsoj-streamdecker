#!/usr/bin/osascript
-- Switch Agent: Run picker and send agent switch command to iTerm

set pickerScript to "/Users/sauhsoj/src/personal/sauhsoj-streamdecker/wtf.sauhsoj.streamdecker.sdPlugin/scripts/switch-agent-picker.sh"

try
	set selectedAgent to do shell script "/bin/zsh -l -c '" & pickerScript & "'"
	if selectedAgent is not "" then
		tell application "iTerm"
			activate
			tell current session of current window
				write text "/agent switch " & selectedAgent
			end tell
		end tell
		return "switched to: " & selectedAgent
	end if
on error errMsg
	return "error: " & errMsg
end try
