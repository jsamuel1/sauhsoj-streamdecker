tell application "iTerm"
	activate
	tell current session of current window
		write text "y" without newline
	end tell
end tell
