tell application "iTerm"
	activate
	tell current session of current window
		write text "n" without newline
	end tell
end tell
