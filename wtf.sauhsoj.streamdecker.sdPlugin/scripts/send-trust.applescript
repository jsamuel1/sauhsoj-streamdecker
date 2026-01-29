tell application "iTerm"
	activate
	tell current session of current window
		write text "t" without newline
	end tell
end tell
