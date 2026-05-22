import React, { useState } from 'react';
import { Search, Puzzle, Check, Download, AlertTriangle, X } from 'lucide-react';
import { Project } from '../types';

interface ExtensionDownloaderPanelProps {
  project: Project;
  onInstall: (extId: string) => void;
  onUninstall: (extId: string) => void;
}

const ALL_EXTENSIONS = [
  { id: 'Prettier', name: 'Prettier Formatter', desc: 'Auto formats code on save (Ctrl + S)', category: 'Formatter', downloads: '18M', rating: '4.8' },
  { id: 'ESLint', name: 'ESLint', desc: 'Validates JavaScript & JSX logic rules', category: 'Linter', downloads: '24M', rating: '4.7' },
  { id: 'React Snippets', name: 'React Snippets', desc: 'Hooks & functional components shortcut sheets', category: 'React', downloads: '11M', rating: '4.9' },
  { id: 'Tailwind IntelliSense', name: 'Tailwind CSS IntelliSense', desc: 'Autocomplete helper for class tags', category: 'Styling', downloads: '8M', rating: '4.9' },
  { id: 'TypeScript Tools', name: 'TypeScript Tools', desc: 'Auto type inference & symbol peek definitions', category: 'TypeScript', downloads: '9M', rating: '4.8' },
  { id: 'GitLens Lite', name: 'GitLens Lite', desc: 'Inspect virtual repository commit history logs', category: 'Utilities', downloads: '4M', rating: '4.6' },
  { id: 'Sass Compiler', name: 'Sass CSS Compiler', desc: 'Compiles custom nested sass rules to styling standard', category: 'Compiler', downloads: '2M', rating: '4.3' },
  { id: 'Live Share Sandbox', name: 'Live Share Sandbox', desc: 'Expose local iframe preview targets', category: 'Collaboration', downloads: '1M', rating: '4.5' },
];


export default function ExtensionDownloaderPanel({
  project,
  onInstall,
  onUninstall
}: ExtensionDownloaderPanelProps) {
  const [query, setQuery] = useState('');
  const [dismissedRecommended, setDismissedRecommended] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('devdocks_dismissed_recommendations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const installed = project.installedExtensions || [];

  // Recommend based on techStack
  const isRecommended = (extId: string) => {
    if (extId === 'React Snippets' && project.techStack.includes('React')) return true;
    if (extId === 'Tailwind IntelliSense' && project.techStack.includes('Tailwind CSS')) return true;
    if (extId === 'TypeScript Tools' && project.techStack.includes('TypeScript')) return true;
    if (extId === 'Prettier' || extId === 'ESLint') return true;
    return false;
  };

  const handleDismiss = (extId: string) => {
    const updated = [...dismissedRecommended, extId];
    setDismissedRecommended(updated);
    try {
      localStorage.setItem('devdocks_dismissed_recommendations', JSON.stringify(updated));
    } catch (e) {}
  };

  const filtered = ALL_EXTENSIONS.filter(ext => 
    ext.name.toLowerCase().includes(query.toLowerCase()) || 
    ext.category.toLowerCase().includes(query.toLowerCase())
  );

  const activeRecommendations = filtered.filter(e => isRecommended(e.id) && !dismissedRecommended.includes(e.id));

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      
      {/* Search Header */}
      <div className="p-3 border-b border-[#30363d] bg-[#161b22] shrink-0">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-2.5 text-[#8b949e]" />
          <input
            type="text"
            placeholder="Search extension marketplace..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded bg-[#0d1117] border border-[#30363d] text-xs text-[#c9d1d9] outline-none focus:border-[#58a6ff] placeholder-[#8b949e]"
          />
        </div>
      </div>

      {/* Explorer List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* Recommended Header if any matches project and hasn't been dismissed */}
        {activeRecommendations.length > 0 && (
          <div>
            <div className="space-y-2">
              {activeRecommendations.map(ext => {
                const isInstalled = installed.includes(ext.id);
                return (
                  <div key={ext.id} className="group/rec p-3 rounded border border-[#30363d] bg-[#161b22] flex items-start justify-between gap-3 transition relative hover:border-[#444c56]">
                    
                    {/* Tiny dismiss/remove button for the card */}
                    <button
                      onClick={() => handleDismiss(ext.id)}
                      className="absolute top-2 right-2 p-1 rounded text-[#8b949e] hover:text-red-400 hover:bg-slate-800 transition opacity-0 group-hover/rec:opacity-100 cursor-pointer"
                      title="Dismiss recommendation card"
                    >
                      <X size={10} />
                    </button>

                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white">{ext.name}</span>
                        <span className="text-[8px] bg-blue-500/10 text-[#58a6ff] px-1.5 py-0.2 rounded border border-blue-500/20">Rec</span>
                      </div>
                      <p className="text-[10px] text-[#8b949e] mt-1 leading-normal">{ext.desc}</p>
                      <div className="flex items-center gap-3 mt-2 text-[9px] text-[#8b949e] font-mono">
                        <span>↓ {ext.downloads}</span>
                        <span>★ {ext.rating}</span>
                        <span>{ext.category}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => isInstalled ? onUninstall(ext.id) : onInstall(ext.id)}
                      className={`group h-6 px-2.5 rounded text-[10px] font-bold border flex items-center gap-1 transition shrink-0 cursor-pointer ${
                        isInstalled
                          ? 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-[#ff7b72] hover:border-[#ff7b72]/40 hover:bg-red-500/10'
                          : 'bg-[#238636] text-white border-[#238636] hover:bg-[#2ea043]'
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
                        <>
                          <Download size={10} />
                          <span>Install</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Extensions list */}
        <div>
          
          {filtered.length === 0 ? (
            <div className="text-center py-6 text-[#8b949e] text-xs">No extensions matching query.</div>
          ) : (
            <div className="space-y-2">
              {filtered.filter(e => !isRecommended(e.id) || dismissedRecommended.includes(e.id)).map(ext => {
                const isInstalled = installed.includes(ext.id);
                return (
                  <div key={ext.id} className="p-3 rounded border border-[#30363d] bg-[#161b22] flex items-start justify-between gap-3 hover:border-[#444c56] transition">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-200">{ext.name}</span>
                      <p className="text-[10px] text-[#8b949e] mt-1 leading-normal">{ext.desc}</p>
                      <div className="flex items-center gap-3 mt-2 text-[9px] text-[#8b949e] font-mono">
                        <span>↓ {ext.downloads}</span>
                        <span>★ {ext.rating}</span>
                        <span>{ext.category}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => isInstalled ? onUninstall(ext.id) : onInstall(ext.id)}
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
          )}
        </div>

      </div>
    </div>
  );
}
