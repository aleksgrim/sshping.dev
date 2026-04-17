'use client';

import { useWebSocket, LogEntry } from '../../hooks/useWebSocket';
import { useAppStore } from '../../lib/store';
import { X, Copy, Download } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function LogViewer() {
  const { logs, isConnected } = useWebSocket();
  const setSessionId = useAppStore(state => state.setSessionId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleClose = () => {
    setSessionId(null);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-emerald-400';
      case 'error': return 'text-rose-400';
      case 'warn': return 'text-amber-400';
      default: return 'text-neutral-400';
    }
  };

  return (
    <div className="flex flex-col h-[600px] font-mono text-sm">
      {/* Viewer Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-neutral-300">Test Log</span>
          {isConnected ? (
            <span className="flex items-center gap-2 text-xs text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
          ) : (
            <span className="text-xs text-neutral-500">Disconnected</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-neutral-400">
          <button className="hover:text-white transition-colors p-1" title="Copy logs"><Copy size={16} /></button>
          <button className="hover:text-white transition-colors p-1" title="Download .txt"><Download size={16} /></button>
          <div className="w-px h-4 bg-neutral-800 mx-1"></div>
          <button onClick={handleClose} className="hover:text-white transition-colors p-1" title="Close"><X size={18} /></button>
        </div>
      </div>

      {/* Log Entries */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-black" ref={scrollRef}>
        {logs.length === 0 && (
          <div className="text-neutral-500 italic">Waiting for connection logs...</div>
        )}
        {logs.map((log, idx) => {
          const time = new Date(log.ts).toISOString().split('T')[1].slice(0, 12);
          return (
            <div key={idx} className="flex items-start gap-4 hover:bg-neutral-900/50 px-2 py-0.5 rounded -mx-2 transition-colors">
              <span className="text-neutral-600 shrink-0 select-none w-28">{time}</span>
              <span className={`shrink-0 w-20 font-bold ${getLevelColor(log.level)} uppercase text-xs pt-0.5 tracking-wider`}>
                {log.level}
              </span>
              <span className={`break-words flex-1 ${log.level === 'error' ? 'text-rose-200' : 'text-neutral-300'}`}>
                {log.message}
                {log.duration_ms !== undefined && (
                  <span className="ml-2 text-neutral-500 text-xs text-nowrap">({log.duration_ms}ms)</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
