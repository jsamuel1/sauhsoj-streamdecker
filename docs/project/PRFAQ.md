---
name: prfaq
description: Press Release and FAQ for Kiro Deck - the Stream Deck Neo controller app. Read when you need to understand the product vision, features, and user-facing functionality.
---

# Kiro Deck - PRFAQ

## Press Release

**Kiro Deck: A Smart Stream Deck Controller for AI-Powered Development**

*Sydney, Australia — January 2026*

Today we announce Kiro Deck, a lightweight macOS application that transforms the Elgato Stream Deck Neo into an intelligent companion for AI-assisted development workflows.

Kiro Deck automatically detects when you're working with Kiro CLI and presents context-aware buttons for common actions: accepting suggestions, cycling through options, switching agents, and launching new sessions. The info bar displays real-time information including your current agent, context window usage, upcoming calendar events, and task reminders.

"I wanted my Stream Deck to understand what I'm doing and adapt accordingly," said the developer. "When I'm in Kiro, I get Kiro controls. When I'm presenting, I get presentation controls. It just works."

Key features include:
- **Context-Aware Button Pages**: Automatically switches button layouts based on the active application
- **Dynamic Info Bar**: Shows agent status, calendar, notifications, or custom data sources
- **Agent Switching**: Use page buttons to quickly switch between Kiro agents
- **Menubar Configuration**: Easy access to settings, favorites, and recent items
- **Web Emulator**: Test and develop without hardware using a browser-based emulator
- **Auto-Updates**: Always running the latest version
- **Themed Icons**: AI-generated icons that match each application's visual identity

Kiro Deck is available now as a free download for macOS.

---

## FAQ

### General

**Q: What hardware does Kiro Deck support?**
A: Kiro Deck is designed for the Elgato Stream Deck Neo (8 buttons, 2 page buttons, 1 info bar). Future versions may support other Stream Deck models.

**Q: Does it replace the Elgato Stream Deck software?**
A: Yes. Kiro Deck communicates directly with the hardware via USB HID, bypassing Elgato's software entirely.

**Q: What about BetterTouchTool?**
A: Kiro Deck replaces BTT for Stream Deck control. BTT's Neo LCD support was limited; Kiro Deck has full control.

### Functionality

**Q: How does context detection work?**
A: Kiro Deck monitors the frontmost application and terminal content. When it detects Kiro CLI (or configured aliases), it activates the Kiro button page.

**Q: Can I create custom button pages?**
A: Yes. Button pages are defined in configuration files. You can create pages for any application or workflow.

**Q: What information can the info bar display?**
A: Built-in sources include: Kiro agent/context status (from iTerm), calendar events, macOS notifications, and task lists. Custom sources can be added via plugins.

**Q: How does agent switching work?**
A: When focused on a Kiro CLI tab, the page-left and page-right buttons send configurable keyboard shortcuts (e.g., Ctrl+[ and Ctrl+]) to switch agents.

### Configuration

**Q: Where are settings stored?**
A: Configuration is stored in `~/.config/streamdecker/` as JSON files.

**Q: Can I sync settings across machines?**
A: The config directory can be symlinked to a synced folder (iCloud, Dropbox, etc.).

**Q: How do I add favorite folders/agents?**
A: Via the menubar Configure window, or by editing `~/.config/streamdecker/favorites.json`.

### Technical

**Q: What runtime does it use?**
A: Bun for performance and native macOS integration.

**Q: How are icons generated?**
A: Base icons are generated using Amazon Nova Canvas via Bedrock. Application-specific icons extract colors from app icons and apply them to themed templates.

**Q: How does auto-update work?**
A: The app checks for updates on launch and periodically. Updates are downloaded and applied automatically on next restart.

**Q: Can I test without hardware?**
A: Yes. The web emulator provides a browser-based Stream Deck Neo that connects to the running app via WebSocket.

### Privacy & Security

**Q: Does it send data anywhere?**
A: Only for icon generation (Bedrock API) and update checks. No telemetry or usage data is collected.

**Q: What permissions does it need?**
A: Accessibility (for keyboard simulation), USB access (for Stream Deck), and optionally Calendar access.
