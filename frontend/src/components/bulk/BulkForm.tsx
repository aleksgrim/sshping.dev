'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

export interface ParsedServer {
  id: string;
  raw: string;
  host: string;
  port: number;
  user: string;
  password?: string;
  status: 'pending' | 'running' | 'success' | 'error';
  sessionId: string | null;
  errorMsg?: string;
  durationMs?: number;
}

export default function BulkForm({ onRun, isRunning }: { onRun: (servers: ParsedServer[], globalOpts: any) => void, isRunning: boolean }) {
  const [text, setText] = useState('root:mypwd@192.168.1.100:22\nroot@example.com\n');
  const [protocol, setProtocol] = useState('ssh');
  const [globalKey, setGlobalKey] = useState('');
  
  const handleParse = () => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsed: ParsedServer[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Format: user:password@host:port (password and port are optional)
      const match = line.match(/^([^:]+)(?::([^@]+))?@([^:]+)(?::(\d+))?$/);
      if (match) {
        parsed.push({
          id: `srv-${i}-${Date.now()}`,
          raw: line,
          user: match[1],
          password: match[2],
          host: match[3],
          port: match[4] ? parseInt(match[4]) : (protocol === 'ftp' ? 21 : 22),
          status: 'pending',
          sessionId: null
        });
      } else {
        // Fallback or simple parse
        const parts = line.split('@');
        if (parts.length === 2) {
           const hostPort = parts[1].split(':');
           parsed.push({
              id: `srv-${i}-${Date.now()}`,
              raw: line,
              user: parts[0],
              host: hostPort[0],
              port: hostPort[1] ? parseInt(hostPort[1]) : 22,
              status: 'pending',
              sessionId: null
           });
        }
      }
    }
    
    if (parsed.length === 0) {
      alert("No valid servers found in the format user:pass@host:port");
      return;
    }
    
    onRun(parsed, { protocol, globalKey });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 pb-2">Target Servers</h3>
      
      <div className="space-y-1.5">
        <label className="text-xs text-neutral-400 flex justify-between">
          <span>Server List (one per line)</span>
          <span>Format: user:pass@host:port</span>
        </label>
        <textarea 
          className="w-full h-48 bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-300 font-mono focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-neutral-700 whitespace-pre"
          placeholder="root:pwd123@10.0.0.1:22&#10;deployer@bastion.dev:2222"
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={isRunning}
        />
      </div>

      <div className="space-y-4 pt-4 border-t border-neutral-800">
        <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">Global Settings</h3>
        
        <div className="space-y-1.5">
          <label className="text-xs text-neutral-400">Protocol</label>
          <select 
            className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 outline-none"
            value={protocol}
            onChange={e => setProtocol(e.target.value)}
            disabled={isRunning}
          >
            <option value="ssh">SSH</option>
            <option value="sftp">SFTP</option>
            <option value="ftp">FTP</option>
          </select>
        </div>

        {['ssh', 'sftp'].includes(protocol) && (
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400">Global Private Key (Fallback)</label>
            <textarea 
              className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 font-mono text-xs text-neutral-400 outline-none placeholder:text-neutral-700"
              placeholder="If user line has no password, this key will be attempted."
              value={globalKey}
              onChange={e => setGlobalKey(e.target.value)}
              disabled={isRunning}
            />
          </div>
        )}
      </div>

      <button 
        type="button" 
        onClick={handleParse}
        disabled={isRunning}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all ${
          isRunning 
            ? 'bg-emerald-600/50 cursor-not-allowed' 
            : 'bg-emerald-600 hover:bg-emerald-500 hover:-translate-y-0.5 shadow-emerald-500/10'
        }`}
      >
        {isRunning ? 'Running Bulk Test...' : <><Play size={18} fill="currentColor" /> Run {text.split('\n').filter(l=>l.trim().length>0).length} Servers</>}
      </button>

    </div>
  );
}
