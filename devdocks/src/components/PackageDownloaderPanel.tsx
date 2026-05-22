import React, { useEffect, useMemo, useState } from 'react';
import { Search, Package, Check, Trash2, Code, X, Download } from 'lucide-react';
import { Project } from '../types';

interface PackageDownloaderPanelProps {
  project: Project;
  onInstall: (packageName: string, version?: string) => void;
  onUninstall: (packageName: string) => void;
}

const NPM_REGISTRY = [
  { name: 'zustand', desc: 'Small, fast state management for React.', version: '^5.0.13', category: 'State' },
  { name: 'framer-motion', desc: 'Production-ready animation library for React.', version: '^12.23.24', category: 'Animation' },
  { name: 'motion', desc: 'Modern animation primitives for React and JavaScript.', version: '^12.23.24', category: 'Animation' },
  { name: 'lucide-react', desc: 'Pixel-perfect icon components.', version: '^0.546.0', category: 'Icons' },
  { name: 'axios', desc: 'Promise-based HTTP client.', version: '^1.12.2', category: 'Networking' },
  { name: 'react-router-dom', desc: 'Declarative routing for React apps.', version: '^7.9.4', category: 'Routing' },
  { name: '@tanstack/react-query', desc: 'Async server-state and caching for React.', version: '^5.90.3', category: 'Data' },
  { name: '@tanstack/react-table', desc: 'Headless tables and datagrids.', version: '^8.21.3', category: 'Data' },
  { name: 'react-hook-form', desc: 'Performant form state and validation.', version: '^7.63.0', category: 'Forms' },
  { name: 'zod', desc: 'TypeScript-first schema validation.', version: '^4.1.12', category: 'Validation' },
  { name: 'clsx', desc: 'Tiny className condition utility.', version: '^2.1.1', category: 'Styling' },
  { name: 'tailwind-merge', desc: 'Merge Tailwind classes without style conflicts.', version: '^3.3.1', category: 'Styling' },
  { name: 'lodash-es', desc: 'Lodash utilities exported as ES modules.', version: '^4.17.21', category: 'Utility' },
  { name: 'date-fns', desc: 'Modern date utility functions.', version: '^4.1.0', category: 'Utility' },
  { name: 'dayjs', desc: 'Small immutable date library.', version: '^1.11.13', category: 'Utility' },
  { name: 'uuid', desc: 'RFC-compliant UUID generation.', version: '^11.1.0', category: 'Utility' },
  { name: 'nanoid', desc: 'Tiny unique string ID generator.', version: '^5.1.5', category: 'Utility' },
  { name: 'immer', desc: 'Immutable state updates with mutable syntax.', version: '^10.1.1', category: 'State' },
  { name: 'monaco-editor', desc: 'Browser-based code editor engine.', version: '^0.52.2', category: 'Editor' },
  { name: '@monaco-editor/react', desc: 'React wrapper for Monaco editor.', version: '^4.7.0', category: 'Editor' },
  { name: 'three', desc: '3D rendering library for the web.', version: '^0.180.0', category: '3D' },
  { name: '@react-three/fiber', desc: 'React renderer for Three.js.', version: '^9.3.0', category: '3D' },
  { name: 'canvas-confetti', desc: 'Performant celebration effects.', version: '^1.9.3', category: 'Effects' },
  { name: 'sonner', desc: 'Opinionated toast notifications for React.', version: '^2.0.7', category: 'UI' },
  { name: 'recharts', desc: 'Composable charting for React.', version: '^3.2.1', category: 'Charts' },
];

type PackageResult = {
  name: string;
  desc: string;
  version: string;
  category: string;
  downloads?: string;
  date?: string;
  source: 'live' | 'local';
};

