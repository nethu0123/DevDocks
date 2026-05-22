import React, { useState } from 'react';
import { Search, Package, Check, Trash2, HelpCircle, Code, X } from 'lucide-react';
import { Project } from '../types';

interface PackageDownloaderPanelProps {
  project: Project;
  onInstall: (packageName: string) => void;
  onUninstall: (packageName: string) => void;
}

const NPM_REGISTRY = [
  { name: 'zustand', desc: 'A small, fast, and scalable barebones state-management solution.', version: '^4.5.2', category: 'State Store' },
  { name: 'framer-motion', desc: 'A production-ready motion library for React.', version: '^11.0.0', category: 'Animations' },
  { name: 'lucide-react', desc: 'Beautiful & consistent pixel-perfect development icons.', version: '^0.354.0', category: 'Icons' },
  { name: 'axios', desc: 'Promise based HTTP client for the browser and node.js.', version: '^1.6.8', category: 'Networking' },
  { name: 'react-router-dom', desc: 'Declarative routing for React web applications.', version: '^6.22.3', category: 'Virtual Routing' },
  { name: 'clsx', desc: 'A tiny utility for constructing className strings conditionally.', version: '^2.1.1', category: 'Styling' },
  { name: 'lodash-es', desc: 'Lodash library exported as ES modules.', version: '^4.17.21', category: 'Utility' },
  { name: 'canvas-confetti', desc: 'Performant on-screen physics confetti bursts.', version: '^1.9.3', category: 'Animations' },
];

export default function PackageDownloaderPanel({
  project,
  onInstall,
  onUninstall
}: PackageDownloaderPanelProps) {
  const [query, setQuery] = useState('');
  const [customPackage, setCustomPackage] = useState('');

  const installed = project.installedPackages || [];

  const handleCustomInstall = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPackage.trim()) {
      onInstall(customPackage.trim().toLowerCase());
      setCustomPackage('');
    }
  };

  const filtered = NPM_REGISTRY.filter(pkg => 
    pkg.name.toLowerCase().includes(query.toLowerCase()) || 
    pkg.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      
      {/* Search and Custom Header */}
      <div className="p-3 border-b border-[#30363d] bg-[#161b22] shrink-0 space-y-2">
        {/* Marketplace search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-2.5 text-[#8b949e]" />
          <input
            type="text"
            placeholder="Search npm packages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded bg-[#0d1117] border border-[#30363d] text-xs text-[#c9d1d9] outline-none focus:border-[#58a6ff] placeholder-[#8b949e]"
          />
        </div>

        {/* Custom install input */}
        <form onSubmit={handleCustomInstall} className="flex gap-2">
          <input
            type="text"
            placeholder="Manual name (e.g. lodash)"
            value={customPackage}
            onChange={(e) => setCustomPackage(e.target.value)}
            className="flex-1 h-8 px-2.5 rounded text-[11px] outline-none bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] focus:border-[#58a6ff] placeholder-[#8b949e]/60"
          />
          <button
            type="submit"
            className="h-8 px-3 rounded bg-[#238636] text-white font-bold text-[10px] hover:bg-[#2ea043] transition cursor-pointer border-0"
          >
            ADD
          </button>
        </form>
      </div>

      {/* Primary body view */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* Installed dependencies lists */}
        <div>
          <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#8b949e] block mb-2">Installed Modules ({installed.length})</span>
          {installed.length === 0 ? (
            <div className="text-center py-4 bg-[#0d1117] border border-[#30363d] border-dashed rounded text-[#8b949e] text-[11px]">
              No packages installed.
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
              {installed.map((pkg) => (
                <div key={pkg} className="inline-flex items-center gap-1.5 pl-2 py-0.5 pr-0.5 rounded bg-[#161b22] border border-[#30363d] text-[#c9d1d9] text-[10px] font-mono">
                  <Package size={10} className="text-[#58a6ff]" />
                  <span>{pkg}</span>
                  <button
                    onClick={() => onUninstall(pkg)}
                    className="p-1 rounded text-[#8b949e] hover:text-red-400 hover:bg-[#0d1117] transition cursor-pointer"
                    title="Uninstall"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommend Registry items */}
        <div>
          <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#8b949e] block mb-2">Registry Recommendations</span>
          <div className="space-y-2">
            {filtered.map(pkg => {
              const isInstalled = installed.includes(pkg.name);
              return (
                <div key={pkg.name} className="p-3 rounded border border-[#30363d] bg-[#161b22] flex items-start justify-between gap-3 transition hover:bg-[#1f242c]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-white">{pkg.name}</span>
                      <span className="text-[8px] font-mono text-[#8b949e]">{pkg.version}</span>
                    </div>
                    <p className="text-[10px] text-[#8b949e] mt-1.5 leading-normal">{pkg.desc}</p>
                    <span className="text-[8px] font-mono text-[#58a6ff] bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20 inline-block mt-2">
                      {pkg.category}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => isInstalled ? onUninstall(pkg.name) : onInstall(pkg.name)}
                    className={`group h-6 px-2.5 rounded text-[10px] font-bold border flex items-center gap-1 shrink-0 cursor-pointer transition ${
                      isInstalled
                        ? 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-[#ff7b72] hover:border-[#ff7b72]/45 hover:bg-red-500/10'
                        : 'bg-[#1f6feb] border-0 text-white hover:bg-[#388bfd]'
                    }`}
                  >
                    {isInstalled ? (
                      <>
                        <Check size={10} strokeWidth={2.5} className="group-hover:hidden" />
                        <X size={10} className="hidden group-hover:inline text-[#ff7b72]" />
                        <span className="group-hover:hidden">Active</span>
                        <span className="hidden group-hover:inline text-[#ff7b72]">Remove</span>
                      </>
                    ) : (
                      <span>Install</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
