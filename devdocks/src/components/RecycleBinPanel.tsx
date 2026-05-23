import React from 'react';
import { RotateCcw, Trash2, Calendar, FileMinus, History, Info, BookOpen } from 'lucide-react';
import { Project, RecycleBinItem } from '../types';

interface RecycleBinPanelProps {
  project: Project;
  onRestore: (itemId: string) => void;
  onDeleteForever: (itemId: string) => void;
}

export default function RecycleBinPanel({
  project,
  onRestore,
  onDeleteForever
}: RecycleBinPanelProps) {
  const bin = project.recycleBin || [];
  const logs = [...(project.historyLogs || [])].reverse(); // Show newest events first

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      
      {/* Title Header */}
      <div className="p-3 border-b border-[#30363d] bg-[#161b22] shrink-0">
        <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#8b949e] block">
          Recycle Bin & History Log
        </span>
      </div>

      {/* Main scrolling section */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        
        {/* Deleted files section */}
        <div>
          <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#8b949e] block mb-2">Deleted Files & Folders ({bin.length})</span>
          {bin.length === 0 ? (
            <div className="text-center py-6 bg-[#0d1117] border border-[#30363d] border-dashed rounded text-[#8b949e] text-xs font-sans">
              Recycle bin is empty.
            </div>
          ) : (
            <div className="space-y-1.5">
              {bin.map((item) => (
                <div key={item.id} className="p-2.5 rounded border border-[#30363d] bg-[#161b22] hover:bg-[#1f242c] flex flex-col gap-2 transition group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs font-bold text-white block truncate" title={item.originalPath}>
                        {item.name}
                      </span>
                      <span className="text-[9px] font-mono text-[#8b949e] truncate block">
                        Original: {item.originalPath || 'unknown'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onRestore(item.id)}
                        className="p-1.5 rounded bg-[#0d1117] border border-[#30363d] text-[#c084fc] hover:text-white hover:bg-[#1f242c] transition cursor-pointer"
                        title="Restore"
                      >
                        <RotateCcw size={10} />
                      </button>
                      <button
                        onClick={() => onDeleteForever(item.id)}
                        className="p-1.5 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e] hover:text-red-400 hover:bg-[#1f242c] transition cursor-pointer"
                        title="Delete Forever"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                  
                  <span className="text-[8px] font-mono text-[#8b949e] text-right">
                    Deleted at {item.timestamp}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History Log checklist */}
        <div className="border-t border-[#30363d] pt-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <History size={11} className="text-[#8b949e] shrink-0" />
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#8b949e]">Project Event Logs / History</span>
          </div>
          
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <span className="text-[10px] text-[#8b949e] font-mono select-none">No events recorded yet.</span>
            ) : (
               logs.map((log) => (
                <div key={log.id} className="p-2 bg-[#161b22] border border-[#30363d] rounded flex items-start gap-2 text-[10.5px]">
                  <span className="text-[8px] font-mono text-[#8b949e] bg-[#0d1117] px-1 py-0.5 rounded select-none shrink-0 mt-0.5">
                    {log.timestamp}
                  </span>
                  <div className="min-w-0 flex-1 leading-normal text-[#c9d1d9]">
                    <p className="break-all font-mono text-[10px]">{log.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

