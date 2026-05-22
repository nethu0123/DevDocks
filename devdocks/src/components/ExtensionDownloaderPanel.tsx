import React, { useEffect, useMemo, useState } from 'react';
import { Search, Check, Download, X, Star, Cloud, Zap } from 'lucide-react';
import { Project } from '../types';

interface ExtensionDownloaderPanelProps {
  project: Project;
  onInstall: (extId: string) => void;
  onUninstall: (extId: string) => void;
}

const ALL_EXTENSIONS = [
  { id: 'Prettier', name: 'Prettier Formatter', desc: 'Format JavaScript, TypeScript, JSON, CSS, and HTML on save.', category: 'Formatter', downloads: '48.2M', rating: '4.9' },
  { id: 'ESLint', name: 'ESLint', desc: 'Lint JavaScript and TypeScript with workspace diagnostics.', category: 'Linter', downloads: '39.6M', rating: '4.8' },
  { id: 'React Snippets', name: 'ES7 React Snippets', desc: 'React hooks, component, and export snippets.', category: 'React', downloads: '23.4M', rating: '4.8' },
  { id: 'Tailwind IntelliSense', name: 'Tailwind CSS IntelliSense', desc: 'Class suggestions, linting, and hover previews.', category: 'Styling', downloads: '18.7M', rating: '4.9' },
  { id: 'TypeScript Tools', name: 'TypeScript Toolbox', desc: 'Symbol helpers, import cleanup, and type-aware code actions.', category: 'TypeScript', downloads: '15.2M', rating: '4.7' },
  { id: 'GitLens Lite', name: 'GitLens Lite', desc: 'Commit history, blame hints, and virtual repository insights.', category: 'Source Control', downloads: '31.1M', rating: '4.8' },
  { id: 'Live Share Sandbox', name: 'Live Share Sandbox', desc: 'Share the local iframe preview and workspace diagnostics.', category: 'Collaboration', downloads: '9.4M', rating: '4.6' },
  { id: 'Path Intellisense', name: 'Path Intellisense', desc: 'Autocomplete file paths from the current workspace tree.', category: 'Productivity', downloads: '16.8M', rating: '4.7' },
  { id: 'npm Intellisense', name: 'npm Intellisense', desc: 'Import autocomplete for installed npm dependencies.', category: 'Packages', downloads: '12.5M', rating: '4.5' },
  { id: 'Auto Rename Tag', name: 'Auto Rename Tag', desc: 'Rename paired JSX and HTML tags automatically.', category: 'HTML', downloads: '14.9M', rating: '4.6' },
  { id: 'CSS Modules', name: 'CSS Modules', desc: 'CSS module symbol completion and definitions.', category: 'Styling', downloads: '5.8M', rating: '4.4' },
  { id: 'Sass Compiler', name: 'Sass Compiler', desc: 'Compile Sass and SCSS styling assets inside the sandbox.', category: 'Compiler', downloads: '7.2M', rating: '4.3' },
  { id: 'Error Lens', name: 'Error Lens', desc: 'Surface diagnostics inline beside the code that caused them.', category: 'Diagnostics', downloads: '11.7M', rating: '4.8' },
  { id: 'REST Client', name: 'REST Client', desc: 'Run HTTP request files and inspect responses.', category: 'API', downloads: '8.3M', rating: '4.7' },
  { id: 'Material Icon Theme', name: 'Material Icon Theme', desc: 'Richer file and folder icons for the explorer.', category: 'Theme', downloads: '24.1M', rating: '4.9' },
  { id: 'Monaco Vim', name: 'Monaco Vim Mode', desc: 'Vim keybindings for the embedded Monaco editor.', category: 'Keymaps', downloads: '3.1M', rating: '4.2' },
];

type ExtensionResult = {
  id: string;
  name: string;
  desc: string;
  category: string;
  downloads: string;
  rating: string;
  version?: string;
  publisher?: string;
  source: 'live' | 'local';
};

const formatCount = (count?: number) => {
  if (!count || Number.isNaN(count)) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return String(count);
};

