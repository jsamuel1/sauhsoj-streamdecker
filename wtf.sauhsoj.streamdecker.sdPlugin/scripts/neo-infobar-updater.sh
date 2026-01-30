#!/bin/zsh
# neo-infobar-updater.sh - Updates Stream Deck Neo info bar with calendar/tasks
# Run as: nohup ./neo-infobar-updater.sh &

BTT_SECRET="SharedSecret123"
NEO_UUID="42077772-7B31-495C-8A5D-4DA1FEA7DC76"
TASKS_FILE="$HOME/.kiro/infobar-tasks.txt"
POLL_INTERVAL=30

update_neo() {
    local text="$1"
    curl -sk "https://127.0.0.1:58280/update_stream_deck_widget/?shared_secret=$BTT_SECRET&uuid=$NEO_UUID&text=$(printf '%s' "$text" | jq -sRr @uri)" >/dev/null 2>&1
}

get_next_meeting() {
    # Get calendar events in next 2 hours using icalBuddy
    local now=$(date +%s)
    local two_hours=$((now + 7200))
    
    # Try icalBuddy first
    if command -v icalBuddy &>/dev/null; then
        local event=$(icalBuddy -n -nc -nrd -ea -df "" -tf "%H:%M" -li 1 eventsFrom:now to:"+2h" 2>/dev/null | head -1)
        if [[ -n "$event" ]]; then
            echo "$event"
            return 0
        fi
    fi
    return 1
}

get_current_meeting() {
    # Check if currently in a meeting
    if command -v icalBuddy &>/dev/null; then
        local event=$(icalBuddy -n -nc -nrd -ea -df "" -tf "%H:%M" -li 1 eventsNow 2>/dev/null | head -1)
        if [[ -n "$event" ]]; then
            echo "$event"
            return 0
        fi
    fi
    return 1
}

get_task() {
    # Rotate through tasks file
    if [[ -f "$TASKS_FILE" ]]; then
        local count=$(wc -l < "$TASKS_FILE" | tr -d ' ')
        if [[ $count -gt 0 ]]; then
            local idx=$((RANDOM % count + 1))
            sed -n "${idx}p" "$TASKS_FILE"
            return 0
        fi
    fi
    return 1
}

format_countdown() {
    local mins=$1
    if [[ $mins -lt 60 ]]; then
        echo "${mins}m"
    else
        echo "$((mins/60))h$((mins%60))m"
    fi
}

while true; do
    display=""
    
    # Priority 1: Currently in meeting - show countdown to end
    if current=$(get_current_meeting); then
        display="📅 $current"
    # Priority 2: Meeting in next 2 hours
    elif upcoming=$(get_next_meeting); then
        display="⏰ $upcoming"
    # Priority 3: Show task from file
    elif task=$(get_task); then
        display="📋 $task"
    else
        display="✨ Ready"
    fi
    
    update_neo "$display"
    sleep $POLL_INTERVAL
done
