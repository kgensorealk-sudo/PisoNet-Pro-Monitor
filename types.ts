export enum PCStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
  IDLE = 'IDLE'
}

export interface PCLog {
  id: number;
  terminal_id: number;
  event: string;
  created_at: string;
}

export interface PCInfo {
  id: number;
  name: string;
  status: PCStatus;
  lastHeartbeat: number; // timestamp
  ipAddress: string;
  dailyUptime: number; // Total seconds for the day
  screenshotUrl?: string; // URL or base64 of the current screen
  metrics: {
    cpu: number;
    ram: number;
    ping: number;
    is_active?: boolean; // Detects mouse movement
    uptime?: number;     // Total seconds the PC has been on
  };
}