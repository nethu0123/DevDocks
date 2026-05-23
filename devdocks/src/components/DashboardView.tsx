import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Search, FolderCode, Calendar, ShieldAlert,
  ArrowUpRight, Trash2, Edit3, Check, X, RefreshCw, Sparkles, FolderUp, RotateCcw,
  ArrowLeft, LogOut
} from 'lucide-react';
import { AuthUser, Project } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface DashboardViewProps {
  projects: Record<string, Project>;
  onCreateProjectClick: () => void;
  onOpenProject: (id: string) => void;
  onRenameProject: (id: string, newName: string) => void;
  onDeleteProject: (id: string) => void;
  onBackToHome: () => void;
  currentUser: AuthUser;
  onSignOut: () => void;
}

export default function DashboardView({
  projects,
  onCreateProjectClick,
  onOpenProject,
  onRenameProject,
  onDeleteProject,
  onBackToHome,
  currentUser,
  onSignOut
}: DashboardViewProps) {
  const theme: 'dark' | 'light' = 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [localRecycledProjects, setLocalRecycledProjects] = useState<any[]>([]);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    danger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Load deleted projects from local storage registry
  useEffect(() => {
    const loadRecycled = () => {
      try {
        const bin = JSON.parse(localStorage.getItem('devdocks_dashboard_recycle_projects') || '[]');
        setLocalRecycledProjects(bin.filter((item: any) => {
          try {
            const project = JSON.parse(item.content || '{}');
            return project.ownerId === currentUser.id && project.ownerEmail === currentUser.email;
          } catch {
            return false;
          }
        }));
      } catch (e) {
        console.error(e);
      }
    };
    loadRecycled();
    // Poll list occasionally
    const interval = setInterval(loadRecycled, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleRestoreProject = (itemId: string) => {
    try {
      const bin = JSON.parse(localStorage.getItem('devdocks_dashboard_recycle_projects') || '[]');
      const foundIdx = bin.findIndex((x: any) => x.id === itemId);
      if (foundIdx > -1) {
        const trashItem = bin[foundIdx];
        const projData = JSON.parse(trashItem.content) as Project;
        
        // Add back to projects registry in localStorage index
        const currentProjectsState = JSON.parse(localStorage.getItem('devdocks_workspace_state_v1') || '{}');
        const projs = currentProjectsState.projects || {};
        projData.lastEdited = new Date().toLocaleString();
        projs[projData.id] = projData;
        
        localStorage.setItem('devdocks_workspace_state_v1', JSON.stringify({
          ...currentProjectsState,
          projects: projs
        }));

        // Remove from bin
        bin.splice(foundIdx, 1);
        localStorage.setItem('devdocks_dashboard_recycle_projects', JSON.stringify(bin));
        setLocalRecycledProjects(bin);

        // Quick page reload to hook Zustand store
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePermDeleteProject = (itemId: string) => {
    setConfirmState({
      title: 'Delete forever?',
      message: 'Are you sure you want to delete this project forever? This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
      try {
        const bin = JSON.parse(localStorage.getItem('devdocks_dashboard_recycle_projects') || '[]');
        const filtered = bin.filter((x: any) => x.id !== itemId);
        localStorage.setItem('devdocks_dashboard_recycle_projects', JSON.stringify(filtered));
        setLocalRecycledProjects(filtered);
      } catch (e) {
        console.error(e);
      }
      }
    });
  };

  const startRenameInput = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); // Avoid opening workspace
    setEditingId(id);
    setEditName(name);
  };

  const finishRenameInput = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (editName.trim()) {
      onRenameProject(id, editName.trim());
    }
    setEditingId(null);
  };

  const triggerDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Avoid trigger load
    setConfirmState({
      title: 'Move project to Recycle Bin?',
      message: 'You can restore it later from the workspace recycle bin.',
      confirmLabel: 'Move',
      danger: true,
      onConfirm: () => {
      onDeleteProject(id);
      setTimeout(() => {
        // Query update
        try {
          const bin = JSON.parse(localStorage.getItem('devdocks_dashboard_recycle_projects') || '[]');
          setLocalRecycledProjects(bin);
        } catch (err) {}
      }, 500);
      }
    });
  };

  const projectList = Object.values(projects);
  const filteredProjects = projectList.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.techStack.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0d1117] text-[#c9d1d9]' : 'bg-slate-50 text-slate-800'
    } flex flex-col font-sans`}>
      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        confirmLabel={confirmState?.confirmLabel}
        danger={confirmState?.danger}
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          confirmState?.onConfirm();
          setConfirmState(null);
        }}
      />
      
      {/* Upper Navigation Row */}
      <nav className={`w-full border-b transition-colors px-6 h-14 flex items-center justify-between ${
        theme === 'dark' ? 'border-[#30363d] bg-[#161b22]' : 'border-slate-200 bg-white shadow-sm'
      }`}>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToHome}
            title="Back to Homepage"
            className={`p-1.5 rounded border flex items-center justify-center transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#1f242c] border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#c084fc]'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-400 shadow-sm'
            }`}
          >
            <ArrowLeft size={14} className="stroke-[2.5]" />
          </button>

          <div className="h-8 w-8 rounded bg-purple-600 flex items-center justify-center shadow-md">
            <span className="text-white text-[11px] font-black">DD</span>
          </div>
          <span className="font-sans font-bold text-sm tracking-tight text-white dark:text-white">DevDocks IDE</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[11px] font-mono text-[#8b949e]">
            {currentUser.name}
          </span>
          
          <button
            onClick={onCreateProjectClick}
            className="h-8 px-4 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow active:scale-95 border-0"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>CREATE WORKSPACE</span>
          </button>

          <button
            onClick={onSignOut}
            className="h-8 w-8 rounded border border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-white hover:bg-[#1f242c] flex items-center justify-center transition cursor-pointer"
            title="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </nav>

      {/* Main Container Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight font-sans text-white dark:text-white">
              Developer Workbenches
            </h1>
            <p className="text-xs text-[#8b949e] mt-1">Select an active workspace, restore recently archived pages, or configure a customizable starter template.</p>
          </div>
          
          {/* Dynamic Search Box */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8b949e]" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-8.5 pl-8 pr-4 rounded text-xs outline-none transition border ${
                theme === 'dark'
                  ? 'bg-[#161b22] border-[#30363d] text-[#c9d1d9] focus:border-[#c084fc] placeholder-[#8b949e]'
                  : 'bg-white border-slate-200 text-slate-700 focus:border-purple-400 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Dynamic Project Grid list rendering */}
        {filteredProjects.length === 0 ? (
          /* Empty Sandbox State */
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-16 rounded border text-center flex flex-col items-center justify-center space-y-4 ${
              theme === 'dark' ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className={`h-12 w-12 rounded flex items-center justify-center text-[#c084fc] border ${
              theme === 'dark' ? 'bg-[#0d1117] border-[#30363d]' : 'bg-purple-500/10 border-purple-500/20'
            }`}>
              <FolderCode size={22} className="animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white dark:text-white">Start your first project</h3>
              <p className="text-xs text-[#8b949e] max-w-sm leading-relaxed">
                Initialize an offline-first dev workspace featuring dynamic live styling, custom package support, and sandbox diagnostics.
              </p>
            </div>

            <button
              onClick={onCreateProjectClick}
              className="h-9 px-4 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-xs flex items-center gap-1.5 transform active:scale-95 cursor-pointer transition shadow border-0"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Create Project Workspace</span>
            </button>
          </motion.div>
        ) : (
          /* Projects Render List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => {
              const isEditing = editingId === project.id;
              
              return (
                <motion.div
                  key={project.id}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  onClick={() => onOpenProject(project.id)}
                  className={`group relative rounded border flex flex-col justify-between p-5 shadow-sm transition-all duration-150 cursor-pointer overflow-hidden ${
                    theme === 'dark'
                      ? 'bg-[#161b22] border-[#30363d] hover:border-[#c084fc]'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  
                  {/* Card Upper Info section */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      {/* Name or Renaming inputs */}
                      <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                        {isEditing ? (
                          <form onSubmit={(e) => finishRenameInput(e, project.id)} className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className={`px-2 py-0.5 text-xs font-bold border rounded outline-none w-full ${
                                theme === 'dark'
                                  ? 'bg-[#0d1117] border-[#30363d] text-white'
                                  : 'bg-slate-50 border-slate-300 text-slate-900'
                              }`}
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                            >
                              <Check size={13} strokeWidth={2.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              <X size={13} strokeWidth={2.5} />
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-1">
                            <h3 className="font-bold text-white dark:text-white group-hover:text-[#c084fc] text-sm transition-colors">
                              {project.name}
                            </h3>
                            <ArrowUpRight size={12} className="text-[#8b949e] group-hover:text-[#c084fc] transition-colors" />
                          </div>
                        )}
                      </div>

                      {/* Operation Buttons */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => startRenameInput(e, project.id, project.name)}
                          className={`p-1 rounded cursor-pointer transition ${
                            theme === 'dark'
                              ? 'border border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:text-white hover:bg-[#1f242c]'
                              : 'border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                          title="Rename Workspace"
                        >
                          <Edit3 size={11} />
                        </button>
                        <button
                          onClick={(e) => triggerDelete(e, project.id)}
                          className={`p-1 rounded cursor-pointer transition ${
                            theme === 'dark'
                              ? 'border border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:text-red-400 hover:bg-red-500/10'
                              : 'border border-slate-200 bg-slate-50 text-slate-500 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title="Move to Recycle Bin"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Description text */}
                    <p className={`text-xs line-clamp-2 leading-relaxed h-8 ${
                      theme === 'dark' ? 'text-[#8b949e]' : 'text-slate-500'
                    }`}>
                      {project.description || 'Virtual workspace platform compiler setup.'}
                    </p>
                  </div>

                  {/* Bottom Stats & Tech badges */}
                  <div className={`mt-4 pt-3 border-t space-y-2 ${
                    theme === 'dark' ? 'border-[#30363d]' : 'border-slate-100'
                  }`}>
                    {/* Badge list */}
                    <div className="flex flex-wrap gap-1">
                      {project.techStack.slice(0, 4).map(t => (
                        <span key={t} className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          theme === 'dark'
                            ? 'bg-[#0d1117] border border-[#30363d] text-[#8b949e]'
                            : 'bg-slate-100 border border-slate-200 text-slate-600'
                        }`}>
                          {t}
                        </span>
                      ))}
                      {project.techStack.length > 4 && (
                        <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                          theme === 'dark' ? 'bg-[#0d1117] text-slate-500' : 'bg-slate-100 text-slate-400'
                        }`}>
                          +{project.techStack.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Left edited timestamp */}
                    <div className="flex items-center gap-1 text-[10px] text-[#8b949e] font-mono">
                      <Calendar size={10} />
                      <span>Saved: {project.lastEdited ? project.lastEdited.split(',')[0] : 'Today'}</span>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}

        {/* Recently Deleted / Projects Recycle list */}
        {localRecycledProjects.length > 0 && (
          <div className="border-t border-[#30363d] pt-6 mt-10 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-amber-500 animate-pulse" />
              <h2 className="font-mono font-bold text-xs tracking-wider uppercase text-[#8b949e]">
                WORKSPACE RECYCLE BIN ({localRecycledProjects.length})
              </h2>
            </div>
            
            <div className={`rounded p-3 space-y-1.5 ${
              theme === 'dark' ? 'bg-[#161b22] border border-[#30363d]' : 'bg-slate-100/60 border-slate-200'
            }`}>
              {localRecycledProjects.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs py-1.5 px-2.5 hover:bg-[#0d1117] rounded transition group">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#c9d1d9]">{item.name}</span>
                    <span className="text-[10px] text-[#8b949e] font-mono">Archived: {item.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleRestoreProject(item.id)}
                      className="px-2 py-0.5 text-[#c084fc] bg-[#c084fc]/5 hover:bg-[#c084fc]/15 rounded border border-[#c084fc]/20 text-[10px] font-mono transition cursor-pointer"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handlePermDeleteProject(item.id)}
                      className="p-1 text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

