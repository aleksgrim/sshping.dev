'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/store';
import { Lock, KeyRound, ArrowRight, Loader2 } from 'lucide-react';

export default function TokenModal() {
  const [mounted, setMounted] = useState(false);
  const [isAuthRequired, setIsAuthRequired] = useState<boolean | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { token, setToken } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.auth_required === false || data.logged_in === true) {
          setToken('authenticated_session');
        }
        setIsAuthRequired(data.auth_required);
      })
      .catch(() => setIsAuthRequired(true));
  }, [setToken]);

  // Avoid hydration mismatch
  if (!mounted || token || isAuthRequired === false) return null;
  if (isAuthRequired === null) return null;

  return (
    <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6">
          <Lock className="text-emerald-400" size={28} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Private Access</h2>
        <p className="text-neutral-400 text-sm mb-6">
          This instance of SSHping is secured by the administrator. Please enter your token to continue.
        </p>

        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!inputVal.trim() || isLoading) return;
          setIsLoading(true);
          setErrorMsg('');
          try {
            const res = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: inputVal.trim() })
            });
            if (res.ok) {
              setToken('secure_cookie_active');
            } else {
              setErrorMsg('Invalid token. Access denied.');
            }
          } catch (err) {
            setErrorMsg('Network error.');
          } finally {
            setIsLoading(false);
          }
        }} className="w-full relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            <KeyRound size={18} />
          </div>
          <input 
            type="password"
            autoFocus
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value); setErrorMsg(''); }}
            placeholder="Enter token..."
            className={`w-full bg-black border ${errorMsg ? 'border-red-500 focus:ring-red-500' : 'border-neutral-800 focus:border-emerald-500 focus:ring-emerald-500'} rounded-lg py-3 pl-10 pr-12 text-white focus:outline-none focus:ring-1 transition-all font-mono text-sm`}
          />
          <button type="submit" disabled={!inputVal.trim() || isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 text-black font-bold rounded-md disabled:bg-neutral-800 disabled:text-neutral-500 hover:bg-emerald-400 transition-colors">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} strokeWidth={3} />}
          </button>
        </form>
        {errorMsg && <p className="text-red-400 text-xs mt-3">{errorMsg}</p>}
      </div>
    </div>
  );
}
