import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, User, ArrowRight } from 'lucide-react';
import DevDocksLogo from './DevDocksLogo';

interface AuthPageProps {
  onSignIn: (email: string, password: string) => { ok: boolean; message?: string };
  onSignUp: (name: string, email: string, password: string) => { ok: boolean; message?: string };
}

export default function AuthPage({ onSignIn, onSignUp }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim() || (mode === 'signup' && !name.trim())) {
      setError('fill the required details');
      return;
    }

    const result = mode === 'signup'
      ? onSignUp(name, email, password)
      : onSignIn(email, password);

    if (!result.ok) setError(result.message || 'Authentication failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex items-center justify-center p-6 font-sans overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{
        backgroundImage: 'linear-gradient(to right, #1f242c 1px, transparent 1px), linear-gradient(to bottom, #1f242c 1px, transparent 1px)',
        backgroundSize: '3rem 3rem'
      }} />
      <motion.div
        className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.main
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-sm border border-[#30363d] bg-[#161b22] rounded-lg shadow-2xl overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
        <div className="p-6 border-b border-[#30363d]">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -4 }}
              className="shadow-md shadow-purple-950/40"
            >
              <DevDocksLogo className="h-9 w-9" />
            </motion.div>
            <div>
              <h1 className="text-base font-bold text-white">DevDocks</h1>
              <p className="text-xs text-[#8b949e]">Sign in to your workspace</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded bg-[#0d1117] border border-[#30363d]">
            {(['login', 'signup'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setError('');
                }}
                className={`h-8 rounded text-xs font-semibold transition ${
                  mode === item
                    ? 'bg-purple-600 text-white shadow shadow-purple-950/40'
                    : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
                }`}
              >
                {item === 'login' ? 'Login' : 'Sign up'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="popLayout">
            {mode === 'signup' && (
              <motion.label
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="block overflow-hidden"
              >
                <span className="text-[11px] font-mono text-[#8b949e]">Name</span>
                <div className="mt-1 h-10 flex items-center gap-2 px-3 rounded border border-[#30363d] bg-[#0d1117] transition focus-within:border-purple-400 focus-within:shadow-[0_0_0_3px_rgba(168,85,247,0.14)]">
                  <User size={14} className="text-[#8b949e]" />
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full bg-transparent outline-none text-sm text-white placeholder:text-[#6e7681]"
                    placeholder="Your name"
                  />
                </div>
              </motion.label>
            )}
          </AnimatePresence>

          <label className="block">
            <span className="text-[11px] font-mono text-[#8b949e]">Email</span>
            <div className="mt-1 h-10 flex items-center gap-2 px-3 rounded border border-[#30363d] bg-[#0d1117] transition focus-within:border-purple-400 focus-within:shadow-[0_0_0_3px_rgba(168,85,247,0.14)]">
              <Mail size={14} className="text-[#8b949e]" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent outline-none text-sm text-white placeholder:text-[#6e7681]"
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[11px] font-mono text-[#8b949e]">Password</span>
            <div className="mt-1 h-10 flex items-center gap-2 px-3 rounded border border-[#30363d] bg-[#0d1117] transition focus-within:border-purple-400 focus-within:shadow-[0_0_0_3px_rgba(168,85,247,0.14)]">
              <Lock size={14} className="text-[#8b949e]" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent outline-none text-sm text-white placeholder:text-[#6e7681]"
                placeholder="Minimum 6 characters"
              />
            </div>
          </label>

          {error && (
            <div className="rounded border border-[#ff7b72]/30 bg-[#3b111a] px-3 py-2 text-xs text-[#ffb3ad]">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="group h-10 w-full rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.99] shadow-lg shadow-purple-950/30"
          >
            <span>{mode === 'signup' ? 'Create account' : 'Login'}</span>
            <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
          </button>
        </form>
      </motion.main>
    </div>
  );
}

