import React, { useState } from 'react';
import { User, Library, Award, Calendar, ExternalLink, Activity, Sparkles, Building2 } from 'lucide-react';
import { Project } from '../types';

interface ProfilePanelProps {
  projects: Record<string, Project>;
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
}

export default function ProfilePanel({
  projects,
  activeProjectId,
  onSelectProject
}: ProfilePanelProps) {
  const projectList = Object.values(projects);
  const [selectedDetailsId, setSelectedDetailsId] = useState<string | null>(
    activeProjectId || (projectList.length > 0 ? projectList[0].id : null)
  );

  const activeDetails = selectedDetailsId ? projects[selectedDetailsId] : null;

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      
      {/* Title Header */}
      <div className="p-3 border-b border-[#30363d] bg-[#161b22] shrink-0">
        <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#8b949e] block">
          Developer Workspace Profile
        </span>
      </div>

      {/* Main scrolling card blocks */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        
        {/* User Card */}
        <div className="p-4 rounded border border-[#30363d] bg-[#161b22] relative overflow-hidden group">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#58a6ff] font-bold">
              <User size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white block truncate">
                nethu012345
              </span>
              <span className="text-[9px] font-mono text-[#8b949e] block truncate">
                nethu012345@gmail.com
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#30363d]">
            <div className="text-center bg-[#0d1117] p-2 rounded border border-[#30363d]">
              <span className="text-[9px] uppercase font-mono font-bold text-[#8b949e] block">Workspaces</span>
              <span className="text-xs font-bold text-[#58a6ff] font-mono mt-0.5 block">{projectList.length}</span>
            </div>
            <div className="text-center bg-[#0d1117] p-2 rounded border border-[#30363d]">
              <span className="text-[9px] uppercase font-mono font-bold text-[#8b949e] block">XP Rank</span>
              <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5 block">Lvl Gold</span>
            </div>
          </div>
        </div>

        {/* Selected Project Full Details info panel */}
        <div>
          <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#8b949e] block mb-2">Selected Workspace Info</span>
          {activeDetails ? (
            <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] space-y-3 font-sans">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-white leading-tight">{activeDetails.name}</span>
                <button
                  onClick={() => onSelectProject(activeDetails.id)}
                  className="px-2 h-6 bg-[#1f6feb] text-white text-[10px] font-bold rounded flex items-center gap-1 hover:bg-[#388bfd] cursor-pointer transition select-none border-0"
                >
                  <ExternalLink size={9} />
                  <span>Mount IDE</span>
                </button>
              </div>

              <p className="text-[11px] text-[#8b949e] leading-relaxed">
                {activeDetails.description || 'No custom details added to this sandbox.'}
              </p>

              {/* Stack Details */}
              <div className="space-y-1.5 pt-1.5 border-t border-[#30363d]">
                <span className="text-[9px] font-bold text-[#8b949e] uppercase tracking-wider block font-mono">Active Stack integrations</span>
                <div className="flex flex-wrap gap-1">
                  {activeDetails.techStack.map(t => (
                    <span key={t} className="text-[9px] font-mono bg-[#0d1117] border border-[#30363d] px-1.5 py-0.2 rounded text-[#c9d1d9]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Meta statistics */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[9px] font-mono text-[#8b949e]">
                <div>
                  <span className="block text-[8px] text-[#8b949e] font-sans font-bold uppercase">CREATED</span>
                  <span className="block text-[#c9d1d9] mt-0.5 truncate">{activeDetails.createdDate?.split(',')[0]}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-[#8b949e] font-sans font-bold uppercase">LAST EDITED</span>
                  <span className="block text-[#c9d1d9] mt-0.5 truncate">{activeDetails.lastEdited?.split(',')[0]}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-[#8b949e] text-xs italic">
              Select or open a workspace in the grid first.
            </div>
          )}
        </div>

        {/* Workspace index directory lists */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Library size={11} className="text-[#8b949e]" />
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#8b949e]">All Workspaces Grid ({projectList.length})</span>
          </div>

          <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
            {projectList.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedDetailsId(p.id)}
                className={`p-2 rounded border text-xs font-mono flex items-center justify-between cursor-pointer transition select-none ${
                  selectedDetailsId === p.id
                    ? 'bg-[#1f242c] border-[#58a6ff] text-[#58a6ff]'
                    : 'bg-[#161b22] border-[#30363d] text-[#c9d1d9] hover:bg-[#1f242c]'
                }`}
              >
                <span className="font-bold truncate max-w-[125px]">{p.name}</span>
                <span className="text-[8.5px] text-[#8b949e] shrink-0">{p.techStack.length} units</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
