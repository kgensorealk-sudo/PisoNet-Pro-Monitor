import React, { useState, useEffect } from 'react';
import { PCInfo, PCStatus, PCLog } from './types';
import AdminDashboard from './components/AdminDashboard';
import PlayerDashboard from './components/PlayerDashboard';
import Login from './components/Login';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [pcs, setPcs] = useState<PCInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'admin' | 'player'>('admin');
  const [activePlayerPC, setActivePlayerPC] = useState<number | null>(null);
  const [previewPC, setPreviewPC] = useState<PCInfo | null>(null);
  const [pcLogs, setPcLogs] = useState<PCLog[]>([]);

  // Session Management via Supabase
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        setAuthError('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (email: string, pass: string) => {
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setIsAuthenticated(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  // Map database record to frontend PCInfo type
  const mapDatabaseToPC = (item: any): PCInfo => ({
    id: item.id,
    name: item.name || `TERMINAL-${item.id.toString().padStart(2, '0')}`,
    status: item.status as PCStatus,
    lastHeartbeat: new Date(item.last_seen).getTime(),
    ipAddress: item.ip_address || '127.0.0.1',
    screenshotUrl: item.screenshot_url,
    metrics: item.metrics || { cpu: 0, ram: 0, ping: 0, uptime: 0 }
  });

  // Fetch initial logs
  const fetchLogs = async (terminalId: number) => {
    const { data, error } = await supabase
      .from('terminal_logs')
      .select('*')
      .eq('terminal_id', terminalId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data && !error) {
      setPcLogs(data);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (previewPC) {
      fetchLogs(previewPC.id);
      
      const logChannel = supabase
        .channel(`logs-${previewPC.id}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'terminal_logs',
            filter: `terminal_id=eq.${previewPC.id}` 
          },
          (payload) => {
            const newLog = payload.new as PCLog;
            setPcLogs(prev => [newLog, ...prev.slice(0, 19)]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(logChannel);
      };
    } else {
      setPcLogs([]);
    }
  }, [previewPC?.id, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const checkStaleNodes = setInterval(() => {
      const now = Date.now();
      setPcs(currentPcs => currentPcs.map(pc => {
        const isStale = (now - pc.lastHeartbeat) > 25000;
        if (isStale && pc.status !== PCStatus.OFFLINE) {
          return { ...pc, status: PCStatus.OFFLINE };
        }
        return pc;
      }));
    }, 5000);
    return () => clearInterval(checkStaleNodes);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchInitialData = async () => {
      const { data, error } = await supabase
        .from('terminals')
        .select('*')
        .order('id', { ascending: true });
      
      if (data && !error) {
        const mappedData = data.map(mapDatabaseToPC);
        setPcs(mappedData);
        if (mappedData.length > 0) setActivePlayerPC(mappedData[0].id);
      }
    };

    fetchInitialData();

    const terminalsChannel = supabase
      .channel('terminals-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'terminals' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPC = mapDatabaseToPC(payload.new);
            setPcs(prev => {
              const exists = prev.find(p => p.id === newPC.id);
              if (exists) return prev;
              return [...prev, newPC].sort((a, b) => a.id - b.id);
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedPC = payload.new;
            const heartbeatTime = new Date(updatedPC.last_seen).getTime();
            
            setPcs(currentPcs => currentPcs.map(pc => 
              pc.id === updatedPC.id 
                ? { 
                    ...pc, 
                    name: updatedPC.name || `TERMINAL-${updatedPC.id.toString().padStart(2, '0')}`,
                    status: updatedPC.status as PCStatus, 
                    metrics: updatedPC.metrics,
                    screenshotUrl: updatedPC.screenshot_url || pc.screenshotUrl,
                    ipAddress: updatedPC.ip_address,
                    lastHeartbeat: heartbeatTime
                  } 
                : pc
            ));
            
            if (previewPC?.id === updatedPC.id) {
              setPreviewPC(prev => prev ? ({
                ...prev,
                name: updatedPC.name || prev.name,
                screenshotUrl: updatedPC.screenshot_url || prev.screenshotUrl,
                metrics: updatedPC.metrics,
                ipAddress: updatedPC.ip_address,
                lastHeartbeat: heartbeatTime,
                status: updatedPC.status as PCStatus
              }) : null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(terminalsChannel);
    };
  }, [previewPC?.id, isAuthenticated]);

  const handleRemoteAction = async (id: number, action: 'reboot' | 'shutdown' | 'maintenance') => {
    let statusUpdate = PCStatus.ONLINE;
    if (action === 'shutdown') statusUpdate = PCStatus.OFFLINE;
    if (action === 'maintenance') statusUpdate = PCStatus.MAINTENANCE;
    await supabase.from('terminals').update({ status: statusUpdate }).eq('id', id);
  };

  const handleRename = async (id: number, newName: string) => {
    const { error } = await supabase
      .from('terminals')
      .update({ name: newName })
      .eq('id', id);
    
    if (error) {
      console.error('Error renaming terminal:', error);
    }
  };

  const handleRefreshScreen = async (id: number) => {
    await supabase
      .from('terminals')
      .update({ refresh_trigger: Math.floor(Math.random() * 1000000) })
      .eq('id', id);
  };

  const formatLogDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Initializing Grid...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} error={authError} />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500">
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 shadow-2xl flex gap-1 ring-1 ring-white/5">
        <button onClick={() => setView('admin')} className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'admin' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/40' : 'text-slate-400 hover:text-white'}`}>Admin</button>
        <button onClick={() => setView('player')} className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'player' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/40' : 'text-slate-400 hover:text-white'}`}>Monitor</button>
        <div className="w-px h-8 self-center bg-white/5 mx-1"></div>
        <button onClick={handleLogout} className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 transition-colors" title="Logout">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
      </nav>

      <main className="pt-24 pb-12">
        {view === 'admin' ? (
          <AdminDashboard 
            pcs={pcs} 
            onRemoteAction={handleRemoteAction} 
            onViewScreen={(pc) => setPreviewPC(pc)}
            onRefreshScreen={handleRefreshScreen}
            onRename={handleRename}
          />
        ) : (
          <div className="max-w-6xl mx-auto px-4 animate-fadeIn">
            {pcs.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/20 border border-dashed border-white/10 rounded-[3rem]">
                <p className="text-slate-500 font-bold uppercase tracking-widest">Searching for active terminals...</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  {pcs.map(pc => (
                    <button 
                      key={pc.id} 
                      onClick={() => setActivePlayerPC(pc.id)} 
                      className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all border flex flex-col items-start gap-1 ${activePlayerPC === pc.id ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${pc.status === PCStatus.OFFLINE ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                        <span className="opacity-60 text-[10px] uppercase tracking-widest">{pc.ipAddress}</span>
                      </div>
                      {pc.name}
                    </button>
                  ))}
                </div>
                {activePlayerPC && <PlayerDashboard currentPC={pcs.find(p => p.id === activePlayerPC) || pcs[0]} />}
              </>
            )}
          </div>
        )}
      </main>

      {previewPC && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" onClick={() => setPreviewPC(null)}></div>
          <div className="relative w-full max-w-7xl bg-[#020617] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-modalEnter flex flex-col md:flex-row h-[85vh]">
            <div className="w-full md:w-80 bg-slate-900/40 border-r border-white/5 flex flex-col">
              <div className="p-8 border-b border-white/5 bg-slate-900/50">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                  Live Logs
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {pcLogs.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Awaiting Events...</p>
                  </div>
                ) : (
                  pcLogs.map((log, i) => (
                    <div key={`${log.id}-${i}`} className="relative pl-6 flex flex-col gap-1 group">
                      {i !== pcLogs.length - 1 && (
                        <div className="absolute left-[7px] top-[14px] bottom-[-24px] w-px bg-slate-800 group-hover:bg-indigo-500/30 transition-colors"></div>
                      )}
                      <div className={`absolute left-0 top-[6px] w-[14px] h-[14px] rounded-full border-2 border-slate-950 z-10 ${
                        log.event === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                        log.event === 'IDLE' ? 'bg-indigo-500' :
                        log.event === 'OFFLINE' ? 'bg-rose-500' : 'bg-slate-600'
                      }`}></div>
                      <p className="text-[11px] font-black text-white leading-none uppercase tracking-tighter">
                        {log.event.replace('_', ' ')}
                      </p>
                      <p className="text-[9px] text-slate-500 font-medium font-mono">{formatLogDate(log.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 relative flex flex-col bg-slate-950">
               <div className="absolute top-0 left-0 w-full p-8 bg-gradient-to-b from-black/90 to-transparent flex justify-between items-start z-10">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-600/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white leading-none mb-1">{previewPC.name}</h2>
                    <p className="text-indigo-400 font-mono text-[10px] tracking-widest">{previewPC.ipAddress} • {previewPC.status === PCStatus.OFFLINE ? 'OFFLINE' : 'LIVE MONITORING'}</p>
                  </div>
                </div>
                <button onClick={() => setPreviewPC(null)} className="bg-white/10 hover:bg-rose-500/20 hover:text-rose-400 p-3 rounded-full text-white transition-all backdrop-blur-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center p-4">
                {previewPC.screenshotUrl ? (
                  <img src={previewPC.screenshotUrl} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/5" alt="Fullscreen Feed" />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-slate-800">
                    <svg className="animate-pulse" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M2 3h20v14H2z"></path><path d="M8 21h8"></path><path d="M12 17v4"></path></svg>
                    <span className="text-[10px] uppercase font-black tracking-[0.4em]">No Live Stream</span>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-900/60 border-t border-white/5 flex items-center justify-between backdrop-blur-xl">
                <div className="flex gap-12">
                   <div className="text-center">
                     <p className="text-[10px] text-slate-500 font-black uppercase mb-1">CPU Load</p>
                     <p className="text-xl font-black text-white">{previewPC.metrics.cpu.toFixed(0)}%</p>
                   </div>
                   <div className="text-center">
                     <p className="text-[10px] text-slate-500 font-black uppercase mb-1">RAM usage</p>
                     <p className="text-xl font-black text-white">{previewPC.metrics.ram.toFixed(0)}%</p>
                   </div>
                   <div className="text-center">
                     <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Active Uptime</p>
                     <p className="text-xl font-black text-indigo-400 font-mono">
                       {Math.floor((previewPC.metrics.uptime || 0) / 60)}m
                     </p>
                   </div>
                </div>
                
                <div className="flex gap-4">
                   <button 
                    onClick={() => handleRefreshScreen(previewPC.id)}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black uppercase text-white transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
                   >
                     Force Snapshot
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalEnter { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-modalEnter { animation: modalEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.5s ease forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
};

export default App;