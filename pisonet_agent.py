import time
import socket
import io
import base64
import psutil
import atexit
import sys
import threading
from PIL import Image
from datetime import datetime, timezone
from supabase import create_client, Client

# Attempt to import dependencies
try:
    from pynput import mouse, keyboard
    import pyautogui
    HAS_DEPS = True
except ImportError:
    print("[!] Missing dependencies. Run: pip install pynput pyautogui Pillow psutil supabase")
    HAS_DEPS = False

# ==============================================================================
# PISONET PRO AGENT - v1.9 (Reliable Activity & SQL Auto-Diagnostic)
# ==============================================================================
# 1. SETUP TABLE: You MUST run the SQL script found in the Web App Setup Guide.
# 2. STEALTH: Rename to 'pisonet_agent.pyw' to hide the console.
# ==============================================================================

# CONFIGURATION
TERMINAL_ID = 1

SUPABASE_URL = "https://tuqecpveltzeaudcffqh.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1cWVjcHZlbHR6ZWF1ZGNmZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgwMTQsImV4cCI6MjA4Njg3NDAxNH0.hK1x70KOatWtkNO2MDV-ImMCOR3kvxEGgXmG6ZDy53E"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Global Activity Tracker
last_activity_time = time.time()

def on_activity(*args, **kwargs):
    global last_activity_time
    last_activity_time = time.time()

def start_input_listeners():
    try:
        m_lit = mouse.Listener(on_move=on_activity, on_click=on_activity, on_scroll=on_activity)
        k_lit = keyboard.Listener(on_press=on_activity)
        m_lit.daemon = True
        k_lit.daemon = True
        m_lit.start()
        k_lit.start()
        return m_lit, k_lit
    except Exception as e:
        print(f"[!] Listener Error: {e}")
        return None, None

def log_event(event_name):
    """Sends a historical event to Supabase. This REQUIRES the 'terminal_logs' table."""
    try:
        data = {
            "terminal_id": TERMINAL_ID,
            "event": event_name,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        res = supabase.table("terminal_logs").insert(data).execute()
        if res.data:
            print(f"[Log] Event Recorded: {event_name}")
    except Exception as e:
        if "PGRST205" in str(e):
            print("\n" + "!"*60)
            print(" CRITICAL ERROR: TABLE 'terminal_logs' NOT FOUND!")
            print(" Please go to Supabase SQL Editor and run the creation script.")
            print("!"*60 + "\n")
        else:
            print(f"[Log Failed] {event_name}: {e}")

@atexit.register
def on_exit():
    log_event("OFFLINE")

def start_agent():
    global last_activity_time
    if not HAS_DEPS: return

    print(f"[+] Pisonet Pro Agent v1.9 - TERMINAL {TERMINAL_ID}")
    m_lit, k_lit = start_input_listeners()
    
    # Initial status
    log_event("AGENT_START")

    last_trigger = None
    last_status = "ONLINE"
    last_mouse_pos = pyautogui.position()
    start_time = time.time()
    
    # Thresholds
    IDLE_THRESHOLD = 90  # 1.5 minutes
    SYNC_INTERVAL = 5

    while True:
        try:
            # Check listener health
            if m_lit and not m_lit.is_alive():
                print("[!] Restarting Mouse Listener...")
                m_lit, _ = start_input_listeners()

            # Hybrid Fallback (Mouse Polling)
            curr_pos = pyautogui.position()
            if curr_pos != last_mouse_pos:
                last_activity_time = time.time()
                last_mouse_pos = curr_pos

            # Calculate Status
            idle_duration = time.time() - last_activity_time
            is_active = idle_duration < IDLE_THRESHOLD
            current_status = "ONLINE" if is_active else "IDLE"

            # Transition Logging
            if current_status != last_status:
                log_event(current_status)
                last_status = current_status

            # Metrics & Sync
            res = supabase.table("terminals").select("refresh_trigger").eq("id", TERMINAL_ID).execute()
            
            payload = {
                "status": current_status,
                "ip_address": socket.gethostbyname(socket.gethostname()),
                "metrics": {
                    "cpu": psutil.cpu_percent(),
                    "ram": psutil.virtual_memory().percent,
                    "ping": 10,
                    "is_active": is_active,
                    "uptime": int(time.time() - start_time),
                    "idle_seconds": int(idle_duration)
                },
                "last_seen": datetime.now(timezone.utc).isoformat()
            }

            # Command Handling (Screenshot)
            if res.data:
                trig = res.data[0].get('refresh_trigger')
                if last_trigger is not None and trig != last_trigger:
                    print("[*] Generating screen snapshot...")
                    img = pyautogui.screenshot()
                    img.thumbnail((800, 450))
                    buf = io.BytesIO()
                    img.save(buf, format="JPEG", quality=60)
                    payload["screenshot_url"] = f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}"
                last_trigger = trig

            supabase.table("terminals").update(payload).eq("id", TERMINAL_ID).execute()
            print(f"[Sync] {current_status} | Idle: {int(idle_duration)}s | CPU: {payload['metrics']['cpu']}%")

        except Exception as e:
            print(f"[Error] {e}")
            time.sleep(10)
            
        time.sleep(SYNC_INTERVAL)

if __name__ == "__main__":
    start_agent()
