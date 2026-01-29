#!/usr/bin/env python3
"""
Create BTT Stream Deck buttons for Kiro CLI control.

Usage:
  python3 create-btt-buttons.py --list       # Show button status
  python3 create-btt-buttons.py --apply      # Apply all buttons
  python3 create-btt-buttons.py --delete     # Delete all buttons
  python3 create-btt-buttons.py KIRO-LAUNCH  # Apply single button
"""

import json
import subprocess
import sys
import os
import socket
import urllib.request
import urllib.parse
import ssl
import time

SCRIPT_DIR = "/Users/sauhsoj/src/personal/sauhsoj-streamdecker/wtf.sauhsoj.streamdecker.sdPlugin/scripts"
ICON_DIR = "/Users/sauhsoj/src/personal/sauhsoj-streamdecker/wtf.sauhsoj.kiro-icons.sdIconPack/icons"
BTT_SOCK = "/tmp/com.hegenberg.BetterTouchTool.sock"
BTT_PORT = 58280

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

def get_btt_secret():
    result = subprocess.run(
        ["security", "find-generic-password", "-s", "BTTScriptingSharedSecret", "-w"],
        capture_output=True, text=True
    )
    return result.stdout.strip() if result.returncode == 0 else ""

def png_to_base64(png_path):
    """Convert PNG to TIFF base64. Use pre-generated -96 version if available."""
    import base64
    if not os.path.exists(png_path):
        return None
    
    # Check for pre-generated 96x96 version (kiro-x.png -> kiro-x-96.png)
    base, ext = os.path.splitext(png_path)
    png_96_path = f"{base}-96{ext}"
    
    if os.path.exists(png_96_path):
        # Use pre-generated 96x96
        subprocess.run(["sips", "-s", "format", "tiff", png_96_path, "--out", "/tmp/btt_icon.tiff"],
                       capture_output=True)
    else:
        # Fallback: resize original to 96x96
        subprocess.run(["sips", "-z", "96", "96", png_path, "--out", "/tmp/btt_icon.png"], 
                       capture_output=True)
        subprocess.run(["sips", "-s", "format", "tiff", "/tmp/btt_icon.png", "--out", "/tmp/btt_icon.tiff"],
                       capture_output=True)
    
    if os.path.exists("/tmp/btt_icon.tiff"):
        with open("/tmp/btt_icon.tiff", "rb") as f:
            return base64.b64encode(f.read()).decode("ascii")
    return None

def set_trigger_image_https(uuid, image_b64):
    """Set trigger image via HTTPS GET."""
    import ssl
    secret = get_btt_secret()
    update_json = json.dumps({"BTTTriggerConfig": {"BTTStreamDeckImage": image_b64}})
    encoded_json = urllib.parse.quote(update_json, safe='')
    url = f"https://127.0.0.1:58280/update_trigger/?shared_secret={secret}&uuid={uuid}&json={encoded_json}"
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    try:
        urllib.request.urlopen(url, context=ctx, timeout=5)
        return True
    except:
        return False

def btt_socket(cmd, params):
    """Send command via Unix socket."""
    secret = get_btt_secret()
    params["shared_secret"] = secret
    
    # URL encode values that might contain special characters
    encoded_params = []
    for k, v in params.items():
        if k == "json":
            v = urllib.parse.quote(str(v), safe='')
        encoded_params.append(f"{k}={v}")
    
    query = "&".join(encoded_params)
    request = f"/{cmd}/?{query}"
    
    try:
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        sock.settimeout(10)
        sock.connect(BTT_SOCK)
        sock.sendall(request.encode() + b'\n')
        response = sock.recv(65536).decode()
        sock.close()
        return response
    except Exception as e:
        return f"error: {e}"

def btt_http_get(cmd, params):
    """HTTP GET for read operations."""
    secret = get_btt_secret()
    params["shared_secret"] = secret
    query = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"https://127.0.0.1:{BTT_PORT}/{cmd}/?{query}"
    try:
        resp = urllib.request.urlopen(url, context=SSL_CTX, timeout=30)
        return resp.read().decode()
    except Exception as e:
        return f"error: {e}"

def get_all_streamdeck_triggers():
    """Get all StreamDeck triggers indexed by (row, col)."""
    result = btt_http_get("get_triggers", {})
    triggers_by_pos = {}
    try:
        triggers = json.loads(result)
        for t in triggers:
            if t.get("BTTTriggerClass") == "BTTTriggerTypeStreamDeck" and t.get("BTTTriggerType") == 719:
                cfg = t.get("BTTTriggerConfig", {})
                fixed = cfg.get("BTTStreamDeckFixedRow", {})
                if fixed:
                    row = int(fixed.get("BTTStreamDeckFixedRow", -1))
                    col = int(fixed.get("BTTStreamDeckFixedCol", -1))
                    if row >= 0 and col >= 0:
                        triggers_by_pos[(row, col)] = t.get("BTTUUID")
    except:
        pass
    return triggers_by_pos

