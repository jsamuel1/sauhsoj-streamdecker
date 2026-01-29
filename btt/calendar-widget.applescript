#!/usr/bin/osascript
-- Calendar widget for BTT Stream Deck Neo LCD
-- Returns JSON with text and background color based on urgency

set now to current date
set twoHoursLater to now + (2 * 60 * 60)

tell application "Calendar"
  set allCals to calendars
  set nextEvent to missing value
  set nextStart to twoHoursLater
  
  repeat with cal in allCals
    set upcomingEvents to (events of cal whose start date ≥ now and start date < twoHoursLater)
    repeat with evt in upcomingEvents
      set evtStart to start date of evt
      if evtStart < nextStart then
        set nextStart to evtStart
        set nextEvent to evt
      end if
    end repeat
  end repeat
  
  if nextEvent is not missing value then
    set evtTitle to summary of nextEvent
    set minsUntil to round ((nextStart - now) / 60)
    
    -- Color based on urgency
    if minsUntil < 5 then
      set bgColor to "200,50,50,255"
    else if minsUntil < 15 then
      set bgColor to "200,150,50,255"
    else
      set bgColor to "50,150,50,255"
    end if
    
    -- Truncate title if too long
    if length of evtTitle > 25 then
      set evtTitle to text 1 thru 22 of evtTitle & "..."
    end if
    
    return "{\"text\": \"" & evtTitle & " (" & minsUntil & "m)\", \"BTTStreamDeckBackgroundColor\": \"" & bgColor & "\"}"
  end if
end tell

return "{\"text\": \"No events\", \"BTTStreamDeckBackgroundColor\": \"50,50,50,255\"}"
