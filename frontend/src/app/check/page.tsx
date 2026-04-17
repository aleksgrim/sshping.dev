'use client';

import TestForm from '../../components/test-form/TestForm';
import LogViewer from '../../components/log-viewer/LogViewer';
import { useAppStore } from '../../lib/store';
import TokenModal from '../../components/TokenModal';

export default function Home() {
  const sessionId = useAppStore(state => state.sessionId);

  return (
    <>
      <TokenModal />
      <main className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-4 sm:p-8">
        <div className="max-w-5xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Form */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
              <TestForm />
            </div>

          {/* Right Column: Log Viewer */}
          {sessionId && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col h-full shadow-xl overflow-hidden sticky top-8">
              <LogViewer />
            </div>
          )}
        </div>

        {/* Information Section */}
        <div className="max-w-5xl mx-auto mt-12 bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-8 shadow-inner">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-emerald-500 text-2xl">💡</span> How to use Single Ping
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-neutral-400 text-sm leading-relaxed">
            <div>
              <strong className="text-white block mb-2">Basic Connectivity Test (Port Ping)</strong>
              <p>Enter the target Host IP and Port (default 22). By leaving the Username, Password, and Private Key fields completely empty, SSHping will just verify if the port is open and reachable over the network without attempting to authenticate.</p>
            </div>
            <div>
              <strong className="text-white block mb-2">Full Authentication Test</strong>
              <p>Provide a Username and Password (or Private Key) to perform a full connection test. For SSH, the log will show successful authentication. For SFTP/FTP/FTPS protocols, you can optionally execute a test command like <code className="bg-black px-1.5 rounded text-emerald-400">LIST</code> to verify directory parsing and access rights.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
