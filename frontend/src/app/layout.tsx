import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SSHping",
  description: "Ping your servers. Trust your setup.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-200">
        <header className="bg-[#0A1B16]/95 backdrop-blur-md border-b border-[#122A22] sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
            <a href="/" className="font-extrabold text-white flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <span className="text-sm">⚡</span>
              </div>
              <span className="text-lg tracking-tight flex items-center">
                SSH<span className="text-neutral-400 font-medium">ping</span>
              </span>
            </a>
            <div className="flex gap-1 bg-neutral-900/50 p-1 rounded-lg border border-neutral-800/50">
              <a href="/check" className="text-sm px-4 py-1.5 rounded-md text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all font-medium">Single Ping</a>
              <a href="/bulk" className="text-sm px-4 py-1.5 rounded-md text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all font-medium">Bulk Ping</a>
            </div>
          </div>
        </header>
        
        <div className="flex-1 flex flex-col">
          {children}
        </div>

        <footer className="border-t border-neutral-800 bg-black mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between text-sm text-neutral-500 gap-4">
            <p className="flex items-center gap-1.5 flex-wrap">
              Made with <span className="text-rose-500">❤️</span> by 
              <a href="https://alexgrim.xyz/" target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-emerald-400 transition-colors font-medium ml-0.5 border-b border-dashed border-neutral-600 hover:border-emerald-400 pb-0.5">
                Alex Grim
              </a>
              <span className="mx-2 text-neutral-800">|</span>
              <a href="https://github.com/aleksgrim/sshping.dev" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors font-medium flex items-center gap-1">
                Open Source
              </a>
            </p>
            <p className="flex items-center gap-2">
              Powered by 
              <span className="px-2 py-1 rounded bg-cyan-950/50 text-cyan-400 text-xs font-semibold border border-cyan-900/50">Go</span>
              <span className="px-2 py-1 rounded bg-neutral-900 text-neutral-200 text-xs font-semibold border border-neutral-800">Next.js</span>
              <span className="px-2 py-1 rounded bg-blue-950/50 text-blue-400 text-xs font-semibold border border-blue-900/50">Docker</span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
