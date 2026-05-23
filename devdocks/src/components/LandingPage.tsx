import React from 'react';
import { motion } from 'motion/react';
import { Terminal, Bot, Sparkles, Code2, ArrowRight, ShieldCheck, Zap, LogOut } from 'lucide-react';
import { AuthUser } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  currentUser: AuthUser;
  onSignOut: () => void;
}

export default function LandingPage({ onGetStarted, currentUser, onSignOut }: LandingPageProps) {
  const theme: 'dark' | 'light' = 'dark';

  return (
    <div className={`relative min-h-screen flex flex-col justify-between overflow-hidden font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0d1117] text-[#c9d1d9]' : 'bg-white text-slate-900'
    }`}>
      
      {/* Geometric grid design - thin sharp lines */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div style={{
          backgroundImage: `linear-gradient(to right, ${theme === 'dark' ? '#1f242c' : '#e5e7eb'} 1px, transparent 1px), linear-gradient(to bottom, ${theme === 'dark' ? '#1f242c' : '#e5e7eb'} 1px, transparent 1px)`,
          backgroundSize: '3rem 3rem'
        }} className="absolute inset-0 opacity-30" />
        
        {/* Subtle, structured geometric highlights */}
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[40%] -right-[10%] w-[45%] h-[45%] rounded-full bg-slate-500/5 blur-[130px] animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      {/* Structured grid decorative shapes instead of floaters or generic shapes */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute top-[15%] left-[8%] w-16 h-16 border rounded-lg flex items-center justify-center font-mono text-[9px] select-none ${
          theme === 'dark' ? 'border-[#30363d]/40 text-[#8b949e]/30' : 'border-slate-300/40 text-slate-400/30'
        }`}>
          <span>//01</span>
        </div>
        <div style={{
          backgroundImage: `linear-gradient(to right, ${theme === 'dark' ? 'rgba(59,130,246,0.2)' : 'rgba(96,165,250,0.2)'}, transparent)`
        }} className="absolute top-[35%] right-[10%] w-[120px] h-1 rounded" />
        <div className={`absolute bottom-[20%] left-[5%] w-24 h-24 rounded-full flex items-center justify-center font-mono text-[8px] select-none animate-spin-slow ${
          theme === 'dark' ? 'border border-[#30363d]/30 text-[#8b949e]/20' : 'border border-slate-300/30 text-slate-400/20'
        }`}>
          <span>RUN // OK</span>
        </div>
      </div>

      {/* Top Header Navigation */}
      <header className={`relative w-full max-w-7xl mx-auto px-6 h-16 flex items-center justify-between z-10 border-b backdrop-blur-md transition-colors ${
        theme === 'dark' ? 'border-[#30363d] bg-[#161b22]/90' : 'border-slate-200 bg-slate-50/90'
      }`}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-purple-600 flex items-center justify-center shadow-md">
            <span className="text-white text-[11px] font-black">DD</span>
          </div>
          <span className={`font-sans text-sm font-bold tracking-tight transition-colors ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            DevDocks
          </span>
        </div>
        <div className="flex items-center gap-3">
        <div className={`hidden sm:flex items-center gap-3 text-xs font-mono px-3 py-1.5 rounded-md border transition-colors ${
          theme === 'dark'
            ? 'border-[#30363d] text-[#8b949e] bg-[#0d1117]'
            : 'border-slate-200 text-slate-600 bg-slate-100'
        }`}>
          <span>{currentUser.name}</span>
          <span className="h-3 w-px bg-[#30363d]"></span>
          <span>v1.0.0 Stable</span>
          <span className="h-2 w-2 rounded-full bg-[#238636] animate-pulse"></span>
          <span>Web Sandbox</span>
        </div>
        <button
          onClick={onSignOut}
          className="h-8 w-8 rounded border border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white hover:bg-[#1f242c] hover:border-[#c084fc]/60 transition flex items-center justify-center"
          title="Sign out"
        >
          <LogOut size={14} />
        </button>
        </div>
      </header>

      {/* Main Focus Hero Section */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 z-10 py-16">
        <div className="max-w-4xl text-center flex flex-col items-center">
          
          {/* Structured Tagline Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`inline-flex items-center gap-2 px-3 py-1 border text-xs font-mono tracking-wider mb-8 rounded transition-colors ${
              theme === 'dark'
                ? 'bg-[#161b22] border-[#30363d] text-[#c084fc]'
                : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
            }`}
          >
            <Sparkles size={12} className={theme === 'dark' ? 'text-[#c084fc]' : 'text-purple-400'} />
            <span>GEOMETRIC BALANCE INSPIRED IDE</span>
          </motion.div>

          {/* Heading Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className={`font-sans text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            Browser coding. <span className={theme === 'dark' ? 'text-[#c084fc]' : 'text-purple-400'}>Re-imagined.</span>
          </motion.h1>

          {/* Description Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className={`text-sm sm:text-base max-w-xl mb-10 font-sans tracking-wide leading-relaxed transition-colors ${
              theme === 'dark' ? 'text-[#8b949e]' : 'text-slate-600'
            }`}
          >
            Initialize, develop, and preview sandbox templates instantly. A complete virtual environment with built-in runtime packages, system activity logs, and a beautiful interface.
          </motion.p>

          {/* Get Started Button - Classic GitHub Green Accent */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            <button
              onClick={onGetStarted}
              className="group relative h-11 px-6 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-xs tracking-wider flex items-center gap-2 shadow-lg cursor-pointer active:scale-98 transition transform duration-150 border-0"
            >
              <span>MOUNT DEVDOCKS WORKSPACE</span>
              <ArrowRight size={13} className="text-white group-hover:translate-x-1 transition duration-150" />
            </button>
          </motion.div>

          {/* Cinematic Interactive Dashboard Mockup Render */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="w-full max-w-3xl mt-14 p-1.5 rounded-lg bg-[#161b22] border border-[#30363d] shadow-2xl relative overflow-hidden"
          >
            {/* Header controls render mockup */}
            <div className="w-full flex items-center justify-between px-3 py-2 bg-[#0d1117] rounded-t-md border-b border-[#30363d] text-[#8b949e] font-mono text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#ff5f56]" />
                <span className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
                <span className="h-2 w-2 rounded-full bg-[#27c93f]" />
              </div>
              <span className="text-[#8b949e]">workspace-session_main_compiler.tsx</span>
              <span className="text-[#238636] font-semibold">Ready</span>
            </div>

            {/* Inner code mock */}
            <div className="p-5 text-left bg-[#0d1117] font-mono text-xs text-[#c9d1d9] leading-relaxed overflow-hidden whitespace-nowrap">
              <p><span className="text-[#ff7b72]">import</span> React <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">'react'</span>;</p>
              <p><span className="text-[#ff7b72]">import</span> &#123; createStore &#125; <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">'zustand'</span>;</p>
              <p><span className="text-[#8b949e]">// Booting isolated sandboxed engine variables</span></p>
              <p><span className="text-[#ff7b72]">export default function</span> <span className="text-[#d2a8ff]">DevDocksCore</span>() &#123;</p>
              <p className="pl-4">const [status, setStatus] = React.useState(<span className="text-[#a5d6ff]">'active_preview'</span>);</p>
              <p className="pl-4">return &lt;<span className="text-[#7ee787]">div</span> className=<span className="text-[#a5d6ff]">&quot;bg-[#161b22] border border-[#30363d] p-6&quot;</span>&gt;</p>
              <p className="pl-8">&lt;<span className="text-[#7ee787]">h2</span> className=<span className="text-[#79c0ff]">&quot;text-white&quot;</span>&gt;Runtime Active Framework: React 18 + Compiling&lt;/<span className="text-[#7ee787]">h2</span>&gt;</p>
              <p className="pl-4">&lt;/<span className="text-[#7ee787]">div</span>&gt;</p>
              <p>&#125;</p>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="relative w-full max-w-7xl mx-auto px-6 h-12 flex items-center justify-between z-10 text-[11px] text-[#8b949e] border-t border-[#30363d] bg-[#161b22]/40">
        <span>&copy; 2026 DevDocks IDE. Designed with Geometric Balance.</span>
        <div className="flex gap-4">
          <span className="hover:text-white transition duration-150 cursor-pointer">Security</span>
          <span className="hover:text-white transition duration-150 cursor-pointer">Developer Docs</span>
          <span className="hover:text-white transition duration-150 cursor-pointer">Settings</span>
        </div>
      </footer>

    </div>
  );
}