export default function ExtensionDownloaderPanel({
  project,
  onInstall,
  onUninstall
}: ExtensionDownloaderPanelProps) {
  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState<ExtensionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const installed = project.installedExtensions || [];

  const isRecommended = (extId: string) => {
    if (extId === 'React Snippets' && project.techStack.includes('React')) return true;
    if (extId === 'Tailwind IntelliSense' && project.techStack.includes('Tailwind CSS')) return true;
    if (extId === 'TypeScript Tools' && project.techStack.includes('TypeScript')) return true;
    if (extId === 'npm Intellisense' && project.installedPackages.length > 0) return true;
    return ['Prettier', 'ESLint', 'Path Intellisense', 'Error Lens', 'Material Icon Theme'].includes(extId);
  };

  useEffect(() => {
    const controller = new AbortController();
    const searchText = query.trim() || [
      project.techStack.includes('React') ? 'react' : '',
      project.techStack.includes('TypeScript') ? 'typescript' : '',
      project.techStack.includes('Tailwind CSS') ? 'tailwind' : '',
      'prettier eslint'
    ].filter(Boolean).join(' ');

    setLoading(true);
    setRegistryError(null);

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`https://open-vsx.org/api/-/search?query=${encodeURIComponent(searchText)}&size=20&offset=0`, {
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Registry returned ${response.status}`);
        const data = await response.json();
        const raw = Array.isArray(data.extensions) ? data.extensions : Array.isArray(data.results) ? data.results : [];
        const mapped: ExtensionResult[] = raw.map((item: any) => {
          const namespace = item.namespace || item.publisher || item.namespaceName || '';
          const name = item.name || item.extensionName || item.displayName || '';
          const id = namespace && name ? `${namespace}.${name}` : (item.id || item.identifier || name);
          return {
            id,
            name: item.displayName || id,
            desc: item.description || 'VS Code-compatible extension from the live registry.',
            category: item.categories?.[0] || item.category || 'Extension',
            downloads: formatCount(item.downloadCount || item.downloads),
            rating: item.averageRating ? Number(item.averageRating).toFixed(1) : '4.5',
            version: item.version,
            publisher: namespace,
            source: 'live' as const
          };
        }).filter((item: ExtensionResult) => item.id && item.name);

        setLiveResults(mapped);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setLiveResults([]);
          setRegistryError('Live registry unavailable. Showing cached recommendations.');
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
    return ALL_EXTENSIONS.filter((ext) => {
      if (!q) return true;
      return [ext.name, ext.id, ext.desc, ext.category].some((field) => field.toLowerCase().includes(q));
    }).sort((a, b) => {
      const rec = Number(isRecommended(b.id)) - Number(isRecommended(a.id));
      if (rec !== 0) return rec;
      return Number.parseFloat(b.rating) - Number.parseFloat(a.rating);
    });
  }, [query, project.techStack.join('|'), project.installedPackages.join('|')]).map((ext) => ({ ...ext, source: 'local' as const }));

  const filtered: ExtensionResult[] = liveResults.length > 0 ? liveResults : localFiltered;

  const customQuery = query.trim();
  const canInstallCustom = customQuery.length > 1 && !filtered.some((ext) => ext.id.toLowerCase() === customQuery.toLowerCase() || ext.name.toLowerCase() === customQuery.toLowerCase());

  const renderExtension = (ext: ExtensionResult) => {
    const isInstalled = installed.includes(ext.id);
    const recommended = isRecommended(ext.id);

    return (
      <div key={ext.id} className="p-3 rounded border border-[#30363d] bg-[#161b22] hover:bg-[#1f242c] flex items-start justify-between gap-3 transition">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-slate-100 truncate">{ext.name}</span>
            {recommended && <span className="text-[8px] bg-blue-500/10 text-[#58a6ff] px-1.5 rounded border border-blue-500/20 shrink-0">Recommended</span>}
            {ext.source === 'live' && <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 rounded border border-emerald-500/20 shrink-0">Live</span>}
          </div>
          <p className="text-[10px] text-[#8b949e] mt-1 leading-normal">{ext.desc}</p>
          <div className="flex items-center gap-3 mt-2 text-[9px] text-[#8b949e] font-mono">
            <span className="inline-flex items-center gap-1"><Cloud size={9} /> {ext.downloads}</span>
            <span className="inline-flex items-center gap-1"><Star size={9} /> {ext.rating}</span>
            <span>{ext.version ? `v${ext.version}` : ext.category}</span>
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
            <>
              <Download size={10} />
              <span>Install</span>
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="p-3 border-b border-[#30363d] bg-[#161b22] shrink-0 space-y-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-2.5 text-[#8b949e]" />
          <input
            type="text"
            placeholder="Search Extensions Marketplace"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded bg-[#0d1117] border border-[#30363d] text-xs text-[#c9d1d9] outline-none focus:border-[#58a6ff] placeholder-[#8b949e]"
          />
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono text-[#8b949e]">
          <span>{loading ? 'Searching live registry...' : `${filtered.length} realtime results`}</span>
          <span>{installed.length} active</span>
        </div>
        {registryError && <div className="text-[9px] text-[#d29922] font-mono">{registryError}</div>}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {canInstallCustom && (
          <div className="p-3 rounded border border-[#30363d] bg-[#0d1117] flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-[#58a6ff]" />
                <span className="text-xs font-bold text-white truncate">{customQuery}</span>
              </div>
              <p className="text-[10px] text-[#8b949e] mt-1">Install this marketplace extension by name.</p>
            </div>
            <button onClick={() => onInstall(customQuery)} className="h-6 px-2.5 rounded text-[10px] font-bold bg-[#238636] text-white hover:bg-[#2ea043] transition">
              Install
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-6 text-[#8b949e] text-xs">No extensions matching query.</div>
        ) : (
          filtered.map(renderExtension)
        )}
      </div>
    </div>
  );
}