# Button definitions (row 1 = top, row 2 = bottom; col 1-4)
# Icon names match button IDs: KIRO-X uses kiro-x.png
BUTTONS = {
    "KIRO-FOCUS": (1, 1, "kiro-focus.png", "focus-kiro-tab.applescript", "Focus", "Focusing Kiro"),
    "KIRO-CYCLE": (1, 2, "kiro-cycle.png", "cycle-kiro-tabs.applescript", "Cycle", "Switching Tab"),
    "KIRO-ALERT": (1, 3, "kiro-alert.png", "alert-idle-kiro.applescript", "Alert", "Finding Idle"),
    "KIRO-LAUNCH": (1, 4, "kiro-launch.png", "launch-kiro.applescript", "Launch", "Launching Kiro"),
    "KIRO-YES": (2, 1, "kiro-yes.png", "send-yes.applescript", "Yes", "Sending Yes"),
    "KIRO-NO": (2, 2, "kiro-no.png", "send-no.applescript", "No", "Sending No"),
    "KIRO-TRUST": (2, 3, "kiro-trust.png", "send-trust.applescript", "Trust", "Sending Trust"),
    "KIRO-AGENT": (2, 4, "kiro-agent.png", "switch-agent.applescript", "Agent", "Switch Agent"),
}

def create_trigger_json(row, col, icon_file, script_file, display_name, hud_text):
    script_path = os.path.join(SCRIPT_DIR, script_file)
    
    return {
        "BTTTriggerType": 719,
        "BTTTriggerClass": "BTTTriggerTypeStreamDeck",
        "BTTTriggerTypeDescription": display_name,
        "BTTActionsToExecute": [{
            "BTTPredefinedActionType": 195,
            "BTTAdditionalActionData": {
                "BTTScriptType": 2,
                "BTTAppleScriptUsePath": True,
                "BTTAppleScriptPath": script_path
            }
        }],
        "BTTTriggerConfig": {
            "BTTStreamDeckFixedRow": {
                "BTTStreamDeckFixedCol": str(col),
                "BTTStreamDeckFixedRow": str(row)
            },
            "BTTStreamDeckUseFixedRowCol": 1,
            "BTTStreamDeckIconWidth": 96,
            "BTTStreamDeckIconHeight": 96,
            "BTTShowHUD": 1,
            "BTTHUDText": hud_text
        }
    }

def delete_by_position(row, col):
    """Delete trigger at specific row/col."""
    triggers = get_all_streamdeck_triggers()
    uuid = triggers.get((row, col))
    if uuid:
        btt_socket("delete_trigger", {"uuid": uuid})
        return True
    return False

def apply_button(name):
    if name not in BUTTONS:
        print(f"Unknown: {name}")
        return False
    
    row, col, icon_file, script_file, display_name, hud_text = BUTTONS[name]
    
    # Delete existing trigger at this position first
    triggers = get_all_streamdeck_triggers()
    existing_uuid = triggers.get((row, col))
    if existing_uuid:
        btt_socket("delete_trigger", {"uuid": existing_uuid})
        time.sleep(0.3)
    
    # Create trigger WITHOUT image (socket has size limit)
    trigger = create_trigger_json(row, col, icon_file, script_file, display_name, hud_text)
    json_str = json.dumps(trigger)
    result = btt_socket("add_new_trigger", {"json": json_str})
    time.sleep(0.5)
    
    # Get UUID of created trigger
    triggers = get_all_streamdeck_triggers()
    uuid = triggers.get((row, col))
    
    if not uuid:
        print(f"{name}: failed to create")
        return False
    
    # Set image via HTTPS POST
    icon_path = os.path.join(ICON_DIR, icon_file)
    image_b64 = png_to_base64(icon_path)
    if image_b64:
        if set_trigger_image_https(uuid, image_b64):
            print(f"{name}: created with image (row={row} col={col})")
        else:
            print(f"{name}: created, image failed (row={row} col={col})")
    else:
        print(f"{name}: created (row={row} col={col})")
    
    # Force refresh by updating HUD text
    update_json = json.dumps({"BTTTriggerConfig": {"BTTHUDText": hud_text}})
    encoded = urllib.parse.quote(update_json, safe='')
    try:
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        secret = get_btt_secret()
        urllib.request.urlopen(f"https://127.0.0.1:58280/update_trigger/?shared_secret={secret}&uuid={uuid}&json={encoded}", context=ctx, timeout=5)
    except:
        pass
    
    return True

def delete_all_buttons():
    """Delete buttons at all defined positions."""
    for name, (row, col, *_) in BUTTONS.items():
        if delete_by_position(row, col):
            print(f"Deleted: row={row} col={col}")
    print("Done.")

def list_buttons():
    triggers = get_all_streamdeck_triggers()
    print("Button Status:")
    print("-" * 70)
    for name in sorted(BUTTONS.keys()):
        row, col, icon_file, script_file, display_name, _ = BUTTONS[name]
        exists = (row, col) in triggers
        script_ok = "✓" if os.path.exists(os.path.join(SCRIPT_DIR, script_file)) else "✗"
        icon_ok = "✓" if os.path.exists(os.path.join(ICON_DIR, icon_file)) else "✗"
        print(f"  {name:15} {display_name:8} row={row} col={col}  script:{script_ok} icon:{icon_ok}  {'✓' if exists else '✗'}")

def main():
    if len(sys.argv) < 2:
        list_buttons()
        print("\nUsage: --list | --apply | --delete | BUTTON_NAME")
        return
    
    arg = sys.argv[1]
    if arg == "--list":
        list_buttons()
    elif arg == "--delete":
        delete_all_buttons()
    elif arg == "--apply":
        print("Applying all buttons...")
        for name in sorted(BUTTONS.keys()):
            apply_button(name)
        print("\nLayout (row 1=top, row 0=bottom):")
        print("  Top:    [Launch] [Focus] [Yes]   [No]")
        print("  Bottom: [Cycle]  [Alert] [Trust] [Agent]")
    elif arg.startswith("KIRO-"):
        apply_button(arg)
    else:
        print(f"Unknown: {arg}")

if __name__ == "__main__":
    main()
