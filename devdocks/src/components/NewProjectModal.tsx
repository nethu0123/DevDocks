import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cpu, Check, Layers, Code, Sparkles, HelpCircle } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, techStack: string[]) => void;
}

const TECH_OPTIONS = [
  { id: 'React', label: 'React', desc: 'Auto bundles react & react-dom components', defaultChecked: true },
  { id: 'TypeScript', label: 'TypeScript', desc: 'Enables custom type-checking & compiler helpers', defaultChecked: true },
  { id: 'Tailwind CSS', label: 'Tailwind CSS', desc: 'Adds Tailwind CSS utility integrations', defaultChecked: true },
  { id: 'Framer Motion', label: 'Framer Motion', desc: 'Adds framer-motion library tags', defaultChecked: false },
  { id: 'Zustand', label: 'Zustand', desc: 'Adds Zustand light weight reactive state store', defaultChecked: false },
  { id: 'Axios', label: 'Axios', desc: 'For robust promise-based browser requests', defaultChecked: false },
  { id: 'React Router', label: 'React Router', desc: 'Includes client-side virtual routing packages', defaultChecked: false },
  { id: 'Lucide React', label: 'Lucide React', desc: 'Enables access to beautiful icon badges', defaultChecked: true },
];

export default function NewProjectModal({ isOpen, onClose, onCreate }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState<string[]>(
    TECH_OPTIONS.filter(t => t.defaultChecked).map(t => t.id)
  );
  const [error, setError] = useState('');

  const handleToggleTech = (techId: string) => {
    // React is mandatory for these templates
    if (techId === 'React') return;
    
    setTechStack(prev => 
      prev.includes(techId) ? prev.filter(t => t !== techId) : [...prev, techId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    setError('');
    onCreate(name.trim(), description.trim(), techStack);
    
    // Reset form
    setName('');
    setDescription('');
    // Reset to defaults
    setTechStack(TECH_OPTIONS.filter(t => t.defaultChecked).map(t => t.id));
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-2xl bg-[#0d1117] border border-[#30363d] rounded overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#161b22]">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
                  <Layers size={15} />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm text-white">Create New Workspace</h3>
                  <p className="text-xs text-[#8b949e]">Bootstrap structured development boilerplates</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="h-7 w-7 rounded flex items-center justify-center text-[#8b949e] hover:bg-[#1f242c] hover:text-white transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              
              {/* Name Section */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[#8b949e] uppercase tracking-wider block">
                  Project Name <span className="text-[#58a6ff]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. state-counter-app"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value.trim()) setError('');
                  }}
                  className="w-full h-9 px-3 rounded bg-[#161b22] border border-[#30363d] text-[#c9d1d9] placeholder-[#8b949e] text-xs focus:border-[#58a6ff] outline-none transition"
                  autoFocus
                />
                {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[#8b949e] uppercase tracking-wider block">
                  Description
                </label>
                <textarea
                  placeholder="Optional summary or notes about this development workspace"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[56px] p-3 rounded bg-[#161b22] border border-[#30363d] text-[#c9d1d9] placeholder-[#8b949e] text-xs focus:border-[#58a6ff] outline-none transition resize-none"
                />
              </div>

              {/* Tech stack selectors */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold text-[#8b949e] uppercase tracking-wider block">
                    Prearrange Dependencies Stack
                  </label>
                  <span className="text-[9px] text-[#8b949e] font-mono">React 19 Environment</span>
                </div>
                
                {/* Tech Badges Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TECH_OPTIONS.map((tech) => {
                    const isSelected = techStack.includes(tech.id);
                    return (
                      <div
                        key={tech.id}
                        onClick={() => handleToggleTech(tech.id)}
                        className={`group p-3 rounded border flex items-start gap-2.5 cursor-pointer transition select-none ${
                          isSelected
                            ? 'bg-[#1f242c] border-[#58a6ff]/60'
                            : 'bg-[#161b22] border-[#30363d] hover:border-[#8b949e]'
                        }`}
                      >
                        {/* Checkbox button box */}
                        <div className={`mt-0.5 h-3.5 w-3.5 rounded flex items-center justify-center border text-white transition-colors ${
                          isSelected
                            ? 'bg-[#2188ff] border-[#2188ff]'
                            : 'border-[#30363d] bg-[#0d1117]'
                        }`}>
                          {isSelected && <Check size={9} strokeWidth={3} />}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-[#58a6ff]' : 'text-[#c9d1d9]'}`}>
                              {tech.label}
                            </span>
                            {tech.id === 'React' && (
                              <span className="text-[8px] bg-blue-500/10 text-blue-400 font-mono px-1 py-0.2 rounded border border-blue-500/20">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#8b949e] mt-0.5 line-clamp-1 leading-relaxed">
                            {tech.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </form>

            {/* Modal Footer Controls */}
            <div className="px-6 py-3 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e] font-mono">
                <Sparkles size={11} className="text-[#58a6ff]" />
                <span>Save state locally</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 h-8 rounded text-[#8b949e] hover:text-white text-xs hover:bg-[#1f242c] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 h-8 rounded bg-[#238636] text-white hover:bg-[#2ea043] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95 border-0"
                >
                  <Cpu size={12} />
                  <span>PROVISION WORKSPACE</span>
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
