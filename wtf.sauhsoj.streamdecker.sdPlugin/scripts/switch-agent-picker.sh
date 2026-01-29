#!/bin/zsh
# switch-agent-picker.sh - Agent picker for kiro-cli using fzf

AGENTS_DIR="$HOME/.kiro/agents"
FZF_BIN="/Users/sauhsoj/.fzf/bin/fzf"
RECENT_FILE="$HOME/.kiro/kiro-picker-recent-agents"
MAX_RECENT=10

[[ ! -d "$AGENTS_DIR" ]] && { echo "Error: Agents directory not found" >&2; exit 1; }
[[ ! -x "$FZF_BIN" ]] && { echo "Error: fzf not found" >&2; exit 1; }

# Extract agent names from all JSON files
agent_names=()
for file in "$AGENTS_DIR"/*.json; do
    [[ -f "$file" ]] || continue
    [[ "$file" == *.bak ]] && continue
    name=$(jq -r '.name // empty' "$file" 2>/dev/null)
    [[ -n "$name" ]] && agent_names+=("$name")
done

[[ ${#agent_names[@]} -eq 0 ]] && { echo "Error: No agents found" >&2; exit 1; }

# Build list: recent first, then rest alphabetically
get_ordered_agents() {
    # Recent agents first
    [[ -f "$RECENT_FILE" ]] && cat "$RECENT_FILE"
    # Then all agents (duplicates removed by awk later)
    printf '%s\n' "${agent_names[@]}" | sort
}

selected=$(get_ordered_agents | awk '!seen[$0]++' | "$FZF_BIN" \
    --prompt="Select Agent: " \
    --height=40% --reverse --border \
    --header="Choose a kiro-cli agent to switch to")

if [[ -n "$selected" ]]; then
    # Save to recent
    mkdir -p "$(dirname "$RECENT_FILE")"
    { echo "$selected"; [[ -f "$RECENT_FILE" ]] && grep -v "^${selected}$" "$RECENT_FILE" || true; } | head -n "$MAX_RECENT" > "${RECENT_FILE}.tmp"
    mv "${RECENT_FILE}.tmp" "$RECENT_FILE"
    echo "$selected"
else
    exit 1
fi
