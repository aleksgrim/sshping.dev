'use client';

import { useState } from 'react';
import { useAppStore, useAuthStore } from '../../lib/store';
import { TestFormState } from '../../lib/types';
import { Play, RotateCcw, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

export default function TestForm() {
  const { form, setForm, resetForm, setSessionId } = useAppStore();
  const [isRunning, setIsRunning] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    setSessionId(null); // reset UI if running again

    // Dev endpoint if localhost, otherwise /api/test
    const endpoint = process.env.NODE_ENV === 'development' ? 'http://localhost:8080/api/test' : '/api/test';

    try {
      const token = useAuthStore.getState().token;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          protocol: form.protocol,
          connection: { host: form.host, port: Number(form.port), username: form.username },
          auth: {
            type: form.authType,
            password: form.password,
            private_key: form.privateKey,
            private_key_passphrase: form.privateKeyPassphrase,
          },
          ssh_options: {
            timeout_seconds: Number(form.timeoutSeconds),
            host_key_check: form.hostKeyCheck,
            jump_host: form.jumpHost || null,
            jump_host_auth_type: form.jumpHostAuthType,
            jump_host_password: form.jumpHostPassword,
            jump_host_key: form.jumpHostKey,
          },
          sftp_options: (form.protocol === 'sftp') ? {
            test_path: form.sftpTestPath,
            max_packet: Number(form.sftpMaxPacket),
            operations: form.sftpOperations,
          } : undefined,
          ftp_options: (form.protocol === 'ftp' || form.protocol === 'ftps') ? {
            passive_mode: form.ftpPassiveMode,
            tls_mode: form.ftpTlsMode,
            skip_tls_verify: form.ftpSkipTlsVerify,
            dial_timeout_seconds: Number(form.ftpDialTimeoutSeconds),
            test_path: form.ftpTestPath,
            operations: form.ftpOperations,
          } : undefined
        }),
      });
      
      const data = await response.json();
      if (response.ok && data.session_id) {
        setSessionId(data.session_id);
      } else {
        alert("Failed to start test: " + data.error);
      }
    } catch (err) {
      alert("Error calling API: " + err);
    } finally {
      setIsRunning(false);
    }
  };

  const protocols = ['ssh', 'sftp', 'ftp', 'ftps'];

  return (
    <form onSubmit={handleSubmit} className="space-y-8 flex flex-col h-full">
      
      {/* Protocol Tabs */}
      <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800">
        {protocols.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setForm({ protocol: p });
              if(p==='ftp') setForm({port:21});
              else if(p==='ftps') setForm({port:990});
              else setForm({port:22});
            }}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md capitalize transition-colors ${
              form.protocol === p 
                ? 'bg-neutral-800 text-white shadow-sm' 
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
            }`}
          >
            {p.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Connection Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 pb-2">Connection</h3>
        
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 sm:col-span-9 space-y-1.5">
            <label className="text-sm font-medium text-neutral-300">Host / IP *</label>
            <input 
              required
              type="text" 
              placeholder="192.168.1.1 or example.com"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-neutral-600"
              value={form.host}
              onChange={e => setForm({ host: e.target.value })}
            />
          </div>
          <div className="col-span-12 sm:col-span-3 space-y-1.5">
            <label className="text-sm font-medium text-neutral-300">Port *</label>
            <input 
              required
              type="number" 
              className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              value={form.port}
              onChange={e => setForm({ port: parseInt(e.target.value) || 22 })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-300">Username *</label>
          <input 
            required
            type="text" 
            placeholder="root"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-neutral-600"
            value={form.username}
            onChange={e => setForm({ username: e.target.value })}
          />
        </div>
      </div>

      {/* Auth Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 pb-2">Authentication</h3>
        
        <div className="flex flex-wrap gap-4 pt-1">
          {[
            { id: 'password', label: 'Password' },
            { id: 'key', label: 'Private Key' },
            { id: 'keyboard_interactive', label: 'Keyboard Interactive' },
          ].map(opt => (
            <label key={opt.id} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="authType"
                className="w-4 h-4 text-emerald-500 bg-neutral-950 border-neutral-700 rounded-full focus:ring-emerald-500 focus:ring-offset-neutral-900"
                checked={form.authType === opt.id}
                onChange={() => setForm({ authType: opt.id as any })}
              />
              <span className={`text-sm font-medium group-hover:text-emerald-400 transition-colors ${form.authType === opt.id ? 'text-white' : 'text-neutral-400'}`}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>

        {form.authType === 'password' && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="text-sm font-medium text-neutral-300">Password</label>
            <div className="relative">
              <input 
                type={showPwd ? "text" : "password"} 
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 pr-10 text-sm text-neutral-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-neutral-600"
                placeholder="••••••••••••"
                value={form.password || ''}
                onChange={e => setForm({ password: e.target.value })}
              />
              <button 
                type="button" 
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-[10px] text-neutral-500 hover:text-white transition-colors"
                title={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}

        {form.authType === 'key' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 border border-neutral-800 p-4 rounded-lg bg-neutral-950/50">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-300 flex justify-between">
                <span>Private Key *</span>
              </label>
              <textarea 
                required
                className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 font-mono text-xs text-neutral-300 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-neutral-700"
                placeholder={"-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----"}
                value={form.privateKey || ''}
                onChange={e => setForm({ privateKey: e.target.value })}
              />
              <p className="text-xs text-emerald-500/70 py-1">Your key is never stored. It is only used in memory for this session.</p>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-300">Passphrase (Optional)</label>
              <input 
                type="password" 
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-neutral-600"
                value={form.privateKeyPassphrase || ''}
                onChange={e => setForm({ privateKeyPassphrase: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Advanced SSH Options Dropdown */}
      <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950/30">
        <button 
          type="button" 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-4 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
        >
          <span>Advanced {form.protocol.toUpperCase()} Options</span>
          {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        {showAdvanced && (
          <div className="p-4 border-t border-neutral-800 grid grid-cols-2 gap-4 animate-in fade-in duration-300">
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400">Timeout (sec)</label>
              <input 
                type="number"
                min="1" max="60"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 outline-none"
                value={form.timeoutSeconds}
                onChange={e => setForm({ timeoutSeconds: parseInt(e.target.value) || 10 })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400">Host Key Check</label>
              <select 
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 outline-none"
                value={form.hostKeyCheck}
                onChange={e => setForm({ hostKeyCheck: e.target.value })}
              >
                <option value="accept_new">Accept New</option>
                <option value="ignore">Ignore</option>
                <option value="strict">Strict</option>
              </select>
            </div>
            
            {/* Jump Host */}
            {(form.protocol === 'ssh' || form.protocol === 'sftp') && (
              <div className="col-span-2 space-y-3 pt-2 mt-2 border-t border-neutral-800">
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400">Jump Host (user@bastion.com:22)</label>
                  <input 
                    type="text"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 outline-none"
                    value={form.jumpHost || ''}
                    onChange={e => setForm({ jumpHost: e.target.value })}
                  />
                </div>
                {form.jumpHost && (
                  <div className="space-y-3 bg-neutral-900/50 p-3 rounded-lg border border-neutral-800/50">
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400">Jump Host Auth Type</label>
                      <select 
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 outline-none"
                        value={form.jumpHostAuthType}
                        onChange={e => setForm({ jumpHostAuthType: e.target.value })}
                      >
                        <option value="same">Same as target</option>
                        <option value="password">Password</option>
                        <option value="key">Private Key</option>
                      </select>
                    </div>
                    {form.jumpHostAuthType === 'password' && (
                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400">Jump Password</label>
                        <input 
                          type="password"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 outline-none"
                          value={form.jumpHostPassword || ''}
                          onChange={e => setForm({ jumpHostPassword: e.target.value })}
                        />
                      </div>
                    )}
                    {form.jumpHostAuthType === 'key' && (
                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400">Jump Private Key</label>
                        <textarea 
                          className="w-full h-20 bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 font-mono text-xs text-neutral-300 outline-none"
                          value={form.jumpHostKey || ''}
                          onChange={e => setForm({ jumpHostKey: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* SFTP Options */}
            {form.protocol === 'sftp' && (
              <div className="col-span-2 space-y-3 pt-2 mt-2 border-t border-neutral-800">
                <h4 className="text-xs font-semibold text-neutral-300 uppercase">SFTP Test Options</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-400">Test Path</label>
                    <input 
                      type="text"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 outline-none"
                      value={form.sftpTestPath || ''}
                      onChange={e => setForm({ sftpTestPath: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-400">Max Packet Size</label>
                    <input 
                      type="number"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 outline-none"
                      value={form.sftpMaxPacket || 32768}
                      onChange={e => setForm({ sftpMaxPacket: parseInt(e.target.value) || 32768 })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* FTP Options */}
            {(form.protocol === 'ftp' || form.protocol === 'ftps') && (
              <div className="col-span-2 space-y-3 pt-2 mt-2 border-t border-neutral-800">
                <h4 className="text-xs font-semibold text-neutral-300 uppercase">FTP Options</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-400">Test Path</label>
                    <input 
                      type="text"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 outline-none"
                      value={form.ftpTestPath || ''}
                      onChange={e => setForm({ ftpTestPath: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm text-neutral-300 mt-6">
                      <input 
                        type="checkbox"
                        checked={form.ftpPassiveMode}
                        onChange={e => setForm({ ftpPassiveMode: e.target.checked })}
                      />
                      Passive Mode (PASV)
                    </label>
                  </div>
                  {form.protocol === 'ftps' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400">TLS Mode</label>
                        <select 
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 outline-none"
                          value={form.ftpTlsMode}
                          onChange={e => setForm({ ftpTlsMode: e.target.value })}
                        >
                          <option value="explicit">Explicit (STARTTLS)</option>
                          <option value="implicit">Implicit</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm text-neutral-300 mt-6">
                          <input 
                            type="checkbox"
                            checked={form.ftpSkipTlsVerify}
                            onChange={e => setForm({ ftpSkipTlsVerify: e.target.checked })}
                          />
                          Skip TLS Verify
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>

      {/* Form Action Buttons */}
      <div className="pt-4 flex items-center justify-between mt-auto border-t border-neutral-800">
        <button 
          type="button" 
          onClick={resetForm}
          className="text-sm font-medium text-neutral-400 hover:text-white px-4 py-2 flex items-center gap-2 transition-colors"
        >
          <RotateCcw size={16} />
          Clear form
        </button>
        
        <button 
          type="submit" 
          disabled={isRunning}
          className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all ${
            isRunning 
              ? 'bg-emerald-600/50 cursor-not-allowed' 
              : 'bg-emerald-600 hover:bg-emerald-500 hover:-translate-y-0.5 hover:shadow-emerald-500/20 shadow-emerald-500/10'
          }`}
        >
          {isRunning ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Running...
            </>
          ) : (
            <>
              <Play size={18} fill="currentColor" />
              Run Test
            </>
          )}
        </button>
      </div>

    </form>
  );
}
