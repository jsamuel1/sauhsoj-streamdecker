#!/usr/bin/osascript
-- Get next calendar event within 2 hours
-- Returns: "EVENT_TITLE|MINUTES_UNTIL" or "none"

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
    return evtTitle & "|" & minsUntil
  end if
end tell

return "none"
