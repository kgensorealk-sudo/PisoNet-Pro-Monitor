# PisoNet Pro Monitor

A professional real-time monitoring system for PisoNet terminals using React, Supabase, and Python.

## 🚀 Deployment Guide

### 1. Frontend (Web Dashboard)
This dashboard is designed to be hosted on **Vercel**. 
- Connect your GitHub repository to Vercel.
- The build settings are automatic.

### 2. Backend (Supabase)
Ensure you have run the SQL setup script provided in the Admin Dashboard to create the `terminals` and `terminal_logs` tables.

### 3. Agent (Python)
Run `pisonet_agent.py` on each terminal.
- Requires: `pip install pynput pyautogui Pillow psutil supabase`
- For stealth mode, rename to `.pyw`.

## 🛠 Features
- Real-time Status (Online/Idle/Offline)
- Live Screen Snapshots
- Hardware Metrics (CPU/RAM)
- Event Logging (History)
