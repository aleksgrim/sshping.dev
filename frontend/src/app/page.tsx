'use client';

import { Terminal, Shield, Zap, DownloadCloud, ArrowRight, Code2, Globe2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-neutral-200 overflow-x-hidden font-sans">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-black to-black pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-sm text-neutral-300 mb-8 mt-8 hover:border-emerald-500/50 transition-colors">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Open Source v1.0 is Live
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8">
            Ping your servers.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600">Trust your setup.</span>
          </h1>
          
          <p className="text-neutral-400 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            A self-hosted, extremely fast, completely stateless web tool to test SSH, SFTP, and FTP connections. Run massive bulk tests in parallel without exposing credentials.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/check" className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2">
              Launch App <ArrowRight size={18} />
            </a>
            <a href="https://github.com/aleksgrim/sshping.dev" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 py-4 bg-neutral-900 border border-neutral-800 text-white font-bold rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 border-t border-neutral-800 bg-neutral-950/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Why use SSHping?</h2>
            <p className="text-neutral-400">Everything you need to debug connection issues at scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield className="text-emerald-400" size={24} />}
              title="100% Stateless"
              desc="No databases, no logs. Your credentials live in RAM for exactly as long as the test takes, then disappear forever."
            />
            <FeatureCard 
              icon={<Zap className="text-yellow-400" size={24} />}
              title="Parallel Execution"
              desc="Test 1 or 1,000 servers simultaneously. We leverage Go routines for massive, instantaneous concurrency."
            />
            <FeatureCard 
              icon={<Globe2 className="text-blue-400" size={24} />}
              title="Multi-Protocol"
              desc="We speak SSH, SFTP, and FTP(S). List directories, upload files, read outputs, and delete targets all from a browser."
            />
            <FeatureCard 
              icon={<Code2 className="text-pink-400" size={24} />}
              title="Go & Next.js"
              desc="Built with Next.js 16 Static Export and a lightning-fast Go Fiber backend. Ship everything as an 18MB Docker image."
            />
            <FeatureCard 
              icon={<DownloadCloud className="text-purple-400" size={24} />}
              title="Bastion Hosts"
              desc="Full support for SSH and SFTP over Jump Hosts (Bastions), securely managed via memory-piped SSH dials."
            />
            <FeatureCard 
              icon={<Terminal className="text-cyan-400" size={24} />}
              title="Private Tokens"
              desc="Deploy to the open internet safely. Your endpoints are protected by private tokens and local storage sessions."
            />
          </div>
        </div>
      </section>

      {/* Deploy & Downloads */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/10 to-black pointer-events-none"></div>
        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-12">Install in Seconds</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch text-left">
            {/* Left: How to run  */}
            <div className="bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl p-8 flex flex-col hover:border-neutral-700 transition-colors shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Terminal className="text-emerald-400" size={20} /> How to Run Locally</h3>
              <p className="text-neutral-400 text-sm mb-8">After downloading the standalone binary, simply make it executable and run it. Pass your private token to the environment variable.</p>
              
              <div className="bg-black border border-neutral-800 rounded-xl p-5 font-mono text-sm overflow-x-auto shadow-inner mt-auto">
                  <pre className="text-emerald-400">
                    <span className="text-neutral-500"># 1. Make the binary executable</span><br/>
                    chmod +x ./sshping-linux-amd64<br/><br/>
                    <span className="text-neutral-500"># 2. Start the service with your Auth Token</span><br/>
                    AUTH_TOKENS=<span className="text-pink-400">my_secret</span> ./sshping-linux-amd64
                  </pre>
              </div>
            </div>

            {/* Right: Binaries */}
            <div className="bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl p-8 flex flex-col hover:border-neutral-700 transition-colors shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><DownloadCloud className="text-blue-400" size={20} /> Standalone Binaries</h3>
              <p className="text-neutral-400 text-sm mb-8">Want to run it locally on your machine without Docker? Download the pre-compiled, lightning-fast Go binary for your OS.</p>
              
              <div className="mt-auto grid grid-cols-3 gap-4">
                <a href="https://github.com/aleksgrim/sshping.dev/releases/latest" target="_blank" rel="noopener noreferrer" className="bg-black border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-neutral-800 transition-colors gap-2 group">
                  <Terminal className="text-neutral-500 group-hover:text-emerald-400 transition-colors" size={24} />
                  <span className="text-xs font-bold text-neutral-300">Linux</span>
                </a>
                <a href="https://github.com/aleksgrim/sshping.dev/releases/latest" target="_blank" rel="noopener noreferrer" className="bg-black border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-neutral-800 transition-colors gap-2 group">
                  <Terminal className="text-neutral-500 group-hover:text-emerald-400 transition-colors" size={24} />
                  <span className="text-xs font-bold text-neutral-300">macOS</span>
                </a>
                <a href="https://github.com/aleksgrim/sshping.dev/releases/latest" target="_blank" rel="noopener noreferrer" className="bg-black border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-neutral-800 transition-colors gap-2 group">
                  <Terminal className="text-neutral-500 group-hover:text-emerald-400 transition-colors" size={24} />
                  <span className="text-xs font-bold text-neutral-300">Windows</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO & FAQ Section */}
      <section className="py-24 border-t border-neutral-800 bg-neutral-950/20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="prose prose-invert max-w-none text-neutral-400">
            <h2 className="text-3xl font-bold mb-6 text-white text-center">The Ultimate Open-Source Server Testing Tool</h2>
            <p className="mb-6 leading-relaxed text-center max-w-3xl mx-auto">
              When managing large-scale server infrastructure, network debugging can be tedious. SSHping empowers DevOps engineers, system administrators, and developers to instantly test node connectivity without writing custom bash scripts or juggling private keys in terminal windows. We built SSHping to support <strong className="text-emerald-400 font-semibold">parallel execution</strong> allowing you to mass-ping hundreds of servers using our intuitive Bulk Check utility.
            </p>
            <p className="mb-16 leading-relaxed text-center max-w-3xl mx-auto">
              Whether you are troubleshooting reverse proxies, verifying SFTP jump host (bastion) configurations, or checking legacy FTPS nodes, SSHping provides real-time streaming WebSocket logs straight to your browser. By deploying it via Docker on a private VPS, you gain an internal team utility that is completely <strong className="text-emerald-400 font-semibold">stateless and secure</strong>.
            </p>

            <h3 className="text-2xl font-bold mb-10 text-white text-center pb-8 border-b border-neutral-800/50">Frequently Asked Questions</h3>
            
            <div className="space-y-10">
              <div className="bg-neutral-900/40 p-6 rounded-xl border border-neutral-800/50 hover:border-neutral-700 transition-colors">
                <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Shield size={18} className="text-emerald-500" /> Are my server credentials safe?
                </h4>
                <p className="text-neutral-400 text-sm leading-relaxed">Absolutely. SSHping has no database. It does not cache or log credentials to disk. Your passwords and private keys are piped directly to the Go socket dialers in RAM and are destroyed by the garbage collector the moment the connection closes.</p>
              </div>
              
              <div className="bg-neutral-900/40 p-6 rounded-xl border border-neutral-800/50 hover:border-neutral-700 transition-colors">
                <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Globe2 size={18} className="text-blue-500" /> Can I expose SSHping to the public internet?
                </h4>
                <p className="text-neutral-400 text-sm leading-relaxed">Yes, but only if you use the built-in <code>AUTH_TOKENS</code> environment variable. By setting a secret token, all REST and WebSocket API endpoints are hidden behind an Authorization layer. This prevents bots from weaponizing your server for SSRF or brute-force attacks.</p>
              </div>

              <div className="bg-neutral-900/40 p-6 rounded-xl border border-neutral-800/50 hover:border-neutral-700 transition-colors">
                <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <DownloadCloud size={18} className="text-purple-500" /> Does it support Bastion / Jump Hosts?
                </h4>
                <p className="text-neutral-400 text-sm leading-relaxed">Yes! You can configure an intermediary Jump Host. The backend will establish a secure tunnel through the Bastion before executing your SSH or SFTP operations against the primary target, allowing secure testing within Private VPCs.</p>
              </div>

              <div className="bg-neutral-900/40 p-6 rounded-xl border border-neutral-800/50 hover:border-neutral-700 transition-colors">
                <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Terminal size={18} className="text-yellow-500" /> What FTP modes are supported?
                </h4>
                <p className="text-neutral-400 text-sm leading-relaxed">We support standard FTP, Explicit FTPS (FTP over TLS), and Implicit FTPS. You can also toggle Passive connection modes to bypass strict network NATs and firewalls.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-6 hover:bg-neutral-900 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-black border border-neutral-800 flex items-center justify-center mb-6 shadow-inner">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-neutral-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
