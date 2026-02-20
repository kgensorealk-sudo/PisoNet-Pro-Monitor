import React, { useState } from 'react';
import { PCInfo, PCStatus } from '../types';

interface PCStatusCardProps {
  pc: PCInfo;
  isAdmin?: boolean;
  onRemote?: (id: number, action: 'reboot' | 'shutdown' | 'maintenance') => void;
  onViewScreen?: (pc: PCInfo) => void;
  onRefreshScreen?: (id: number) => void;
  onDelete?: (id: number) => void;
  onUpdateName?: (id: number, newName: string) => void;
}

const PCStatusCard: React.FC<PCStatusCardProps> = ({ pc, isAdmin, onRemote, onViewScreen, onRefreshScreen, onDelete, onUpdateName }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(pc.name);
  const [pendingAction, setPendingAction] = useState<'reboot' | 'shutdown' | 'maintenance' | null>(null);

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

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim() && tempName !== pc.name) {
      onUpdateName?.(pc.id, tempName);
    }
    setIsEditing(false);
  };

  const handleRemoteAction = async (action: 'reboot' | 'shutdown' | 'maintenance') => {
    if (pendingAction) return;
    setPendingAction(action);
    try {
      await onRemote?.(pc.id, action);
    } finally {
      // Keep loading state for a bit to show feedback
      setTimeout(() => setPendingAction(null), 1500);
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
    <div className={`relative group bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden transition-all duration-500 hover:border-indigo-500/50 hover:bg-slate-900/80 ${isDead ? 'opacity-60 grayscale-[0.5]' : ''}`}>
      
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
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">No Signal</p>
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
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <form onSubmit={handleSaveName} className="flex-1">
                  <input 
                    autoFocus
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleSaveName}
                    className="bg-slate-950 border border-indigo-500/50 rounded px-2 py-0.5 text-sm font-black text-white w-full outline-none"
                  />
                </form>
              ) : (
                <h3 
                  className="text-sm font-black text-white tracking-tight cursor-pointer hover:text-indigo-400 transition-colors flex items-center gap-2"
                  onClick={() => isAdmin && setIsEditing(true)}
                >
                  {pc.name}
                  {isAdmin && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-0 group-hover:opacity-40"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>}
                </h3>
              )}
              <div className={`px-2 py-0.5 rounded-md text-[8px] font-black text-white uppercase tracking-tighter ${config.color}`}>
                {config.label}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-slate-500 font-mono tracking-widest">{pc.ipAddress}</p>
              <span className="text-[9px] text-slate-700 font-black uppercase tracking-widest bg-white/5 px-1.5 rounded">ID: {pc.id}</span>
            </div>
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => onDelete?.(pc.id)}
              className="p-1.5 text-slate-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
              title="Remove Terminal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-950/50 p-1.5 rounded-lg border border-white/5 text-center">
            <p className="text-7px] text-slate-500 uppercase font-bold">CPU</p>
            <p className="text-[10px] font-bold text-slate-300">{(pc.metrics?.cpu ?? 0).toFixed(0)}%</p>
          </div>
          <div className="bg-slate-950/50 p-1.5 rounded-lg border border-white/5 text-center">
            <p className="text-7px] text-slate-500 uppercase font-bold">RAM</p>
            <p className="text-[10px] font-bold text-slate-300">{(pc.metrics?.ram ?? 0).toFixed(0)}%</p>
          </div>
          <div className="bg-slate-950/50 p-1.5 rounded-lg border border-white/5 text-center">
            <p className="text-[7px] text-slate-500 uppercase font-bold">Ping</p>
            <p className="text-[10px] font-bold text-emerald-400">Stable</p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-white/5">
          <div>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Session / Daily Total</p>
            <div className="flex flex-col">
              <span className={`text-sm font-black font-mono tracking-tighter text-indigo-400`}>
                {formatTime(pc.metrics.uptime || 0)}
              </span>
              <span className="text-[10px] font-black font-mono tracking-tighter text-emerald-500">
                {formatTime(pc.dailyUptime + (pc.metrics.uptime || 0))}
              </span>
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex gap-1.5">
              <button 
                onClick={() => handleRemoteAction('reboot')}
                disabled={!!pendingAction || isDead}
                className={`p-2 rounded-lg border transition-all ${pendingAction === 'reboot' ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'} ${isDead ? 'opacity-30' : ''}`}
                title="Reboot"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={pendingAction === 'reboot' ? 'animate-spin' : ''}>
                  <path d="M21 2v6h-6"></path>
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                </svg>
              </button>

              <button 
                onClick={() => handleRemoteAction('shutdown')}
                disabled={!!pendingAction || isDead}
                className={`p-2 rounded-lg border transition-all ${pendingAction === 'shutdown' ? 'bg-rose-500/20 border-rose-500/50 text-rose-500' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'} ${isDead ? 'opacity-30' : ''}`}
                title="Shutdown"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={pendingAction === 'shutdown' ? 'animate-pulse' : ''}>
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                  <line x1="12" y1="2" x2="12" y2="12"></line>
                </svg>
              </button>

              <button 
                onClick={() => handleRemoteAction('maintenance')}
                disabled={!!pendingAction}
                className={`p-2 rounded-lg border transition-all ${pendingAction === 'maintenance' ? 'bg-slate-500/20 border-slate-500/50 text-slate-300' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                title="Maintenance Mode"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={pendingAction === 'maintenance' ? 'animate-bounce' : ''}>
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
              </button>

              <div className="w-px h-8 bg-white/5 mx-1"></div>

              <button 
                onClick={handleRefresh}
                disabled={isRefreshing || isDead || !!pendingAction}
                className={`group/btn flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white text-[8px] font-black uppercase px-3 py-2 rounded-lg transition-all ${isRefreshing ? 'opacity-50' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`${isRefreshing ? 'animate-spin' : 'group-hover/btn:scale-110'}`}>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                Snap
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PCStatusCard;