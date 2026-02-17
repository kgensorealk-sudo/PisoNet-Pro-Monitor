import React from 'react';
import { PCInfo, PCStatus } from '../types';

interface PlayerDashboardProps {
  currentPC: PCInfo;
}

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ currentPC }) => {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + 'h ' : ''}${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const isActive = currentPC.status === PCStatus.ONLINE;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Session Focus Card */}
        <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${isActive ? 'emerald' : 'indigo'}-500 to-transparent`}></div>
          
          <div className={`w-20 h-20 ${isActive ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-indigo-600 shadow-indigo-600/30'} rounded-3xl flex items-center justify-center mb-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="text-white" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
          </div>
          
          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">{currentPC.name}</h1>
          <p className="text-indigo-400 font-mono text-xs font-bold tracking-widest mb-10">{currentPC.ipAddress}</p>
          
          <div className="w-full bg-slate-950/50 p-8 rounded-3xl border border-white/5 mb-8">
            <div className="flex flex-col items-center justify-center space-y-2">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Active Session Time</p>
              <div className={`text-4xl font-black font-mono tracking-tighter ${isActive ? 'text-emerald-400' : 'text-slate-600'}`}>
                {formatTime(currentPC.metrics.uptime || 0)}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-500' : 'text-slate-600'}`}>
                  {isActive ? 'Live & Tracking' : 'PC Suspended'}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full space-y-4">
            <div className="bg-slate-800/20 text-slate-400 font-bold py-4 rounded-2xl border border-white/5 flex items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
              Standard Usage Mode
            </div>
          </div>
        </div>

        {/* System & Information Side */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 flex-1">
            <h2 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              Node Performance
            </h2>
            <div className="space-y-6">
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Network Latency</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(currentPC.metrics.ping, 100)}%` }}></div>
                  </div>
                  <span className="text-emerald-400 font-mono text-xs font-bold">{currentPC.metrics.ping.toFixed(0)}ms</span>
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Hardware Load</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] text-slate-600 font-bold uppercase">CPU Usage</p>
                    <p className="text-white font-mono text-sm">{currentPC.metrics.cpu.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-600 font-bold uppercase">RAM Usage</p>
                    <p className="text-white font-mono text-sm">{currentPC.metrics.ram.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] p-8">
            <h2 className="text-white font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              System Health
            </h2>
            <p className="text-slate-400 text-sm leading-snug">
              Terminal is monitored for hardware stability and usage patterns. Standard rates and policies apply.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-6 text-center">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
          Node {currentPC.name} • Status: {currentPC.status}
        </p>
      </div>
    </div>
  );
};

export default PlayerDashboard;