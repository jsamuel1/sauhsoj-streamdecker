// streamdecker-menubar — a tiny native macOS menubar (NSStatusItem) helper.
//
// Protocol (line-delimited JSON over stdio), matching src/gui/menubar-protocol.ts:
//   parent -> helper (first line): {"icon":"<base64 png>","tooltip":"...",
//                                   "items":[{"id":2,"title":"...","enabled":true},
//                                            {"separator":true}, ...]}
//   helper -> parent: {"type":"ready"}              once the menu is shown
//                     {"type":"click","id":<n>}     when an item is clicked
//   parent -> helper: {"type":"quit"}               to terminate (or just kill)
//
// Runs as an accessory app (no Dock icon). Universal binary built by build-menubar.sh.

import Cocoa

// Emit one JSON object as a single line on stdout and flush immediately.
func emit(_ object: [String: Any]) {
    guard let data = try? JSONSerialization.data(withJSONObject: object),
          let line = String(data: data, encoding: .utf8) else { return }
    print(line)
    fflush(stdout)
}

final class MenubarController: NSObject {
    private var statusItem: NSStatusItem?

    func install(icon base64Icon: String?, tooltip: String?, items: [[String: Any]]) {
        let statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        self.statusItem = statusItem

        if let button = statusItem.button {
            button.toolTip = tooltip
            if let base64 = base64Icon,
               let data = Data(base64Encoded: base64),
               let image = NSImage(data: data) {
                // Scale to a sensible menubar height, preserve aspect ratio.
                let height: CGFloat = 18
                let ratio = image.size.width / max(image.size.height, 1)
                image.size = NSSize(width: height * ratio, height: height)
                image.isTemplate = false
                button.image = image
            } else {
                button.title = "SD"
            }
        }

        let menu = NSMenu()
        for item in items {
            if (item["separator"] as? Bool) == true {
                menu.addItem(NSMenuItem.separator())
                continue
            }
            let title = item["title"] as? String ?? ""
            let menuItem = NSMenuItem(title: title, action: #selector(onClick(_:)), keyEquivalent: "")
            menuItem.target = self
            menuItem.tag = item["id"] as? Int ?? -1
            menuItem.isEnabled = (item["enabled"] as? Bool) ?? true
            menu.addItem(menuItem)
        }
        statusItem.menu = menu

        emit(["type": "ready"])
    }

    @objc private func onClick(_ sender: NSMenuItem) {
        emit(["type": "click", "id": sender.tag])
    }
}

// MARK: - Startup

let app = NSApplication.shared
app.setActivationPolicy(.accessory)

let controller = MenubarController()

// Read the init line (blocking) before starting the run loop.
guard let initLine = readLine(strippingNewline: true),
      let initData = initLine.data(using: .utf8),
      let initJSON = try? JSONSerialization.jsonObject(with: initData) as? [String: Any] else {
    FileHandle.standardError.write("streamdecker-menubar: missing or invalid init message\n".data(using: .utf8)!)
    exit(1)
}

let icon = initJSON["icon"] as? String
let tooltip = initJSON["tooltip"] as? String
let items = initJSON["items"] as? [[String: Any]] ?? []

// Build the menu on the main thread once the app is active.
DispatchQueue.main.async {
    controller.install(icon: icon, tooltip: tooltip, items: items)
}

// Read further commands (e.g. quit) on a background thread.
Thread.detachNewThread {
    while let line = readLine(strippingNewline: true) {
        guard let data = line.data(using: .utf8),
              let msg = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { continue }
        if (msg["type"] as? String) == "quit" {
            DispatchQueue.main.async { NSApp.terminate(nil) }
            return
        }
    }
    // stdin closed (parent exited): shut down.
    DispatchQueue.main.async { NSApp.terminate(nil) }
}

app.run()
