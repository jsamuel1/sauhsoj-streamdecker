#!/bin/zsh
# launch-kiro-picker.sh - Interactive project folder picker using fzf

FZF_BIN="${FZF_BIN:-$(command -v fzf)}"
KIRO_CLI="${KIRO_CLI:-$(command -v kiro-cli)}"
RECENT_DIRS_FILE="${HOME}/.kiro/kiro-picker-recent-dirs"
FAVORITES_FILE="${HOME}/.kiro/kiro-picker-favorites"
MAX_RECENT=20

get_dirs() {
    [[ -f "$FAVORITES_FILE" ]] && while IFS= read -r dir; do
        [[ -d "$dir" ]] && echo "$dir"
    done < "$FAVORITES_FILE"
    
    [[ -f "$RECENT_DIRS_FILE" ]] && while IFS= read -r dir; do
        [[ -d "$dir" ]] && echo "$dir"
    done < "$RECENT_DIRS_FILE"
    
    [[ -f "${HOME}/.z" ]] && while IFS='|' read -r dir freq time; do
        [[ -d "$dir" ]] && echo "$dir"
    done < <(sort -t'|' -k2 -nr "${HOME}/.z" | head -n "$MAX_RECENT")
    
    for base in "${HOME}/src" "${HOME}/src/personal" "${HOME}/projects"; do
        [[ -d "$base" ]] && find "$base" -maxdepth 2 -type d ! -path '*/.*' 2>/dev/null
    done
}

save_recent() {
    mkdir -p "$(dirname "$RECENT_DIRS_FILE")"
    { echo "$1"; [[ -f "$RECENT_DIRS_FILE" ]] && grep -v "^${1}$" "$RECENT_DIRS_FILE" || true; } | head -n "$MAX_RECENT" > "${RECENT_DIRS_FILE}.tmp"
    mv "${RECENT_DIRS_FILE}.tmp" "$RECENT_DIRS_FILE"
}

selected=$(get_dirs | awk '!seen[$0]++' | "$FZF_BIN" \
    --height=40% --reverse --border \
    --prompt="Select project folder: " \
    --preview='ls -la {}' \
    --preview-window=right:50%:wrap \
    --header='Navigate with arrows, search by typing, Enter to select')

if [[ -n "$selected" && -d "$selected" ]]; then
    save_recent "$selected"
    cd "$selected"
    echo "Changed to: $selected"
    exec "$KIRO_CLI" chat
fi
