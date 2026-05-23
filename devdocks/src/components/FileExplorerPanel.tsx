import React, { useState } from 'react';
import {
  File, Folder, FolderOpen, FilePlus, FolderPlus, Trash2, Edit,
  ChevronDown, ChevronRight, Check, X, LayoutTemplate, Braces,
  FileCode2, FileJson, Palette, FileType, Settings
} from 'lucide-react';
import { Project, FileNode } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface FileExplorerPanelProps {
  project: Project;
  onCreateFile: (path: string) => void;
  onCreateFolder: (path: string) => void;
  onRename: (oldPath: string, newPath: string) => boolean;
  onDelete: (path: string) => void;
  onOpenFile: (path: string) => void;
  activeFile: string | null;
  unsavedDrafts: Record<string, string>;
  materialIcons?: boolean;
}

type TreeEntry = {
  path: string;
  name: string;
  isFolder: boolean;
  node?: FileNode;
  children: Record<string, TreeEntry>;
};

export default function FileExplorerPanel({
  project,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onOpenFile,
  activeFile,
  unsavedDrafts,
  materialIcons = false
}: FileExplorerPanelProps) {
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({ src: true });
  const [showAddInput, setShowAddInput] = useState<{ type: 'file' | 'folder'; parent: string } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [renamedName, setRenamedName] = useState('');
  const [pendingDeletePath, setPendingDeletePath] = useState<string | null>(null);

  const toggleExpand = (dir: string) => {
    setExpandedPaths((prev) => ({ ...prev, [dir]: prev[dir] === false }));
  };

  const handleStartCreate = (type: 'file' | 'folder', parentPath: string) => {
    setShowAddInput({ type, parent: parentPath });
    setNewItemName('');
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !showAddInput) return;

    const name = newItemName.trim().replace(/^\/+/, '');
    const targetPath = showAddInput.parent ? `${showAddInput.parent}/${name}` : name;

    if (showAddInput.type === 'file') onCreateFile(targetPath);
    else onCreateFolder(targetPath);

    setExpandedPaths((prev) => showAddInput.parent ? { ...prev, [showAddInput.parent]: true } : prev);
    setShowAddInput(null);
    setNewItemName('');
  };

  const handleStartRename = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    setEditingPath(path);
    setRenamedName(path.split('/').pop() || path);
  };

  const handleConfirmRename = (e: React.FormEvent, oldPath: string) => {
    e.preventDefault();
    if (!renamedName.trim()) return;

    const parts = oldPath.split('/');
    parts.pop();
    parts.push(renamedName.trim());
    const newPath = parts.join('/');

    if (onRename(oldPath, newPath)) setEditingPath(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    setPendingDeletePath(path);
  };

  const fileIcon = (path: string) => {
    const lower = path.toLowerCase();
    const reactColor = materialIcons ? 'text-[#c084fc]' : 'text-[#c084fc]';
    const scriptColor = materialIcons ? 'text-[#facc15]' : 'text-[#f7df1e]';
    const jsonColor = materialIcons ? 'text-[#f97316]' : 'text-[#f59e0b]';
    const cssColor = materialIcons ? 'text-[#38bdf8]' : 'text-[#38bdf8]';
    const htmlColor = materialIcons ? 'text-[#e34c26]' : 'text-[#ff7b72]';
    const configColor = materialIcons ? 'text-[#a78bfa]' : 'text-[#a5d6ff]';
    if (lower.endsWith('.tsx') || lower.endsWith('.jsx')) return <LayoutTemplate size={13.5} className={reactColor} />;
    if (lower.endsWith('.ts') || lower.endsWith('.js')) return <FileCode2 size={13.5} className={scriptColor} />;
    if (lower.endsWith('.json')) return <FileJson size={13.5} className={jsonColor} />;
    if (lower.endsWith('.css') || lower.endsWith('.scss') || lower.endsWith('.sass')) return <Palette size={13.5} className={cssColor} />;
    if (lower.endsWith('.html')) return <Braces size={13.5} className={htmlColor} />;
    if (lower.endsWith('.md')) return <FileType size={13.5} className="text-[#c9d1d9]" />;
    if (lower.includes('config') || lower.endsWith('.env')) return <Settings size={13.5} className={configColor} />;
    return <File size={13.5} className="text-[#8b949e]" />;
  };

  const buildTree = () => {
    const root: TreeEntry = { path: '', name: '', isFolder: true, children: {} };

    Object.values(project.files).forEach((node) => {
      const parts = node.path.split('/').filter(Boolean);
      let current = root;
      let running = '';

      parts.forEach((part, index) => {
        running = running ? `${running}/${part}` : part;
        const isLast = index === parts.length - 1;
        const isFolder = isLast ? node.isFolder : true;

        if (!current.children[part]) {
          current.children[part] = {
            path: running,
            name: part,
            isFolder,
            node: isLast ? node : undefined,
            children: {}
          };
        }

        if (isLast) {
          current.children[part].isFolder = node.isFolder;
          current.children[part].node = node;
        }

        current = current.children[part];
      });
    });

    return root;
  };

  const sortEntries = (entries: TreeEntry[]) => entries.sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  const renderEntry = (entry: TreeEntry, depth: number): React.ReactNode => {
    const isExpanded = expandedPaths[entry.path] !== false;
    const isActive = activeFile === entry.path;
    const hasUnsaved = unsavedDrafts[entry.path] !== undefined;
    const children = sortEntries(Object.values(entry.children));

    return (
      <React.Fragment key={entry.path}>
        <div
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          onClick={() => entry.isFolder ? toggleExpand(entry.path) : onOpenFile(entry.path)}
          className={`group flex items-center justify-between h-7 py-1 pr-1.5 rounded font-mono text-[11px] cursor-pointer select-none transition ${
            isActive
              ? 'bg-[#1f242c] text-[#c084fc] font-semibold border-l-2 border-[#c084fc]'
              : 'text-[#c9d1d9] hover:bg-[#1f242c] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
            {entry.isFolder ? (
              <span className="text-[#8b949e]">
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
            ) : (
              <span className="w-3" />
            )}

            {entry.isFolder ? (
              isExpanded
                ? <FolderOpen size={13} className="text-amber-400 shrink-0" />
                : <Folder size={13} className="text-amber-400 shrink-0" />
            ) : (
              <span className="shrink-0">{fileIcon(entry.path)}</span>
            )}

            {editingPath === entry.path ? (
              <form onSubmit={(e) => handleConfirmRename(e, entry.path)} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 flex-1">
                <input
                  type="text"
                  value={renamedName}
                  onChange={(e) => setRenamedName(e.target.value)}
                  className="bg-[#0d1117] border border-[#c084fc] text-white px-1 text-[11px] rounded outline-none w-full"
                  autoFocus
                />
              </form>
            ) : (
              <span className="truncate flex items-center gap-1">
                {entry.name}
                {hasUnsaved && <span className="h-1.5 w-1.5 rounded-full bg-[#c084fc] inline-block animate-pulse shrink-0" title="Unsaved changes" />}
              </span>
            )}
          </div>

          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {entry.isFolder && (
              <>
                <button onClick={() => handleStartCreate('file', entry.path)} className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#0d1117] transition cursor-pointer" title="Create File">
                  <FilePlus size={10} />
                </button>
                <button onClick={() => handleStartCreate('folder', entry.path)} className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#0d1117] transition cursor-pointer" title="Create Folder">
                  <FolderPlus size={10} />
                </button>
              </>
            )}
            <button onClick={(e) => handleStartRename(e, entry.path)} className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#0d1117] transition cursor-pointer" title="Rename">
              <Edit size={10} />
            </button>
            <button onClick={(e) => handleDeleteClick(e, entry.path)} className="p-1 rounded text-[#8b949e] hover:text-red-400 hover:bg-[#0d1117] transition cursor-pointer" title="Delete to Trash">
              <Trash2 size={10} />
            </button>
          </div>
        </div>
        {entry.isFolder && isExpanded && children.map((child) => renderEntry(child, depth + 1))}
      </React.Fragment>
    );
  };

  const rootEntries = sortEntries(Object.values(buildTree().children));

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <ConfirmDialog
        open={Boolean(pendingDeletePath)}
        title="Move to Recycle Bin?"
        message={pendingDeletePath ? `Move "${pendingDeletePath}" to Recycle Bin? You can restore it later.` : ''}
        confirmLabel="Move"
        danger
        onCancel={() => setPendingDeletePath(null)}
        onConfirm={() => {
          if (pendingDeletePath) onDelete(pendingDeletePath);
          setPendingDeletePath(null);
        }}
      />
      <div className="flex items-center justify-between px-3 h-9 border-b border-[#30363d] bg-[#161b22] shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={() => handleStartCreate('file', '')} className="p-1 hover:bg-[#0d1117] rounded text-[#8b949e] hover:text-white transition duration-150 cursor-pointer" title="Create File in Root">
            <FilePlus size={13} />
          </button>
          <button onClick={() => handleStartCreate('folder', '')} className="p-1 hover:bg-[#0d1117] rounded text-[#8b949e] hover:text-white transition duration-150 cursor-pointer" title="Create Folder in Root">
            <FolderPlus size={13} />
          </button>
        </div>
        <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#8b949e] truncate max-w-[130px]" title={project.name}>
          {project.name}
        </span>
      </div>

      {showAddInput && (
        <div className="px-3.5 py-2 bg-[#161b22] border-b border-[#30363d] shrink-0">
          <form onSubmit={handleConfirmCreate} className="flex flex-col gap-1 text-xs">
            <span className="font-mono font-bold text-[9px] text-[#8b949e] tracking-wider">
              NEW {showAddInput.type === 'file' ? 'FILE' : 'FOLDER'}
              {showAddInput.parent ? ` IN /${showAddInput.parent}` : ''}
            </span>
            <div className="flex items-center gap-1 bg-[#0d1117] px-2 h-7 rounded border border-[#30363d] focus-within:border-[#c084fc]">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Name..."
                className="bg-transparent border-0 outline-none flex-1 text-slate-100 text-[11px] w-full placeholder-[#c084fc]/40"
                autoFocus
              />
              <button type="submit" className="text-emerald-400 hover:text-emerald-300">
                <Check size={11} strokeWidth={2.5} />
              </button>
              <button type="button" onClick={() => setShowAddInput(null)} className="text-slate-500 hover:text-red-400">
                <X size={11} strokeWidth={2.5} />
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 scrollbar-none space-y-0.5">
        {rootEntries.length === 0 ? (
          <div className="text-center py-10 px-4 font-sans space-y-2">
            <p className="text-slate-500 text-xs">No files yet. Click + to create.</p>
          </div>
        ) : (
          rootEntries.map((entry) => renderEntry(entry, 0))
        )}
      </div>
    </div>
  );
}

