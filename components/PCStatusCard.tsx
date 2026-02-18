import React, { useState, useRef, useEffect } from 'react';
import { PCInfo, PCStatus } from '../types';

interface PCStatusCardProps {
  pc: PCInfo;
  isAdmin?: boolean;
  onRemote?: (id: number, action: 'reboot' | 'shutdown' | 'maintenance') => void;
  onViewScreen?: (pc: PCInfo) => void;
  onRefreshScreen?: (id: number) => void;
  onRename?: (id: number, newName: string) => void;
}

const PCStatusCard: React.FC<PCStatusCardProps> = ({ pc, isAdmin, onRemote, onViewScreen, onRefreshScreen, onRename }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(pc.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingName]);

  const getStatusConfig = (status: PCStatus) => {
    switch (status) {
      case PCStatus.ONLINE: return { color: 'bg-emerald-500', label: 'In Use', shadow: 'shadow-emerald-500/20' };
      case PCStatus.OFFLINE: return { color: 'bg-rose-500', label: 'Offline', shadow: 'shadow-rose-500/20' };
      case PCStatus.IDLE: return { color: 'bg-indigo-500', label: 'Idle', shadow: 'shadow-indigo-500/20' };
      case PCStatus.MAINTENANCE: return { color: 'bg-slate-500', label: 'Service', shadow: 'shadow-slate-500/20' };
      default: return { color: 'bg-gray-500', label: 'Unknown', shadow: '' };
    }
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRefreshing) return;
    setIsRefreshing(true);
    onRefreshScreen?.(pc.id);
    setTimeout(() => setIsRefreshing(false), 3000);
  };

  const handleRenameSubmit = () => {
    if (tempName.trim() !== pc.name) {
      onRename?.(pc.id, tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') {
      setTempName(pc.name);
      setIsEditingName(false);
    }
  };

  const config = getStatusConfig(pc.status);
  const isDead = pc.status === PCStatus.OFFLINE;

  const formatTime = (seconds: number) => {
    if (!seconds) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + 'h ' : ''}${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div 
      className={`relative group bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden transition-all duration-500 hover:border-indigo-500/50 hover:bg-slate-900/80 ${isDead ? 'opacity-80 grayscale-[0.3]' : ''}`}
    >
      <div 
        className="relative aspect-video bg-slate-950 overflow-hidden cursor-pointer group/screen"
        onClick={() => onViewScreen?.(pc)}
      >
        {pc.screenshotUrl ? (
          <img 
            src={pc.screenshotUrl} 
            alt="Live Screen" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover/screen:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="text-slate-700 mb-2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{isDead ? 'Terminal Offline' : 'No Signal'}</p>
          </div>
        )}
        
        {!isDead && (
          <>
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-[8px] font-black text-white uppercase tracking-tighter">Live Feed</span>
            </div>

            {pc.metrics.is_active && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-indigo-500/20 backdrop-blur-md rounded-lg border border-indigo-500/30 text-indigo-400 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span className="text-[7px] font-black uppercase tracking-widest">Human Detected</span>
              </div>
            )}
            
            {isAdmin && (
               <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/10 text-white transition-all active:scale-90 ${isRefreshing ? 'opacity-50' : ''}`}
                title="Force Screen Refresh"
               >
                 <svg 
                  xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" 
                  className={isRefreshing ? 'animate-spin' : ''}
                 >
                   <path d="M21 2v6h-6"></path>
                   <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                   <path d="M3 22v-6h6"></path>
                   <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                 </svg>
               </button>
            )}
          </>
        )}
        
        {isDead && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="mb-3 opacity-50"><path d="M12 20v-6M9 20v-10M15 20v-2M18 20v-16M6 20v-4"/></svg>
            <span className="px-6 py-2.5 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/40">View Activity History</span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-0.5 w-full">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                {isAdmin && isEditingName ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-slate-950 border border-indigo-500/50 rounded-lg px-2 py-0.5 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                ) : (
                  <div className="flex items-center gap-2 group/name">
                    <h3 className="text-sm font-black text-white tracking-tight truncate">{pc.name}</h3>
                    {isAdmin && (
                      <button 
                        onClick={() => setIsEditingName(true)}
                        className="opacity-0 group-hover/name:opacity-100 text-slate-500 hover:text-indigo-400 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className={`flex-shrink-0 px-2 py-0.5 rounded-md text-[8px] font-black text-white uppercase tracking-tighter ${config.color}`}>
                {config.label}
              </div>
            </div>
            <p className="text-[9px] text-slate-500 font-mono tracking-widest">{pc.ipAddress}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-950/50 p-1.5 rounded-lg border border-white/5 text-center">
            <p className="text-[7px] text-slate-500 uppercase font-bold">CPU</p>
            <p className="text-[10px] font-bold text-slate-300">{isDead ? '—' : `${pc.metrics.cpu.toFixed(0)}%`}</p>
          </div>
          <div className="bg-slate-950/50 p-1.5 rounded-lg border border-white/5 text-center">
            <p className="text-[7px] text-slate-500 uppercase font-bold">RAM</p>
            <p className="text-[10px] font-bold text-slate-300">{isDead ? '—' : `${pc.metrics.ram.toFixed(0)}%`}</p>
          </div>
          <div className="bg-slate-950/50 p-1.5 rounded-lg border border-white/5 text-center">
            <p className="text-[7px] text-slate-500 uppercase font-bold">Status</p>
            <p className={`text-[10px] font-bold ${isDead ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isDead ? 'OFF' : 'LIVE'}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-white/5">
          <div>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Session Time</p>
            <span className={`text-sm font-black font-mono tracking-tighter ${isDead ? 'text-slate-600' : 'text-indigo-400'}`}>
              {formatTime(pc.metrics.uptime || 0)}
            </span>
          </div>
          
          <button 
            onClick={() => onViewScreen?.(pc)}
            className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
          >
            History
          </button>
        </div>
      </div>
    </div>
  );
};

export default PCStatusCard;
