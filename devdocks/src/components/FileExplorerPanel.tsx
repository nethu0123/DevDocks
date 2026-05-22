import React, { useState } from 'react';
import { 
  File, Folder, FolderOpen, Plus, FilePlus, FolderPlus, 
  Trash2, Edit, ChevronDown, ChevronRight, Check, X, FileTerminal, LayoutTemplate 
} from 'lucide-react';
import { Project, FileNode } from '../types';

interface FileExplorerPanelProps {
  project: Project;
  onCreateFile: (path: string) => void;
  onCreateFolder: (path: string) => void;
  onRename: (oldPath: string, newPath: string) => boolean;
  onDelete: (path: string) => void;
  onOpenFile: (path: string) => void;
  activeFile: string | null;
  unsavedDrafts: Record<string, string>;
}

export default function FileExplorerPanel({
  project,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onOpenFile,
  activeFile,
  unsavedDrafts
}: FileExplorerPanelProps) {
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({
    'src': true, // Keep src open by default
  });
  
  // Inputs for adding new item
  const [showAddInput, setShowAddInput] = useState<{ type: 'file' | 'folder'; parent: string } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  
  // Input for renaming an item
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [renamedName, setRenamedName] = useState('');

  // Auto discover directories that exist on the flat files object
  const getDirs = (): string[] => {
    const dirs = new Set<string>();
    Object.keys(project.files).forEach((path) => {
      const parts = path.split('/');
      parts.pop(); // Remove file name
      let running = '';
      parts.forEach((p) => {
        running = running ? `${running}/${p}` : p;
        dirs.add(running);
      });
    });
    return Array.from(dirs);
  };

  const toggleExpand = (dir: string) => {
    setExpandedPaths(prev => ({ ...prev, [dir]: !prev[dir] }));
  };

  const handleStartCreate = (type: 'file' | 'folder', parentPath: string) => {
    setShowAddInput({ type, parent: parentPath });
    setNewItemName('');
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    let targetPath = newItemName.trim();
    if (showAddInput?.parent) {
      targetPath = `${showAddInput.parent}/${targetPath}`;
    }

    if (showAddInput?.type === 'file') {
      onCreateFile(targetPath);
    } else if (showAddInput?.type === 'folder') {
      onCreateFolder(targetPath);
    }

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

    if (onRename(oldPath, newPath)) {
      setEditingPath(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    if (confirm(`Move "${path}" to Recycle Bin?`)) {
      onDelete(path);
    }
  };

  // Build tree representation on the fly 
  const filesList = Object.values(project.files);

  // Group files by nested level
  const renderTreeNodes = () => {
    // Sort directories and file nodes
    const sortedPaths = Object.keys(project.files).sort((a, b) => {
      const nodeA = project.files[a];
      const nodeB = project.files[b];
      
      // Directory first, case-insensitive alphabetically
      if (nodeA.isFolder && !nodeB.isFolder) return -1;
      if (!nodeA.isFolder && nodeB.isFolder) return 1;
      return a.localeCompare(b);
    });

    // We can render items depending on whether their parents are expanded
    return sortedPaths.map((path) => {
      const file = project.files[path];
      const parts = path.split('/');
      const name = parts.pop() || path;
      const depth = parts.length;
      
      // Check if item's parent is collapsed
      let isVisible = true;
      let currentParent = '';
      for (const parent of parts) {
        currentParent = currentParent ? `${currentParent}/${parent}` : parent;
        if (expandedPaths[currentParent] === false) {
          isVisible = false;
          break;
        }
      }

      if (!isVisible) return null;

      const isFolder = file.isFolder;
      const isExpanded = !!expandedPaths[path];
      const isActive = activeFile === path;
      const hasUnsaved = unsavedDrafts[path] !== undefined;

      const fileIcon = () => {
        if (path.endsWith('.tsx') || path.endsWith('.jsx')) {
          return <LayoutTemplate size={13.5} className="text-[#58a6ff]" />;
        }
        if (path.endsWith('.css')) {
          return <File size={13.5} className="text-[#38bdf8]" />;
        }
        if (path.endsWith('.json')) {
          return <File size={13.5} className="text-[#f59e0b]" />;
        }
        return <File size={13.5} className="text-[#8b949e]" />;
      };

      return (
        <div
          key={path}
          style={{ paddingLeft: `${depth * 8 + 6}px` }}
          onClick={() => {
            if (isFolder) toggleExpand(path);
            else onOpenFile(path);
          }}
          className={`group flex items-center justify-between h-7 py-1 pr-1.5 rounded font-mono text-[11px] cursor-pointer select-none transition ${
            isActive 
              ? 'bg-[#1f242c] text-[#58a6ff] font-semibold border-l-2 border-[#58a6ff]' 
              : 'text-[#c9d1d9] hover:bg-[#1f242c] hover:text-white'
          }`}
        >
          {/* Row label */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
            {isFolder ? (
              <span className="text-[#8b949e]">
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
            ) : (
              <span className="w-3" />
            )}

            {isFolder ? (
              isExpanded 
                ? <FolderOpen size={13} className="text-amber-400 shrink-0" />
                : <Folder size={13} className="text-amber-400 shrink-0" />
            ) : (
              <span className="shrink-0">{fileIcon()}</span>
            )}

            {editingPath === path ? (
              <form 
                onSubmit={(e) => handleConfirmRename(e, path)} 
                onClick={(e) => e.stopPropagation()} 
                className="flex items-center gap-1 flex-1"
              >
                <input
                  type="text"
                  value={renamedName}
                  onChange={(e) => setRenamedName(e.target.value)}
                  className="bg-[#0d1117] border border-[#58a6ff] text-white px-1 text-[11px] rounded outline-none w-full"
                  autoFocus
                />
              </form>
            ) : (
              <span className="truncate flex items-center gap-1">
                {name}
                {hasUnsaved && <span className="h-1.5 w-1.5 rounded-full bg-[#58a6ff] inline-block animate-pulse shrink-0" title="Unsaved changes (●)" />}
              </span>
            )}
          </div>

          {/* Quick Trigger Tooltips actions */}
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {isFolder && (
              <>
                <button
                  onClick={() => handleStartCreate('file', path)}
                  className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#0d1117] transition cursor-pointer"
                  title="Create File"
                >
                  <FilePlus size={10} />
                </button>
                <button
                  onClick={() => handleStartCreate('folder', path)}
                  className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#0d1117] transition cursor-pointer"
                  title="Create Folder"
                >
                  <FolderPlus size={10} />
                </button>
              </>
            )}
            <button
              onClick={(e) => handleStartRename(e, path)}
              className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#0d1117] transition cursor-pointer"
              title="Rename"
            >
              <Edit size={10} />
            </button>
            <button
              onClick={(e) => handleDeleteClick(e, path)}
              className="p-1 rounded text-[#8b949e] hover:text-red-400 hover:bg-[#0d1117] transition cursor-pointer"
              title="Delete to Trash"
            >
              <Trash2 size={10} />
            </button>
          </div>

        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      
      {/* File Explorer Panels Head */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-[#30363d] bg-[#161b22] shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleStartCreate('file', '')}
            className="p-1 hover:bg-[#0d1117] rounded text-[#8b949e] hover:text-white transition duration-150 cursor-pointer"
            title="Create File in Root"
          >
            <FilePlus size={13} />
          </button>
          <button
            onClick={() => handleStartCreate('folder', '')}
            className="p-1 hover:bg-[#0d1117] rounded text-[#8b949e] hover:text-white transition duration-150 cursor-pointer"
            title="Create Folder in Root"
          >
            <FolderPlus size={13} />
          </button>
        </div>
        <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#8b949e] truncate max-w-[130px]" title={project.name}>
          {project.name}
        </span>
      </div>

      {/* Adding Inputs Row */}
      {showAddInput && (
        <div className="px-3.5 py-2 bg-[#161b22] border-b border-[#30363d] shrink-0">
          <form onSubmit={handleConfirmCreate} className="flex flex-col gap-1 text-xs">
            <span className="font-mono font-bold text-[9px] text-[#8b949e] tracking-wider">
              NEW {showAddInput.type === 'file' ? 'FILE' : 'FOLDER'} 
              {showAddInput.parent ? ` IN /${showAddInput.parent}` : ''}
            </span>
            <div className="flex items-center gap-1 bg-[#0d1117] px-2 h-7 rounded border border-[#30363d] focus-within:border-[#58a6ff]">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Name..."
                className="bg-transparent border-0 outline-none flex-1 text-slate-100 text-[11px] w-full placeholder-[#58a6ff]/40"
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

      {/* Explorer Tree scroll container */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-none space-y-0.5">
        
        {filesList.length === 0 ? (
          <div className="text-center py-10 px-4 font-sans space-y-2">
            <p className="text-slate-500 text-xs">No files yet. Click + to create.</p>
          </div>
        ) : (
          renderTreeNodes()
        )}

      </div>
    </div>
  );
}
