---
name: requirements
description: Detailed functional requirements for Kiro Deck including hardware interface, context detection, button pages, info bar, icons, configuration, and system integration. Read when implementing features or understanding what needs to be built.
---

# Kiro Deck - Functional Requirements

## 1. Core Hardware Interface

### 1.1 Stream Deck Communication
- Connect to Stream Deck Neo via USB HID
- Handle device connect/disconnect events
- Support multiple devices (future)

### 1.2 Button Management
- Set button images (96x96 pixels, JPEG)
- Handle button press/release events
- Support button hold actions (future)

### 1.3 Page Buttons
- Handle page-left and page-right button events
- Context-aware behavior (agent switch vs page navigation)

### 1.4 Info Bar (LCD)
- Render images to info bar (248x58 pixels)
- Support text, icons, and progress indicators
- Configurable refresh rate

---

## 2. Context Detection

### 2.1 Application Detection
- Monitor frontmost application
- Detect application switches
- Map applications to button pages

### 2.2 Terminal Detection
- Detect iTerm2 as frontmost app
- Read current tab/pane title
- Parse for Kiro CLI indicators (configurable command names)

### 2.3 Kiro CLI Detection
- Detect when Kiro CLI is active
- Extract agent name from terminal
- Extract context window percentage (if displayed)

---

## 3. Button Pages

### 3.1 Page System
- Define pages as collections of 8 button definitions
- Support page inheritance/templates
- Hot-reload page definitions

### 3.2 Page Switching
- Manual switching via page buttons (when not in Kiro context)
- Automatic switching based on frontmost app
- Configurable switching rules

### 3.3 Default Pages
- **Kiro Page**: Focus, Cycle, Alert, Launch, Yes, No, Trust, Agent
- **Presentation Page**: Prev Slide, Next Slide, Blank, Focus App, Timer, Notes, End Show, Exit
- **Default Page**: Configurable fallback

### 3.4 Button Actions
- Keyboard shortcuts (with modifiers)
- AppleScript execution
- Shell command execution
- Application launch
- URL open
- Custom Bun functions

---

## 4. Info Bar Data Sources

### 4.1 Kiro Status
- Current agent name
- Context window percentage
- Session duration

### 4.2 Calendar
- Next event within N hours
- Current event (if in meeting)
- Countdown to event start/end

### 4.3 Notifications
- Recent macOS notifications
- Filtered by app (configurable)

### 4.4 Tasks
- Read from configurable task file
- Integration with task apps (future)

### 4.5 Custom Sources
- Plugin architecture for custom data
- Polling interval per source
- Priority/fallback chain

---

## 5. Icon Generation

### 5.1 Base Icon Generation
- Generate icons using Amazon Nova Canvas
- Consistent style: dark background, character-based
- Cache generated icons

### 5.2 Application Theming
- Extract dominant colors from app icons
- Apply color theme to base icons
- Generate action variants (pressed, disabled)

### 5.3 Icon Management
- Icon pack format (directory of PNGs)
- Multiple sizes (96x96, 144x144 for retina)
- Icon override system

---

## 6. Configuration

### 6.1 Settings Storage
- JSON configuration files
- Location: `~/.config/streamdecker/`
- Schema validation

### 6.2 Configurable Items
- Watched commands (kiro-cli aliases)
- Favorite folders
- Favorite agents
- MRU lists (folders, agents)
- Info bar sources and priority
- Button page definitions
- Keyboard shortcuts

### 6.3 Configuration UI
- Menubar icon with dropdown menu
- Configure window (native macOS)
- About window

---

## 7. Menubar Application

### 7.1 Menubar Icon
- Status indicator (connected/disconnected)
- Click to show menu

### 7.2 Menu Items
- Current page indicator
- Quick page switch
- Configure...
- About Kiro Deck
- Check for Updates
- Quit

### 7.3 Configure Window
- Tabs: General, Pages, Info Bar, Icons
- Edit watched commands
- Manage favorites (folders, agents)
- Clear MRU lists
- Import/export configuration

### 7.4 About Window
- Version information
- Credits
- Links (documentation, issues)

---

## 8. Web Emulator

### 8.1 Emulator UI
- Browser-based Stream Deck Neo replica
- 8 buttons in 2x4 grid
- 2 page buttons
- Info bar display

### 8.2 Communication
- WebSocket connection to main app
- Bidirectional: button presses → app, images → emulator
- Same protocol as hardware

### 8.3 Testing Support
- Scriptable button presses
- Screenshot capture
- State inspection

---

## 9. System Integration

### 9.1 Launch on Login
- LaunchAgent plist
- Graceful startup/shutdown

### 9.2 Auto-Update
- Check for updates on launch
- Periodic update checks (configurable)
- Download and stage updates
- Apply on restart

### 9.3 Permissions
- Request Accessibility permission (keyboard simulation)
- Request Calendar permission (optional)
- USB access (automatic)

---

## 10. Performance Requirements

### 10.1 Resource Usage
- Memory: < 100MB typical
- CPU: < 1% idle, < 5% active
- Startup time: < 2 seconds

### 10.2 Responsiveness
- Button press to action: < 50ms
- Info bar update: < 100ms
- Page switch: < 200ms

---

## 11. Future Considerations (Out of Scope for V1)

- Multiple Stream Deck models
- Button hold actions
- Folder/profile sync
- Plugin marketplace
- iOS/Android companion app
- Voice control integration
