'use client';

import { useState } from 'react';
import BulkForm, { ParsedServer } from '../../components/bulk/BulkForm';
import BulkResults from '../../components/bulk/BulkResults';
import TokenModal from '../../components/TokenModal';
import { Server } from 'lucide-react';

export interface BulkRunState {
  servers: ParsedServer[];
  isRunning: boolean;
  globalOptions: any;
}

export default function BulkPage() {
  const [runState, setRunState] = useState<BulkRunState | null>(null);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 font-sans">
      <>
        <TokenModal />
        <div className="max-w-7xl mx-auto p-4 sm:p-8 w-full">
          <header className="mb-6">
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Server className="text-pink-500" />
              Bulk Ping
            </h1>
            <p className="text-neutral-400 mt-1">Test multiple connections at once.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
              <BulkForm onRun={(servers, globalOpts) => {
                // Create clean run state
                const initialized = servers.map(s => ({...s, status: 'pending' as const, sessionId: null, logs: []}));
                setRunState({ servers: initialized, isRunning: true, globalOptions: globalOpts });
              }} isRunning={runState?.isRunning || false} />
            </div>

            <div className="lg:col-span-8">
               {runState ? (
                 <BulkResults 
                   runState={runState} 
                   onComplete={() => setRunState(prev => prev ? {...prev, isRunning: false} : null)}
                 />
               ) : (
                 <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-12 text-center text-neutral-500 shadow-inner">
                   Add servers and click Run Test to see results here.
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="max-w-7xl mx-auto mt-12 mb-12 bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-8 shadow-inner">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-pink-500 text-2xl">🚀</span> How to use Bulk Ping
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-neutral-400 text-sm leading-relaxed">
            <div>
              <strong className="text-white block mb-2">Mass Parallel Testing</strong>
              <p>Paste multiple servers into the text area. You can input them as URLs (<code className="bg-black px-1.5 rounded text-emerald-400">sftp://root:pass@ip:port</code>) or in CSV format (<code className="bg-black px-1.5 rounded text-emerald-400">ssh, ip, port, user, pass</code>). SSHping will spawn Go routines and ping all of them simultaneously in a fraction of a second.</p>
            </div>
            <div>
              <strong className="text-white block mb-2">Global Settings Override</strong>
              <p>If your servers share the same credentials (e.g., identical passwords or private keys), you don't need to repeat them! Just leave the individual credential fields empty and configure them globally using the "Global Settings" panel.</p>
            </div>
          </div>
        </div>
      </>
    </main>
  );
}
