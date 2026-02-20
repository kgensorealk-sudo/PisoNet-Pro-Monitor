import React, { useState } from 'react';
import { PCInfo, PCStatus } from '../types';
import PCStatusCard from './PCStatusCard';

interface AdminDashboardProps {
  pcs: PCInfo[];
  onRemoteAction: (id: number, action: 'reboot' | 'shutdown' | 'maintenance') => void;
  onViewScreen?: (pc: PCInfo) => void;
  onRefreshScreen?: (id: number) => void;
  onAddTerminal?: () => void;
  onDeleteTerminal?: (id: number) => void;
  onUpdateName?: (id: number, newName: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  pcs, 
  onRemoteAction, 
  onViewScreen, 
  onRefreshScreen, 
  onAddTerminal,
  onDeleteTerminal,
  onUpdateName,
  searchQuery,
  setSearchQuery
}) => {
  const [showSetup, setShowSetup] = useState(false);
  const totalActive = pcs.filter(p => p.status === PCStatus.ONLINE).length;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-600/40">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Mainframe</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Managing cluster of {pcs.length} terminals</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <button 
            onClick={onAddTerminal}
            className="px-5 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-emerald-400 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Terminal
          </button>
          <button 
            onClick={() => setShowSetup(true)}
            className="px-5 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-indigo-400"
          >
            Setup Guide
          </button>
          <div className="h-10 w-px bg-white/10 hidden md:block"></div>
          <div className="bg-slate-900/40 border border-white/5 px-6 py-4 rounded-3xl flex items-center gap-4 transition-all hover:bg-slate-900/60">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">In Use</p>
              <p className="text-xl font-black text-white leading-none">{totalActive}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-slate-900/30 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <span className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)]"></span>
            Terminal Cluster ({pcs.length} Nodes)
          </h2>
          
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search by name or IP..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950/50 border border-white/10 rounded-xl px-10 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all w-full md:w-64"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
        </div>
        
        {pcs.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
            <p className="text-slate-500 font-bold uppercase tracking-widest">
              {searchQuery ? 'No terminals match your search' : 'Waiting for nodes to connect...'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pcs.map(pc => (
              <PCStatusCard 
                key={pc.id} 
                pc={pc} 
                isAdmin 
                onRemote={onRemoteAction}
                onViewScreen={onViewScreen}
                onRefreshScreen={onRefreshScreen}
                onDelete={onDeleteTerminal}
                onUpdateName={onUpdateName}
              />
            ))}
          </div>
        )}
      </section>

      {/* Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowSetup(false)}></div>
          <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-black text-white mb-6">Database Fix & Setup</h2>
            
            <div className="space-y-6">
              <div className="p-5 bg-rose-500/10 rounded-2xl border border-rose-500/30">
                <p className="text-[10px] text-rose-400 font-black uppercase mb-3">Critical: Fix "Missing Table" Error</p>
                <p className="text-xs text-slate-300 mb-4">Copy this code and run it in your **Supabase SQL Editor**:</p>
                <code className="text-[10px] font-mono text-emerald-400 block bg-black/60 p-4 rounded-xl leading-relaxed whitespace-pre overflow-x-auto">
{`ALTER TABLE public.terminals ADD COLUMN IF NOT EXISTS daily_uptime bigint DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.terminal_logs (
  id bigint primary key generated always as identity,
  terminal_id bigint references public.terminals(id),
  event text not null,
  created_at timestamptz default now()
);

-- Enable realtime for logs
ALTER PUBLICATION supabase_realtime ADD TABLE terminal_logs;`}
                </code>
              </div>

              <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <p className="text-[10px] text-indigo-400 font-black uppercase mb-1">Step 2: Configure & Run Agent</p>
                <p className="text-xs text-slate-300 mb-3">1. Download `pisonet_agent.py` to the target PC.</p>
                <p className="text-xs text-slate-300 mb-3">2. Open the file and change <code className="text-emerald-400 font-bold">TERMINAL_ID</code> to match the ID shown on the dashboard card.</p>
                <p className="text-xs text-slate-300">3. Run: <code className="text-indigo-400 font-mono">python pisonet_agent.py</code></p>
              </div>

              <div className="p-4 bg-black rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">How Activity works</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Version 1.9 monitors <span className="text-white font-bold">Keypresses</span> and <span className="text-white font-bold">Mouse Coordinates</span>. 
                  It will stay "ONLINE" as long as either are detected.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowSetup(false)}
              className="mt-8 w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black text-white transition-all shadow-xl shadow-indigo-600/30"
            >
              Done, Ready to Monitor
            </button>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;