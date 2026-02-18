import time
import socket
import io
import base64
import psutil
import atexit
import sys
import os
import threading
import json

# ==============================================================================
# PISONET PRO AGENT - v2.9 (High-Resilience Mode)
# ==============================================================================

def install_instructions():
    print("\n[!] MISSING LIBRARIES DETECTED")
    print("Please run the following command in your terminal:")
    print("pip install supabase pynput pyautogui Pillow psutil\n")
    sys.exit(1)

# Essential Imports
try:
    from PIL import Image
    import pyautogui
    from pynput import mouse, keyboard
    from datetime import datetime, timezone
    from supabase import create_client, Client
except ImportError as e:
    print(f"Error: {e}")
    install_instructions()

# Determine the directory where the EXE or Script is located
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
    CURRENT_PATH = sys.executable
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    CURRENT_PATH = os.path.abspath(__file__)

CONFIG_PATH = os.path.normpath(os.path.join(BASE_DIR, "config.json"))
REG_KEY_NAME = "PisoNetGuard"

def manage_autostart(remove=False):
    """Adds or removes the application from the Windows Startup Registry."""
    if sys.platform != 'win32':
        return
    
    try:
        import winreg as reg
        key = reg.HKEY_CURRENT_USER
        key_value = "Software\\Microsoft\\Windows\\CurrentVersion\\Run"
        
        open_key = reg.OpenKey(key, key_value, 0, reg.KEY_ALL_ACCESS)
        
        if remove:
            try:
                reg.DeleteValue(open_key, REG_KEY_NAME)
                print(f"[-] {REG_KEY_NAME} removed from Windows Startup.")
            except FileNotFoundError:
                print(f"[!] {REG_KEY_NAME} was not found in startup.")
        else:
            # Check if already set
            try:
                val, _ = reg.QueryValueEx(open_key, REG_KEY_NAME)
                if val == CURRENT_PATH:
                    reg.CloseKey(open_key)
                    return
            except FileNotFoundError:
                pass

            reg.SetValueEx(open_key, REG_KEY_NAME, 0, reg.REG_SZ, CURRENT_PATH)
            print(f"[+] {REG_KEY_NAME} registered for automatic startup.")
            
        reg.CloseKey(open_key)
    except Exception as e:
        print(f"[!] Could not manage autostart: {e}")

def load_or_create_config():
    """Loads configuration or creates a default one if missing."""
    default_config = {
        "terminal_id": 1,
        "supabase_url": "https://tuqecpveltzeaudcffqh.supabase.co",
        "supabase_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1cWVjcHZlbHR6ZWF1ZGNmZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgwMTQsImV4cCI6MjA4Njg3NDAxNH0.hK1x70KOatWtkNO2MDV-ImMCOR3kvxEGgXmG6ZDy53E"
    }
    
    if not os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "w") as f:
                json.dump(default_config, f, indent=4)
        except:
            pass
        return default_config
    
    try:
        with open(CONFIG_PATH, "r") as f:
            return json.load(f)
    except:
        return default_config

# Load configuration
config_data = load_or_create_config()
TERMINAL_ID = config_data.get("terminal_id", 1)
SUPABASE_URL = config_data.get("supabase_url")
SUPABASE_KEY = config_data.get("supabase_key")

# Initialize Supabase
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Supabase Connection Error: {e}")
    sys.exit(1)

# Global Activity State
last_activity_time = time.time()
activity_lock = threading.Lock()

def on_activity(*args, **kwargs):
    global last_activity_time
    with activity_lock:
        last_activity_time = time.time()

def start_input_listeners():
    """Starts mouse and keyboard listeners in background threads."""
    try:
        m_lit = mouse.Listener(on_move=on_activity, on_click=on_activity, on_scroll=on_activity)
        k_lit = keyboard.Listener(on_press=on_activity)
        m_lit.daemon = True
        k_lit.daemon = True
        m_lit.start()
        k_lit.start()
    except:
        pass

def log_event(event_name):
    """Sends a timestamped event to the database with retry logic."""
    for _ in range(3):
        try:
            data = {
                "terminal_id": TERMINAL_ID,
                "event": event_name,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            supabase.table("terminal_logs").insert(data).execute()
            return
        except:
            time.sleep(1)

@atexit.register
def on_exit():
    log_event("OFFLINE")

def is_already_running():
    """Check if another instance of the agent is running on this PC."""
    try:
        lock_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        lock_socket.bind(("127.0.0.1", 45678)) 
        return False, lock_socket
    except socket.error:
        return True, None

def run_agent():
    global last_activity_time
    
    # Handle command line args
    if "--remove" in sys.argv:
        manage_autostart(remove=True)
        sys.exit(0)

    running, lock = is_already_running()
    if running:
        print("Agent is already running. Exiting.")
        sys.exit(0)
    
    # Ensure it's in startup unless specified otherwise
    manage_autostart(remove=False)
    
    time.sleep(5)
    start_input_listeners()
    log_event("ONLINE")

    last_trigger = None
    last_status = "ONLINE"
    start_time = time.time()
    
    IDLE_THRESHOLD = 90 
    SYNC_INTERVAL = 10 

    while True:
        try:
            with activity_lock:
                idle_duration = time.time() - last_activity_time
            
            is_active = idle_duration < IDLE_THRESHOLD
            current_status = "ONLINE" if is_active else "IDLE"

            if current_status != last_status:
                log_event(current_status)
                last_status = current_status

            try:
                # Fetching trigger for screen capture
                res = supabase.table("terminals").select("refresh_trigger").eq("id", TERMINAL_ID).execute()
            except:
                res = None

            payload = {
                "status": current_status,
                "ip_address": socket.gethostbyname(socket.gethostname()),
                "metrics": {
                    "cpu": psutil.cpu_percent(),
                    "ram": psutil.virtual_memory().percent,
                    "is_active": is_active,
                    "uptime": int(time.time() - start_time),
                    "idle_seconds": int(idle_duration)
                },
                "last_seen": datetime.now(timezone.utc).isoformat()
            }

            if res and res.data:
                trig = res.data[0].get('refresh_trigger')
                if last_trigger is not None and trig != last_trigger:
                    try:
                        img = pyautogui.screenshot()
                        img.thumbnail((640, 360))
                        buf = io.BytesIO()
                        img.save(buf, format="JPEG", quality=40)
                        payload["screenshot_url"] = f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}"
                    except:
                        pass 
                last_trigger = trig

            # Direct heartbeat update
            supabase.table("terminals").update(payload).eq("id", TERMINAL_ID).execute()
            
        except Exception as e:
            # Reduced sleep on error to 5s to recover faster from network blips
            time.sleep(5)
            
        time.sleep(SYNC_INTERVAL)

if __name__ == "__main__":
    run_agent()