const formatDownloads = (count?: number) => {
  if (!count || Number.isNaN(count)) return undefined;
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M/wk`;
  if (count >= 1000) return `${Math.round(count / 1000)}K/wk`;
  return `${count}/wk`;
};

export default function PackageDownloaderPanel({
  project,
  onInstall,
  onUninstall
}: PackageDownloaderPanelProps) {
  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState<PackageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const installed = project.installedPackages || [];

  const handleQueryInstall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onInstall(query.trim().toLowerCase());
  };

  useEffect(() => {
    const controller = new AbortController();
    const searchText = query.trim() || [
      project.techStack.includes('React') ? 'react' : '',
      project.techStack.includes('TypeScript') ? 'typescript' : '',
      project.techStack.includes('Tailwind CSS') ? 'tailwindcss' : '',
      'vite'
    ].filter(Boolean).join(' ');

    setLoading(true);
    setRegistryError(null);

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(searchText)}&size=24`, {
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Registry returned ${response.status}`);
        const data = await response.json();
        const mapped: PackageResult[] = (data.objects || []).map((item: any) => ({
          name: item.package?.name || '',
          desc: item.package?.description || 'npm package from the live registry.',
          version: `^${item.package?.version || 'latest'}`,
          category: item.package?.keywords?.[0] || 'npm',
          downloads: formatDownloads(item.downloads?.weekly),
          date: item.package?.date ? new Date(item.package.date).toLocaleDateString() : undefined,
          source: 'live' as const
        })).filter((pkg: PackageResult) => pkg.name);

        setLiveResults(mapped);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setLiveResults([]);
          setRegistryError('Live npm registry unavailable. Showing cached recommendations.');
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, project.techStack.join('|')]);

  const localFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NPM_REGISTRY.filter((pkg) => {
      if (!q) return true;
      return [pkg.name, pkg.desc, pkg.category].some((field) => field.toLowerCase().includes(q));
    }).sort((a, b) => {
      const installedSort = Number(installed.includes(b.name)) - Number(installed.includes(a.name));
      if (installedSort !== 0) return installedSort;
      return a.name.localeCompare(b.name);
    });
  }, [query, installed.join('|')]).map((pkg) => ({ ...pkg, source: 'local' as const }));

  const filtered: PackageResult[] = liveResults.length > 0 ? liveResults : localFiltered;

  const customQuery = query.trim().toLowerCase();
  const canInstallSearch = customQuery.length > 1 && !installed.includes(customQuery);

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="p-3 border-b border-[#30363d] bg-[#161b22] shrink-0 space-y-2">
        <form onSubmit={handleQueryInstall} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-2.5 text-[#8b949e]" />
            <input
              type="text"
              placeholder="Search npm packages or type a package name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded bg-[#0d1117] border border-[#30363d] text-xs text-[#c9d1d9] outline-none focus:border-[#58a6ff] placeholder-[#8b949e]"
            />
          </div>
          <button
            type="submit"
            disabled={!canInstallSearch}
            className="h-8 px-3 rounded bg-[#238636] text-white font-bold text-[10px] hover:bg-[#2ea043] transition cursor-pointer border-0 disabled:opacity-40 disabled:cursor-default"
          >
            Install
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#8b949e] block mb-2">
            Installed Dependencies ({installed.length})
          </span>
          {installed.length === 0 ? (
            <div className="text-center py-4 bg-[#0d1117] border border-[#30363d] border-dashed rounded text-[#8b949e] text-[11px]">
              No packages installed.
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-[90px] overflow-y-auto pr-1">
              {installed.map((pkg) => (
                <div key={pkg} className="inline-flex items-center gap-1.5 pl-2 py-0.5 pr-0.5 rounded bg-[#161b22] border border-[#30363d] text-[#c9d1d9] text-[10px] font-mono">
                  <Package size={10} className="text-[#58a6ff]" />
                  <span>{pkg}</span>
                  <button onClick={() => onUninstall(pkg)} className="p-1 rounded text-[#8b949e] hover:text-red-400 hover:bg-[#0d1117] transition cursor-pointer" title="Uninstall">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#8b949e]">npm Registry Recommendations</span>
            <span className="text-[9px] font-mono text-[#8b949e]">{loading ? 'Searching...' : `${filtered.length} results`}</span>
          </div>
          {registryError && <div className="text-[9px] text-[#d29922] font-mono mb-2">{registryError}</div>}

          <div className="space-y-2">
            {filtered.map((pkg) => {
              const isInstalled = installed.includes(pkg.name);
              return (
                <div key={pkg.name} className="p-3 rounded border border-[#30363d] bg-[#161b22] flex items-start justify-between gap-3 transition hover:bg-[#1f242c]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Code size={11} className="text-[#58a6ff] shrink-0" />
                      <span className="font-mono text-xs font-bold text-white truncate">{pkg.name}</span>
                      <span className="text-[8px] font-mono text-[#8b949e] shrink-0">{pkg.version}</span>
                      {pkg.source === 'live' && <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 rounded border border-emerald-500/20 shrink-0">Live</span>}
                    </div>
                    <p className="text-[10px] text-[#8b949e] mt-1.5 leading-normal">{pkg.desc}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[8px] font-mono text-[#58a6ff] bg-blue-500/10 px-1.5 rounded border border-blue-500/20 inline-block">
                        {pkg.category}
                      </span>
                      {pkg.downloads && <span className="text-[8px] font-mono text-[#8b949e]">{pkg.downloads}</span>}
                      {pkg.date && <span className="text-[8px] font-mono text-[#8b949e]">{pkg.date}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => isInstalled ? onUninstall(pkg.name) : onInstall(pkg.name, pkg.version)}
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
      </div>
    </div>
  );
}
