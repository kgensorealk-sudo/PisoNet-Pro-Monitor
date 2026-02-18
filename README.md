# PisoNet Pro Monitor

A professional real-time monitoring system for PisoNet terminals using React, Supabase, and Python.

## 🛠️ Setup Guide

### Phase 1: The "Builder" Machine (Your Main PC)
1. **Install Requirements**: `pip install supabase pynput pyautogui Pillow psutil pyinstaller`
2. **Create EXE**: `python -m PyInstaller --onefile --noconsole --name "PisoNetGuard" pisonet_agent.py`

---

### Phase 2: Terminal Setup (PC 1, 2, 3)
1. **Paste**: Put `PisoNetGuard.exe` in `C:\PisoNet\`.
2. **Run**: Double-click it. It creates `config.json` and adds itself to Windows Startup.
3. **ID**: Edit `config.json` and set `"terminal_id": 1` (or 2, 3, etc).
4. **Restart**: Restart the PC to apply.

---

## 🚫 How to Remove from Startup
If you want to stop the agent from starting automatically:

### Method A: Command Line (Recommended)
1. Open **Command Prompt** (cmd).
2. Navigate to your folder: `cd C:\PisoNet\`
3. Run: `PisoNetGuard.exe --remove`
   - *This will delete the startup entry in the Windows Registry.*

### Method B: Task Manager
1. Press `Ctrl + Shift + Esc`.
2. Go to the **Startup** tab.
3. Right-click **PisoNetGuard** and select **Disable**.

---

## 🔍 Troubleshooting
- **Offline Flipping?** v2.8 has improved heartbeats. Ensure stable internet.
- **Admin Access**: Manage accounts via the Supabase Dashboard "Authentication" tab.
