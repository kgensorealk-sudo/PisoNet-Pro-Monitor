import React, { useState } from 'react';
import { PCInfo, PCStatus } from '../types';
import PCStatusCard from './PCStatusCard';

interface AdminDashboardProps {
  pcs: PCInfo[];
  onRemoteAction: (id: number, action: 'reboot' | 'shutdown' | 'maintenance') => void;
  onViewScreen?: (pc: PCInfo) => void;
  onRefreshScreen?: (id: number) => void;
  onRename?: (id: number, newName: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ pcs, onRemoteAction, onViewScreen, onRefreshScreen, onRename }) => {
  const [showSetup, setShowSetup] = useState(false);
  const [setupTab, setSetupTab] = useState<'sql' | 'deploy' | 'security'>('sql');
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
            onClick={() => setShowSetup(true)}
            className="px-5 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-indigo-400"
          >
            System & Security
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
        <h2 className="text-xl font-black text-white flex items-center gap-3 mb-8">
          <span className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)]"></span>
          Terminal Cluster ({pcs.length} Nodes)
        </h2>
        
        {pcs.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
            <p className="text-slate-500 font-bold uppercase tracking-widest">Waiting for nodes to connect...</p>
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
                onRename={onRename}
              />
            ))}
          </div>
        )}
      </section>

      {showSetup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowSetup(false)}></div>
          <div className="relative w-full max-w-3xl bg-slate-900 border border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            
            <div className="flex border-b border-white/5 bg-slate-950/40 p-2">
              <button 
                onClick={() => setSetupTab('sql')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all rounded-2xl ${setupTab === 'sql' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                1. Database
              </button>
              <button 
                onClick={() => setSetupTab('deploy')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all rounded-2xl ${setupTab === 'deploy' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                2. Hosting
              </button>
              <button 
                onClick={() => setSetupTab('security')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all rounded-2xl ${setupTab === 'security' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                3. Security
              </button>
            </div>

            <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
              {setupTab === 'sql' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-5 bg-rose-500/10 rounded-2xl border border-rose-500/30">
                    <p className="text-[10px] text-rose-400 font-black uppercase mb-3">SQL Setup Script</p>
                    <code className="text-[10px] font-mono text-emerald-400 block bg-black/60 p-4 rounded-xl leading-relaxed whitespace-pre overflow-x-auto">
{`CREATE TABLE public.terminal_logs (
  id bigint primary key generated always as identity,
  terminal_id bigint references public.terminals(id),
  event text not null,
  created_at timestamptz default now()
);

ALTER PUBLICATION supabase_realtime ADD TABLE terminal_logs;`}
                    </code>
                  </div>
                </div>
              )}

              {setupTab === 'deploy' && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-xl font-black text-white">Vercel Deployment</h3>
                  <code className="text-[10px] font-mono text-indigo-400 block bg-black/60 p-4 rounded-xl leading-relaxed whitespace-pre overflow-x-auto">
{`git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_URL
git push -u origin main`}
                  </code>
                </div>
              )}

              {setupTab === 'security' && (
                <div className="space-y-8 animate-fadeIn">
                  <h3 className="text-xl font-black text-white">Create Admin Account</h3>
                  <div className="p-6 bg-slate-950 rounded-2xl border border-white/5 space-y-6">
                    <div className="space-y-3">
                      <p className="text-sm text-white font-bold">1. Open Supabase Dashboard</p>
                      <p className="text-xs text-slate-400">Go to your project at <a href="https://supabase.com/dashboard" target="_blank" className="text-indigo-400 underline">supabase.com</a>.</p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-white font-bold">2. Add User</p>
                      <p className="text-xs text-slate-400">Click on **Authentication** (sidebar) -> **Users** -> **Add User** -> **Create New User**.</p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-white font-bold">3. Enter Credentials</p>
                      <p className="text-xs text-slate-400">Enter your chosen **Email** and **Password**. Uncheck "Auto-confirm user" if you want to verify via email, or leave it checked for instant access.</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <p className="text-[10px] text-emerald-400 font-black uppercase mb-1">Benefit</p>
                    <p className="text-xs text-slate-300">You can now change your password or add multiple staff members as admins through the Supabase UI without touching the code!</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-950/40 border-t border-white/5">
              <button 
                onClick={() => setShowSetup(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black text-white transition-all shadow-xl shadow-indigo-600/30"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;