'use client';

import { useEffect, useState, useRef } from 'react';
import { ParsedServer } from './BulkForm';
import { BulkRunState } from '../../app/bulk/page';
import { useAuthStore } from '../../lib/store';
import { CheckCircle2, XCircle, Clock, Loader2, ChevronDown, ChevronRight, X } from 'lucide-react';
import { LogEntry } from '../../hooks/useWebSocket';

export default function BulkResults({ runState, onComplete }: { runState: BulkRunState, onComplete: () => void }) {
  const [completeCount, setCompleteCount] = useState(0);

  // Check completion
  useEffect(() => {
    if (completeCount === runState.servers.length) {
      onComplete();
    }
  }, [completeCount, runState.servers.length, onComplete]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl flex flex-col h-full min-h-[600px]">
      <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-black/40">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
           Results
           <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-normal">
             {completeCount} / {runState.servers.length} Completed
           </span>
        </h2>
        {runState.isRunning && (
          <div className="flex items-center gap-2 text-sm text-emerald-500">
            <Loader2 className="animate-spin" size={16} />
            Testing...
          </div>
        )}
      </div>

      <div className="flex-1 p-2 overflow-y-auto space-y-1">
        {runState.servers.map((srv, idx) => (
          <ServerRow key={srv.id} server={srv} globalOpts={runState.globalOptions} idx={idx} onDone={() => setCompleteCount(c => c + 1)} />
        ))}
      </div>
    </div>
  );
}

function ServerRow({ server, globalOpts, idx, onDone }: { server: ParsedServer, globalOpts: any, idx: number, onDone: () => void }) {
  const [status, setStatus] = useState<'pending' | 'running' | 'success' | 'error'>('pending');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  
  const hasRun = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    
    // Slight delay so they don't all hit the backend at exactly the same ms
    const timer = setTimeout(() => {
      runTest();
    }, idx * 100);

    return () => clearTimeout(timer);
  }, []);

  const runTest = async () => {
    setStatus('running');
    const endpoint = process.env.NODE_ENV === 'development' ? 'http://localhost:8080/api/test' : '/api/test';
    
    try {
      const token = useAuthStore.getState().token;
      // ...payload code remains exactly the same...
      const payload: any = {
        protocol: globalOpts.protocol,
        connection: { host: server.host, port: server.port, username: server.user },
        auth: {
           type: server.password ? 'password' : 'key',
           password: server.password || null,
           private_key: server.password ? null : globalOpts.globalKey,
        },
        ssh_options: {
           timeout_seconds: 10,
           host_key_check: 'ignore'
        }
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unknown error");
      }
      
      connectWs(data.session_id);
    } catch (e: any) {
      setStatus('error');
      setLogs([{ ts: new Date().toISOString(), level: 'error', stage: 'init', message: e.message }]);
      onDone();
    }
  };

  const connectWs = (sessionId: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'development' ? 'localhost:8080' : window.location.host;
    const token = useAuthStore.getState().token;
    const ws = new WebSocket(`${protocol}//${host}/ws/log/${sessionId}?token=${token}`);
    wsRef.current = ws;

    const startTime = Date.now();

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setLogs(prev => [...prev, msg]);
        
        if (msg.stage === 'done') {
           setStatus(msg.level === 'success' ? 'success' : 'error');
           setDuration(Date.now() - startTime);
           onDone();
        }
      } catch (err) {}
    };

    ws.onclose = () => {
      if (status === 'running') {
        setStatus('error');
        onDone();
      }
    };
  };

  const StatusIcon = () => {
    switch (status) {
      case 'pending': return <Clock size={18} className="text-neutral-600" />;
      case 'running': return <Loader2 size={18} className="text-emerald-500 animate-spin" />;
      case 'success': return <CheckCircle2 size={18} className="text-emerald-500" />;
      case 'error': return <XCircle size={18} className="text-rose-500" />;
    }
  };

  return (
    <div className="border font-mono border-neutral-800/50 bg-neutral-950/50 rounded flex flex-col overflow-hidden">
       {/* Master Row */}
       <div 
         className="flex items-center gap-4 py-2 px-4 hover:bg-neutral-800/50 transition-colors cursor-pointer select-none"
         onClick={() => setExpanded(!expanded)}
       >
         <StatusIcon />
         <div className="flex-1 flex items-center justify-between">
           <div className="text-sm font-bold text-neutral-300">
             <span className="text-neutral-500">{server.user}@</span>{server.host}<span className="text-neutral-500">:{server.port}</span>
           </div>
           <div className="flex items-center gap-4 text-xs font-semibold">
             {duration !== null && <span className="text-neutral-500">{duration}ms</span>}
             {expanded ? <ChevronDown size={16} className="text-neutral-500" /> : <ChevronRight size={16} className="text-neutral-500" />}
           </div>
         </div>
       </div>

       {/* Expanded Logs */}
       {expanded && (
         <div className="bg-black border-t border-neutral-800 p-4 space-y-1 max-h-64 overflow-y-auto text-xs">
            {logs.length === 0 && <div className="text-neutral-600 italic">No logs yet...</div>}
            {logs.map((log, i) => {
              const color = log.level === 'success' ? 'text-emerald-400' : log.level === 'error' ? 'text-rose-400' : 'text-neutral-400';
              return (
                <div key={i} className="flex gap-4 hover:bg-white/5 py-0.5 px-2 rounded -mx-2">
                  <span className={`w-16 shrink-0 font-bold ${color}`}>{log.level.toUpperCase()}</span>
                  <span className={log.level === 'error' ? 'text-rose-200' : 'text-neutral-300'}>{log.message}</span>
                </div>
              );
            })}
         </div>
       )}
    </div>
  );
}
