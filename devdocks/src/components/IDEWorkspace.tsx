import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Editor, { Monaco } from '@monaco-editor/react';
import { 
  Terminal as TermIcon, Play, Save, Monitor, Moon, Sun, 
  FolderTree, Package, Puzzle, Trash2, User, ChevronDown, 
  Plus, Check, X, FileText, Globe, AlertTriangle, RefreshCw, Download 
} from 'lucide-react';

import { useStore } from '../store';
import { compileWorkspaceSandbox } from '../compiler';
import FileExplorerPanel from './FileExplorerPanel';
import ExtensionDownloaderPanel from './ExtensionDownloaderPanel';
import PackageDownloaderPanel from './PackageDownloaderPanel';
import RecycleBinPanel from './RecycleBinPanel';
import ProfilePanel from './ProfilePanel';

interface IDEWorkspaceProps {
  onBackToDashboard: () => void;
}

export default function IDEWorkspace({ onBackToDashboard }: IDEWorkspaceProps) {
  // Pull stores
  const store = useStore();
  const activeProj = store.projects[store.activeProjectId || ''];
  const theme = store.theme;
  const sidebarPanel = store.sidebarPanel;
  const terminalOpen = store.terminalOpen;
  const unsavedDrafts = store.unsavedDrafts;

  const fileCount = activeProj ? Object.values(activeProj.files).filter((f) => !f.isFolder).length : 0;
  const extCount = activeProj ? (activeProj.installedExtensions?.length || 0) : 0;
  const pkgCount = activeProj ? (activeProj.installedPackages?.length || 0) : 0;
  const recycleCount = activeProj ? (activeProj.recycleBin?.length || 0) : 0;
  const projectCount = Object.keys(store.projects).length;

  const [previewSrcDoc, setPreviewSrcDoc] = useState<string>('');
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [cmdInput, setCmdInput] = useState('');

  // Refs for dragging resizers
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const activeRevokes = useRef<string[]>([]);

  // Trigger Sandbox compilation on Mount and when requested
  const handleExecuteSandbox = () => {
    if (!activeProj) return;
    setRunLoading(true);
    setRuntimeError(null);

    // Save active unsaved changes to permanent storage as backup, or compile drafts directly
    // Let's print loader lines to terminal
    store.addTerminalLog({ type: 'system', content: 'Compiling project workspace...' });

    // Revoke old objectUrls to avoid browser memory leaks
    activeRevokes.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {}
    });

    setTimeout(() => {
      try {
        const result = compileWorkspaceSandbox(activeProj, unsavedDrafts);
        activeRevokes.current = result.blobUrls;
        
        if (result.error) {
          setRuntimeError(result.error);
          store.addTerminalLog({ type: 'error', content: `Compilation Failed: ${result.error}` });
        } else {
          setPreviewSrcDoc(result.html);
          store.addTerminalLog({ type: 'success', content: 'Workspace compiled successfully. Sandbox listening on localhost:3000' });
        }
      } catch (err: any) {
        setRuntimeError(err.message);
        store.addTerminalLog({ type: 'error', content: `Compilation failed: ${err.message}` });
      } finally {
        setRunLoading(false);
      }
    }, 450);
  };

  // Compile on project change
  useEffect(() => {
    if (activeProj) {
      handleExecuteSandbox();
    }
  }, [store.activeProjectId]);

  // Listener for dynamic sandboxed Iframe messages (logs/errors)
  useEffect(() => {
    const handleReceiveSandboxMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'SANDBOX_RUNTIME_ERROR') {
        setRuntimeError(`Runtime Error: ${data.message} (${data.filename || 'anonymous'}:${data.lineno}:${data.colno})`);
        store.addTerminalLog({
          type: 'error',
          content: `Sandbox [Runtime Error]: ${data.message} in ${data.filename?.split('/').pop() || 'index'}:${data.lineno}`
        });
      }

      if (data.type === 'SANDBOX_CONSOLE') {
        store.addTerminalLog({
          type: data.level === 'error' ? 'error' : 'output',
          content: `[Console] ${data.content}`
        });
      }
    };

    window.addEventListener('message', handleReceiveSandboxMessage);
    return () => {
      window.removeEventListener('message', handleReceiveSandboxMessage);
    };
  }, []);

  // Keyboard Shortcuts Controller
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      
      if (isCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (store.activeProjectId) {
          store.saveChanges(store.activeProjectId);
          store.addTerminalLog({ type: 'success', content: 'Saved project modules successfully. (v1.0.0)' });
          handleExecuteSandbox();
        }
      }
      
      if (isCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        store.setSidebarPanel('explorer');
        // Select adding input
        const filePlusBtn = document.querySelector('[title="Create File in Root"]') as HTMLButtonElement;
        if (filePlusBtn) filePlusBtn.click();
      }
      
      if (isCtrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        const q = prompt('DevDocks Quick Open: Enter workspace file path (e.g. src/App.tsx)');
        if (q && activeProj && activeProj.files[q]) {
          store.openTab(store.activeProjectId!, q);
        } else if (q) {
          alert(`File or path: "${q}" not found.`);
        }
      }
      
      if (isCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        store.setSidebarPanel(sidebarPanel ? null : 'explorer');
      }
      
      if (isCtrl && e.key === '`') {
        e.preventDefault();
        store.setTerminalOpen(!terminalOpen);
      }
    };

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [activeProj, unsavedDrafts, sidebarPanel, terminalOpen]);

  if (!activeProj) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0d1117] text-[#8b949e] p-8">
        <AlertTriangle size={24} className="text-[#d29922] mb-3" />
        <p className="font-sans font-medium text-xs font-mono">No workspace path loaded. Redirecting...</p>
        <button onClick={onBackToDashboard} className="mt-4 px-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded text-white text-xs hover:bg-[#1f242c] transition">Back to Dashboard</button>
      </div>
    );
  }

  const activeFilePath = activeProj.activeFile;
  const activeFileNode = activeFilePath ? activeProj.files[activeFilePath] : null;

  // Monaco editor value
  // We fetch from intermediate drafts if modified, or fallback to saved file content
  const edCode = activeFilePath && activeFileNode
    ? (unsavedDrafts[activeFilePath] !== undefined ? unsavedDrafts[activeFilePath] : activeFileNode.content)
    : '';

  const getLanguageType = (path: string) => {
    if (path.endsWith('.tsx') || path.endsWith('.ts')) return 'typescript';
    if (path.endsWith('.jsx') || path.endsWith('.js')) return 'javascript';
    if (path.endsWith('.css')) return 'css';
    if (path.endsWith('.html')) return 'html';
    if (path.endsWith('.json')) return 'json';
    return 'plaintext';
  };

  // Drag resizers handlers
  const handleSidebarResMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMove = (moveEvt: MouseEvent) => {
      store.setSidebarWidth(moveEvt.clientX);
    };
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const handleEditorSplitResMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const sidebarWidth = store.sidebarWidth;
    
    const handleMove = (moveEvt: MouseEvent) => {
      const relativeX = moveEvt.clientX - sidebarWidth;
      const percent = (relativeX / (containerWidth - sidebarWidth)) * 100;
      store.setEditorWidth(percent);
    };
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const handleTerminalResMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMove = (moveEvt: MouseEvent) => {
      const height = window.innerHeight - moveEvt.clientY;
      store.setTerminalHeight(height);
    };
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  // Export fully serialized workspace database to user local disk as JSON text file
  const handleExportProjectJSON = () => {
    const payload = JSON.stringify(activeProj, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `devdocks-${activeProj.name.toLowerCase().replace(/\s+/g, '-')}-workspace.json`;
    a.click();
    URL.revokeObjectURL(u);
    setDropdownOpen(false);
    store.addTerminalLog({ type: 'success', content: 'Database workspace exported completely as JSON file backup.' });
  };

  const executeManualTerminal = (e: React.FormEvent) => {
    e.preventDefault();
    if (cmdInput.trim()) {
      store.executeTerminalCommand(cmdInput.trim());
      setCmdInput('');
    }
  };

  return (
    <div ref={containerRef} className={`h-screen flex flex-col overflow-hidden select-none font-sans ${
      theme === 'dark' ? 'bg-[#0d1117] text-[#c9d1d9]' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* -------------------------------- NAVBAR -------------------------------- */}
      <nav id="navbar" className={`h-12 border-b px-3 flex items-center justify-between shrink-0 z-20 ${
        theme === 'dark' ? 'border-[#30363d] bg-[#161b22]' : 'border-slate-200 bg-white shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          {/* Logo click returns to dashboard */}
          <div 
            onClick={onBackToDashboard}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
          >
            <div className="h-6 w-6 rounded bg-[#1f6feb] flex items-center justify-center text-white shrink-0 antialiased shadow">
              <span className="text-[10px] font-black">DD</span>
            </div>
            <span className="font-sans font-bold text-xs tracking-tight text-white dark:text-white block max-w-[80px] truncate animate" title="Back to Dashboard">
              DevDocks
            </span>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* Actions drop list */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`h-7 px-2.5 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                theme === 'dark' ? 'hover:bg-slate-800/60 text-slate-350 hover:text-white' : 'hover:bg-slate-100 text-[#000]'
              }`}
            >
              <span>Project</span>
              <ChevronDown size={12} />
            </button>
            
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                <div className={`absolute left-0 mt-1 w-44 rounded-lg border shadow-xl z-40 py-1 text-xs font-medium font-sans ${
                  theme === 'dark' ? 'bg-[#12131a] border-[#22232a] text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <button 
                    onClick={() => { store.setSidebarPanel('explorer'); setDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 ${theme === 'dark' ? 'hover:bg-slate-900' : 'hover:bg-slate-100'}`}
                  >
                    <Plus size={12} />
                    <span>New File / Folder</span>
                  </button>
                  <button 
                    onClick={() => { store.saveChanges(activeProj.id); handleExecuteSandbox(); setDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 ${theme === 'dark' ? 'hover:bg-slate-900' : 'hover:bg-slate-100'}`}
                  >
                    <Save size={12} />
                    <span>Save Project</span>
                  </button>
                  <button 
                    onClick={handleExportProjectJSON}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 ${theme === 'dark' ? 'hover:bg-slate-900' : 'hover:bg-slate-100'}`}
                  >
                    <Download size={12} />
                    <span>Export Project</span>
                  </button>
                  <div className="h-px bg-white/5 my-1" />
                  <button 
                    onClick={() => { onBackToDashboard(); setDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 ${theme === 'dark' ? 'hover:bg-slate-900 text-cyan-400' : 'hover:bg-slate-100 text-cyan-600'}`}
                  >
                    <span>Open Project...</span>
                  </button>
                  <button 
                    onClick={() => {
                      const ans = prompt('Rename project:', activeProj.name);
                      if (ans && ans.trim()) {
                        store.renameProject(activeProj.id, ans.trim());
                      }
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 ${theme === 'dark' ? 'hover:bg-slate-900' : 'hover:bg-slate-100'}`}
                  >
                    <span>Rename Project</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('Move project to Recycle Bin?')) {
                        store.deleteProject(activeProj.id);
                        onBackToDashboard();
                      }
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 text-red-400 hover:bg-red-500/10 cursor-pointer"
                  >
                    <span>Delete Project</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dynamic header title */}
        <span className="text-xs font-semibold text-slate-400 font-mono hidden sm:block">
          Active Sandbox: {activeProj.name}
        </span>

        {/* Center Run and save toggles */}
        <div className="flex items-center gap-2.5">
          
          {/* Unsaved Draft Indicator Dot */}
          {Object.keys(unsavedDrafts).length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-400/5 border border-cyan-400/20 text-cyan-400 text-[10px] font-mono animate-pulse">
              <span>● Draft Changes</span>
            </div>
          )}

          <button
            onClick={() => {
              store.saveChanges(activeProj.id);
              store.addTerminalLog({ type: 'success', content: 'Manual save successful' });
              handleExecuteSandbox();
            }}
            className={`px-3 h-8 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              theme === 'dark' ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Save changes (Ctrl + S)"
          >
            <Save size={13} />
            <span className="hidden sm:inline">Save</span>
          </button>
          
          <button
            id="sandbox-compile-btn"
            onClick={handleExecuteSandbox}
            disabled={runLoading}
            className={`px-3 h-8 rounded-lg text-xs font-bold flex items-center gap-1.5 transition bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-50 border-0`}
            title="Run Sandbox Preview"
          >
            {runLoading ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} strokeWidth={2.5} />}
            <span>{runLoading ? 'Running...' : 'Run'}</span>
          </button>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* Theme Switcher */}
          <button
            onClick={() => store.setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`h-8 w-8 rounded-lg flex items-center justify-center transition border ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50'
            }`}
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </nav>

      {/* -------------------------------- LAYOUT SPLITS -------------------------------- */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ----------------- VERTICAL INSTANT SIDEBAR ICONS ----------------- */}
        <div className={`w-12 border-r flex flex-col justify-between items-center py-4 shrink-0 bg-[#07090d] ${
          theme === 'dark' ? 'border-[#1b1c24]' : 'border-slate-200'
        }`}>
                   {/* Upper icons */}
          <div className="flex flex-col gap-4 items-center w-full">
            <button
              onClick={() => store.setSidebarPanel(sidebarPanel === 'explorer' ? null : 'explorer')}
              className={`p-2 rounded relative cursor-pointer group transition ${
                sidebarPanel === 'explorer' ? 'bg-[#1f242c] text-[#58a6ff]' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              <FolderTree size={16} />
              {fileCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#1f6feb] text-[8px] font-bold text-white shadow-sm ring-1 ring-[#07090d]">
                  {fileCount}
                </span>
              )}
              <div className="absolute left-14 bg-[#161b22] text-[#c9d1d9] text-[10px] py-1 px-2 pointer-events-none opacity-0 group-hover:opacity-100 rounded z-30 transition border border-[#30363d] whitespace-nowrap font-mono">File Explorer (Ctrl+B)</div>
            </button>

            <button
              onClick={() => store.setSidebarPanel(sidebarPanel === 'extensions' ? null : 'extensions')}
              className={`p-2 rounded relative cursor-pointer group transition ${
                sidebarPanel === 'extensions' ? 'bg-[#1f242c] text-[#58a6ff]' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              <Puzzle size={16} />
              {extCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#238636] text-[8px] font-bold text-white shadow-sm ring-1 ring-[#07090d]">
                  {extCount}
                </span>
              )}
              <div className="absolute left-14 bg-[#161b22] text-[#c9d1d9] text-[10px] py-1 px-2 pointer-events-none opacity-0 group-hover:opacity-100 rounded z-30 transition border border-[#30363d] whitespace-nowrap font-mono">Extension Downloader</div>
            </button>

            <button
              onClick={() => store.setSidebarPanel(sidebarPanel === 'packages' ? null : 'packages')}
              className={`p-2 rounded relative cursor-pointer group transition ${
                sidebarPanel === 'packages' ? 'bg-[#1f242c] text-[#58a6ff]' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              <Package size={16} />
              {pkgCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#bf8700] text-[8px] font-bold text-white shadow-sm ring-1 ring-[#07090d]">
                  {pkgCount}
                </span>
              )}
              <div className="absolute left-14 bg-[#161b22] text-[#c9d1d9] text-[10px] py-1 px-2 pointer-events-none opacity-0 group-hover:opacity-100 rounded z-30 transition border border-[#30363d] whitespace-nowrap font-mono">Package Downloader</div>
            </button>

            <button
              onClick={() => store.setTerminalOpen(!terminalOpen)}
              className={`p-2 rounded relative cursor-pointer group transition ${
                terminalOpen ? 'bg-[#1f242c] text-[#58a6ff]' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              <TermIcon size={16} />
              <div className="absolute left-14 bg-[#161b22] text-[#c9d1d9] text-[10px] py-1 px-2 pointer-events-none opacity-0 group-hover:opacity-100 rounded z-30 transition border border-[#30363d] whitespace-nowrap font-mono">Toggle Terminal (Ctrl+`)</div>
            </button>

            <button
              onClick={() => store.setSidebarPanel(sidebarPanel === 'recycle' ? null : 'recycle')}
              className={`p-2 rounded relative cursor-pointer group transition ${
                sidebarPanel === 'recycle' ? 'bg-[#1f242c] text-[#58a6ff]' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              <Trash2 size={16} />
              {recycleCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#da3637] text-[8px] font-bold text-white shadow-sm ring-1 ring-[#07090d]">
                  {recycleCount}
                </span>
              )}
              <div className="absolute left-14 bg-[#161b22] text-[#c9d1d9] text-[10px] py-1 px-2 pointer-events-none opacity-0 group-hover:opacity-100 rounded z-30 transition border border-[#30363d] whitespace-nowrap font-mono">Recycle Bin & History</div>
            </button>
          </div>

          {/* Bottom user profile icons */}
          <button
            onClick={() => store.setSidebarPanel(sidebarPanel === 'profile' ? null : 'profile')}
            className={`p-2 rounded relative cursor-pointer group transition ${
              sidebarPanel === 'profile' ? 'bg-[#1f242c] text-[#58a6ff]' : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <User size={16} />
            {projectCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#6366f1] text-[8px] font-bold text-white shadow-sm ring-1 ring-[#07090d]">
                {projectCount}
              </span>
            )}
            <div className="absolute left-14 bg-[#161b22] text-[#c9d1d9] text-[10px] py-1 px-2 pointer-events-none opacity-0 group-hover:opacity-100 rounded z-30 transition border border-[#30363d] whitespace-nowrap font-mono">Developer Profile</div>
          </button>
        </div>

        {/* ----------------- ACTIVE SLIDE PANEL DRAWER ----------------- */}
        <AnimatePresence>
          {sidebarPanel && (
            <div
              style={{ width: `${store.sidebarWidth}px` }}
              className={`h-full border-r overflow-hidden flex flex-col relative shrink-0 transition-[width] duration-150 ${
                theme === 'dark' ? 'border-[#30363d] bg-[#161b22]' : 'border-slate-200 bg-white'
              }`}
            >
              {/* Panel routing content render */}
              <div className="flex-1 overflow-hidden">
                {sidebarPanel === 'explorer' && (
                  <FileExplorerPanel
                    project={activeProj}
                    onCreateFile={(path) => store.createFile(activeProj.id, path, '// code module')}
                    onCreateFolder={(path) => store.createFolder(activeProj.id, path)}
                    onRename={(old, n) => store.renameFileOrFolder(activeProj.id, old, n)}
                    onDelete={(path) => store.deleteFileOrFolder(activeProj.id, path)}
                    onOpenFile={(path) => store.openTab(activeProj.id, path)}
                    activeFile={activeFilePath}
                    unsavedDrafts={unsavedDrafts}
                  />
                )}
                {sidebarPanel === 'extensions' && (
                  <ExtensionDownloaderPanel
                    project={activeProj}
                    onInstall={(id) => store.installExtension(activeProj.id, id)}
                    onUninstall={(id) => store.uninstallExtension(activeProj.id, id)}
                  />
                )}
                {sidebarPanel === 'packages' && (
                  <PackageDownloaderPanel
                    project={activeProj}
                    onInstall={(name) => store.installPackage(activeProj.id, name)}
                    onUninstall={(name) => store.uninstallPackage(activeProj.id, name)}
                  />
                )}
                {sidebarPanel === 'recycle' && (
                  <RecycleBinPanel
                    project={activeProj}
                    onRestore={(itemId) => store.restoreFileOrFolder(activeProj.id, itemId)}
                    onDeleteForever={(itemId) => store.deletePermanently(activeProj.id, itemId)}
                  />
                )}
                {sidebarPanel === 'profile' && (
                  <ProfilePanel
                    projects={store.projects}
                    activeProjectId={activeProj.id}
                    onSelectProject={(id) => {
                      store.setActiveProject(id);
                      store.setSidebarPanel('explorer');
                    }}
                  />
                )}
              </div>

              {/* Resize handlebar */}
              <div
                onMouseDown={handleSidebarResMouseDown}
                className="absolute top-0 right-0 w-[4px] h-full cursor-col-resize hover:bg-[#58a6ff]/30 transition z-30"
              />
            </div>
          )}
        </AnimatePresence>

        {/* ----------------- CORE WORKING AREAS SPLITS (Monaco + Live iframe) ----------------- */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          <div className="flex-1 flex overflow-hidden relative">
            
            {/* -------------------- CENTER MONACO EDITOR -------------------- */}
            <div 
              style={{ width: `${store.editorWidth}%` }}
              className={`h-full flex flex-col overflow-hidden shrink-0 relative ${
                theme === 'dark' ? 'bg-[#0d1117]' : 'bg-slate-50'
              }`}
            >
              {/* Tabs strip */}
              <div className={`h-9 flex items-center overflow-x-auto border-b shrink-0 scrollbar-none scroll-smooth ${
                theme === 'dark' ? 'border-[#30363d] bg-[#161b22]' : 'border-slate-200 bg-slate-100'
              }`}>
                {activeProj.openTabs.map((path) => {
                  const isActive = activeFilePath === path;
                  const hasDraft = unsavedDrafts[path] !== undefined;
                  const parts = path.split('/');
                  const label = parts.pop() || path;

                  return (
                    <div
                      key={path}
                      onClick={() => store.openTab(activeProj.id, path)}
                      className={`group h-full px-3 flex items-center gap-2 text-xs font-semibold border-r cursor-pointer shrink-0 transition select-none ${
                        isActive
                          ? (theme === 'dark' ? 'bg-[#0d1117] text-[#58a6ff] border-b-2 border-b-[#58a6ff] border-[#30363d]' : 'bg-white text-[#1f6feb] border-b-2 border-b-[#1f6feb] border-slate-200')
                          : (theme === 'dark' ? 'text-[#8b949e] hover:text-white hover:bg-[#1f242c] border-[#30363d]' : 'text-slate-500 hover:text-[#000] hover:bg-white/40 border-slate-200')
                      }`}
                    >
                      <FileText size={11} className={isActive ? 'text-[#58a6ff]' : 'text-[#8b949e]'} />
                      <span>{label}</span>
                      
                      {/* Unsaved indicator circle or close button toggle */}
                      <span className="flex items-center">
                        {hasDraft ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#58a6ff] block group-hover:hidden transition-all shrink-0" />
                        ) : null}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            store.closeTab(activeProj.id, path);
                          }}
                          className={`p-0.5 rounded hover:bg-[#1f242c] hover:text-white cursor-pointer shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-all ${
                            hasDraft ? 'hidden group-hover:inline-block' : 'inline-block'
                          }`}
                        >
                          <X size={9} />
                        </button>
                      </span>
                    </div>
                  );
                })}

                {activeProj.openTabs.length === 0 && (
                  <div className="px-3.5 text-xs text-[#8b949e] italic font-mono">No files active</div>
                )}
              </div>

              {/* Active editing filename row */}
              {activeFilePath && (
                <div className={`h-6 px-3 flex items-center justify-between font-mono text-[9px] border-b uppercase shrink-0 ${
                  theme === 'dark' ? 'bg-[#161b22]/70 border-[#30363d] text-[#8b949e]' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <span>📍 Path: {activeFilePath}</span>
                  <span>{getLanguageType(activeFilePath)} - Editor mode</span>
                </div>
              )}

              {/* Monaco editor instance render */}
              <div className="flex-1 w-full bg-[#1e1e1e]">
                {activeFilePath ? (
                  <Editor
                    height="100%"
                    language={getLanguageType(activeFilePath)}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    value={edCode}
                    onChange={(val) => {
                      if (val !== undefined) {
                        store.updateFileContent(activeProj.id, activeFilePath, val);
                      }
                    }}
                    options={{
                      fontSize: 13,
                      minimap: { enabled: false },
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: 'on',
                    }}
                  />
                ) : (
                  <div className={`h-full flex flex-col justify-center items-center font-sans space-y-4 p-8 text-center ${
                    theme === 'dark' ? 'bg-[#0f111a]' : 'bg-slate-100'
                  }`}>
                    <FileText size={48} className="text-slate-600 animate-pulse" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-400">No active file path output loaded</h4>
                      <p className="text-xs text-slate-500 mt-1">Select a file from folders explorer side panel tree above to load.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Split resizer draggable line */}
              <div
                onMouseDown={handleEditorSplitResMouseDown}
                className="absolute top-0 right-0 w-[4px] h-full cursor-col-resize hover:bg-[#58a6ff]/35 transition z-30"
              />
            </div>

            {/* -------------------- RIGHT SANDBOX PREVIEW -------------------- */}
            <div className="flex-1 h-full flex flex-col overflow-hidden relative bg-[#0d1117]">
              
              {/* Preview controls panel */}
              <div className={`h-9 px-3 flex items-center justify-between border-b shrink-0 bg-[#161b22] border-[#30363d] text-[#c9d1d9] text-xs`}>
                <div className="flex items-center gap-1.5 min-w-0 pr-1 select-none">
                  <Monitor size={11} className="text-[#58a6ff]" />
                  <span className="font-bold font-mono text-[9px] tracking-wider uppercase">Live Browser Iframe Sandbox</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 select-none">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    <span>localhost:3000/</span>
                  </span>
                  
                  <button
                    onClick={handleExecuteSandbox}
                    className="p-1 hover:bg-[#1f242c] rounded text-[#8b949e] hover:text-white transition duration-150 cursor-pointer"
                    title="Manual Hot Reload Compile"
                  >
                    <RefreshCw size={11} />
                  </button>
                </div>
              </div>

              {/* Dynamic Error details banner overlay */}
              {runtimeError && (
                <div className="bg-[#3b111a] border-b border-[#ff7b72]/30 px-4 py-3 text-[#ff7b72] flex items-start gap-3 text-xs z-30 animate-slide-down shadow-xl">
                  <AlertTriangle size={14} className="text-[#ff7b72] shrink-0 mt-0.5 animate-bounce" />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold block text-[#ff7b72] mb-1 font-mono text-[10px]">Diagnostic Compiler Warning / Sandbox Error:</span>
                    <p className="font-mono text-[10.5px] leading-relaxed break-words">{runtimeError}</p>
                  </div>
                  <button onClick={() => setRuntimeError(null)} className="text-[#ff7b72] hover:text-white cursor-pointer select-none">
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Iframe Viewport container code */}
              <div className={`flex-1 w-full relative transition-colors ${
                theme === 'dark' ? 'bg-[#0d1117]' : 'bg-slate-50'
              }`}>
                {previewSrcDoc ? (
                  <iframe
                    title="DevDocks Sandbox Runner Frame"
                    srcDoc={previewSrcDoc}
                    sandbox="allow-scripts allow-same-origin allow-popups allow-modals"
                    className="w-full h-full border-none bg-white font-sans text-xs"
                  />
                ) : (
                  <div className={`h-full flex flex-col justify-center items-center font-sans space-y-3 p-8 text-center transition-colors ${
                    theme === 'dark'
                      ? 'text-[#8b949e] bg-[#0d1117]'
                      : 'text-slate-600 bg-slate-50'
                  }`}>
                    <Globe size={32} className={theme === 'dark' ? 'text-[#8b949e]' : 'text-slate-400'} />
                    <div>
                      <h4 className={`font-bold text-xs ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>Sandbox Preview Ready</h4>
                      <p className={`text-[11px] mt-1 max-w-xs leading-normal ${
                        theme === 'dark' ? 'text-[#8b949e]' : 'text-slate-500'
                      }`}>Press "Run" to bundle, transpile, and start the local Node.js virtual thread server.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* -------------------- INLINE DRAWER TERMINAL DRAWER -------------------- */}
          <AnimatePresence>
            {terminalOpen && (
              <div
                ref={terminalRef}
                style={{ height: `${store.terminalHeight}px` }}
                className={`w-full border-t flex flex-col overflow-hidden relative shrink-0 z-10 transition-[height] duration-150 ${
                  theme === 'dark' ? 'border-[#30363d] bg-[#161b22]' : 'border-slate-200 bg-white'
                }`}
              >
                {/* Drag handle resize bar */}
                <div
                  onMouseDown={handleTerminalResMouseDown}
                  className="absolute top-0 left-0 w-full h-[4px] cursor-row-resize hover:bg-[#58a6ff]/35 transition z-30"
                />

                {/* Header panel strip */}
                <div className={`h-8 px-3.5 flex items-center justify-between border-b shrink-0 ${
                  theme === 'dark' ? 'border-[#30363d] bg-[#161b22]' : 'border-slate-200 bg-slate-100'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-mono select-none">
                    <TermIcon size={11} className="text-[#58a6ff] shrink-0" />
                    <span className="font-bold tracking-wider uppercase text-[#8b949e] text-[9px]">Integrated Sandbox Shell Terminal</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => store.clearTerminal()}
                      className="px-2 h-5 rounded text-[#8b949e] hover:text-white bg-[#0d1117] border border-[#30363d] text-[9px] font-bold cursor-pointer transition select-none"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => store.setTerminalOpen(false)}
                      className="p-1 rounded text-[#8b949e] hover:text-white bg-[#0d1117] border border-[#30363d] transition cursor-pointer select-none"
                    >
                      <X size={9} />
                    </button>
                  </div>
                </div>

                {/* Logs scrolling area */}
                <div id="terminal-content" className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed space-y-1 bg-[#0d1117]">
                  {store.terminalLogs.map((log) => {
                    const typeColor = () => {
                      if (log.type === 'input') return 'text-[#8b949e]';
                      if (log.type === 'error') return 'text-[#ff7b72] font-semibold';
                      if (log.type === 'success') return 'text-emerald-400';
                      if (log.type === 'system') return 'text-blue-450';
                      return 'text-[#c9d1d9]';
                    };

                    return (
                      <div key={log.id} className={`whitespace-pre-wrap select-text break-words ${typeColor()}`}>
                        {log.content}
                      </div>
                    );
                  })}
                  
                  {/* Invisible scrolling anchor check */}
                  <div style={{ height: '0.1px' }} ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                </div>

                {/* Custom shell inputs forms */}
                <form onSubmit={executeManualTerminal} className="h-8 border-t border-[#30363d] bg-[#0d1117] flex items-center pr-3">
                  <span className="pl-4 pr-1 text-[#58a6ff] text-xs shrink-0 select-none">~ / {activeProj.name} $ </span>
                  <input
                    type="text"
                    value={cmdInput}
                    onChange={(e) => setCmdInput(e.target.value)}
                    placeholder='Type "help" or run standard commands (e.g. ls, mkdir, npm install...)'
                    className="flex-1 bg-transparent border-none outline-none text-[#c9d1d9] font-mono text-[11px] h-full w-full pl-1 focus:ring-0 placeholder-[#8b949e]/50"
                  />
                </form>

              </div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </div>
  );
}
