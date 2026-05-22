import { create } from 'zustand';
import { Project, FileNode, RecycleBinItem, HistoryLog, TerminalLog, SidebarPanel, AppState } from './types';

interface AppStore extends AppState {
  // Navigation actions
  setCurrentView: (view: 'landing' | 'dashboard' | 'ide') => void;
  setActiveProject: (projectId: string | null) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setSidebarPanel: (panel: SidebarPanel) => void;
  setTerminalOpen: (open: boolean) => void;
  
  // Project Actions
  createProject: (name: string, description: string, techStack: string[]) => string;
  renameProject: (projectId: string, newName: string) => void;
  deleteProject: (projectId: string) => void;
  restoreProject: (itemId: string) => void;
  deleteProjectPermanently: (itemId: string) => void;
  
  // File System Actions
  createFile: (projectId: string, path: string, content: string) => boolean;
  createFolder: (projectId: string, path: string) => boolean;
  renameFileOrFolder: (projectId: string, oldPath: string, newPath: string) => boolean;
  deleteFileOrFolder: (projectId: string, path: string) => void;
  restoreFileOrFolder: (projectId: string, itemId: string) => void;
  deletePermanently: (projectId: string, itemId: string) => void;
  
  // Tabs and Editing
  updateFileContent: (projectId: string, path: string, content: string) => void;
  saveChanges: (projectId: string) => void;
  openTab: (projectId: string, path: string) => void;
  closeTab: (projectId: string, path: string) => void;
  setUnsavedDraft: (projectId: string, path: string, content: string | null) => void;
  
  // Packages and Extensions
  installPackage: (projectId: string, packageName: string) => void;
  uninstallPackage: (projectId: string, packageName: string) => void;
  installExtension: (projectId: string, extensionId: string) => void;
  uninstallExtension: (projectId: string, extensionId: string) => void;
  
  // Terminal actions
  addTerminalLog: (log: Omit<TerminalLog, 'id' | 'timestamp'>) => void;
  executeTerminalCommand: (commandStr: string) => void;
  clearTerminal: () => void;
  
  // Dimensions
  setSidebarWidth: (width: number) => void;
  setEditorWidth: (width: number) => void;
  setTerminalHeight: (height: number) => void;
  
  // Helper draft buffers (so we don't pollute saved state during typing)
  unsavedDrafts: Record<string, string>; // path -> temporary code buffer
}

// Global project templates generator
export function generateStarterFiles(name: string, techStack: string[]) {
  const hasTs = techStack.includes('TypeScript');
  const hasTailwind = techStack.includes('Tailwind CSS');
  const hasFramer = techStack.includes('Framer Motion');
  const hasZustand = techStack.includes('Zustand');
  const hasAxios = techStack.includes('Axios');
  const hasRouter = techStack.includes('React Router');
  const hasLucide = techStack.includes('Lucide React');

  const ext = hasTs ? 'tsx' : 'jsx';
  const mainExt = hasTs ? 'tsx' : 'jsx';

  const files: Record<string, FileNode> = {};

  // Folders
  files['src'] = { path: 'src', content: '', isFolder: true };

  // index.html
  files['index.html'] = {
    path: 'index.html',
    isFolder: false,
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
    ${hasTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
  </head>
  <body class="bg-slate-905 text-white font-sans antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.${mainExt}"></script>
  </body>
</html>`
  };

  // package.json dependencies
  const deps: Record<string, string> = {
    "react": "^19.0.1",
    "react-dom": "^19.0.1"
  };
  if (hasTs) {
    deps["typescript"] = "~5.8.2";
    deps["@types/react"] = "^19.0.1";
    deps["@types/react-dom"] = "^19.0.1";
  }
  if (hasTailwind) {
    deps["tailwindcss"] = "^4.1.14";
    deps["postcss"] = "^8.4.38";
    deps["autoprefixer"] = "^10.4.19";
  }
  if (hasFramer) deps["framer-motion"] = "^12.23.24";
  if (hasZustand) deps["zustand"] = "^4.5.2";
  if (hasAxios) deps["axios"] = "^1.6.8";
  if (hasRouter) deps["react-router-dom"] = "^6.22.3";
  if (hasLucide) deps["lucide-react"] = "^0.354.0";

  files['package.json'] = {
    path: 'package.json',
    isFolder: false,
    content: JSON.stringify({
      name: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      version: "1.0.0",
      dependencies: deps
    }, null, 2)
  };

  // CSS File
  files['src/styles.css'] = {
    path: 'src/styles.css',
    isFolder: false,
    content: hasTailwind 
      ? `/* Tailwind stylesheet */
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background-color: #0b1329;
  color: #f1f5f9;
  font-family: system-ui, -apple-system, sans-serif;
}`
      : `/* Custom style block */
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background-color: #111;
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
  text-align: center;
}`
  };

  // App.tsx
  const appCode = `import React${hasZustand ? ', { useState }' : ''} from 'react';
${hasLucide ? "import { Flame, Sparkles, Terminal, Code, Cpu, Package, Check, RefreshCw } from 'lucide-react';" : ''}
${hasFramer ? "import { motion } from 'framer-motion';" : ''}
${hasZustand ? "import { create } from 'zustand';" : ''}

${hasZustand ? `// Visual state with Zustand Store
interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}
const useCounter = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));` : ''}

export default function App() {
  ${hasZustand ? 'const { count, increment, decrement } = useCounter();' : 'const [count, setCount] = React.useState(0);'}
  
  return (
    <div className="min-h-screen bg-[#0b1329] text-slate-100 flex flex-col justify-center items-center p-6 select-none font-sans">
      <div className="max-w-2xl w-full bg-slate-800/60 border border-slate-700/40 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        
        {/* Header Hero */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-slate-950 font-bold shadow-lg">
            ${hasLucide ? '<Flame className="h-6 w-6 text-slate-950" />' : 'DD'}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              ${name}
            </h1>
            <p className="text-sm text-slate-400">Successfully running in browser sandboxed sandbox preview!</p>
          </div>
        </div>

        <p className="text-slate-300 mb-6 leading-relaxed">
          Welcome to your first DevDocks project! Edit files in the Explorer on the left, watch modifications transpile on the fly, or play with the active state controls below.
        </p>

        {/* Dynamic Badges based on techStack list */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Selected Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            ${techStack.map(stack => `
            <span key="${stack}" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-200 border border-slate-600/30">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
              ${stack}
            </span>`).join('')}
          </div>
        </div>

        {/* Features demo box with live state */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-300">Live Workspace React State</h3>
              <p className="text-xs text-slate-500">${hasZustand ? 'Powered by Zustand Local Store' : 'Powered by vanilla React state'}</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => ${hasZustand ? 'decrement()' : 'setCount(c => c - 1)'}}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 active:scale-95 transition"
              >
                -
              </button>
              <span className="w-10 text-center font-mono text-lg text-cyan-400 font-semibold bg-slate-950/80 py-1 rounded">
                {count}
              </span>
              <button 
                onClick={() => ${hasZustand ? 'increment()' : 'setCount(c => c + 1)'}}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 active:scale-95 transition"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Technical Info Foot */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            ${hasLucide ? '<Terminal className="h-3.5 w-3.5" />' : '<span>⌨</span>'}
            <span>Interactive Run Mode</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-500/80">
            ${hasLucide ? '<Sparkles className="h-3.5 w-3.5" />' : '<span>✨</span>'}
            <span>DevDocks Sandbox Runner</span>
          </div>
        </div>

      </div>
    </div>
  );
}`;

  files[`src/App.${ext}`] = {
    path: `src/App.${ext}`,
    isFolder: false,
    content: appCode
  };

  // main.tsx
  const mainCode = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

  files[`src/main.${mainExt}`] = {
    path: `src/main.${mainExt}`,
    isFolder: false,
    content: mainCode
  };

  return files;
}

// Load initial state from local storage securely
const STORAGE_KEY = 'devdocks_workspace_state_v1';
const loadPersistedState = (): Partial<AppState> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      
      // Rigorous sanitization for numerical workspace layout scales to prevent collapsing
      const fileExplorerWidth = Math.max(180, Math.min(Number(parsed.sidebarWidth) || 260, 480));
      const centralEditorPercent = Math.max(15, Math.min(Number(parsed.editorWidth) !== undefined && !isNaN(Number(parsed.editorWidth)) ? Number(parsed.editorWidth) : 50, 85));
      const bottomTerminalHeight = Math.max(80, Math.min(Number(parsed.terminalHeight) || 200, 600));

      // Ensure structures are loaded correctly
      return {
        projects: parsed.projects || {},
        activeProjectId: parsed.activeProjectId || null,
        currentView: parsed.currentView || 'landing',
        theme: parsed.theme || 'dark',
        sidebarPanel: parsed.sidebarPanel || 'explorer',
        terminalOpen: parsed.terminalOpen !== undefined ? parsed.terminalOpen : false,
        terminalLogs: parsed.terminalLogs || [],
        terminalCommandHistory: parsed.terminalCommandHistory || [],
        terminalCwd: parsed.terminalCwd || 'root',
        sidebarWidth: fileExplorerWidth,
        editorWidth: centralEditorPercent,
        terminalHeight: bottomTerminalHeight,
      };
    }
  } catch (err) {
    console.error('Failed to load persisted state:', err);
  }
  return {};
};

const saveStateToLocalStorage = (state: Partial<AppState>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to persist state:', e);
  }
};

export const useStore = create<AppStore>((set, get) => ({
  // Core default status
  projects: {},
  activeProjectId: null,
  currentView: 'landing',
  theme: 'dark',
  sidebarPanel: 'explorer',
  terminalOpen: false,
  terminalLogs: [
    {
      id: 'welcome',
      type: 'system',
      content: 'DevDocks OS/Runtime v1.0.0. Type "help" or select terminal icons.',
      timestamp: new Date().toLocaleTimeString()
    }
  ],
  terminalCommandHistory: [],
  terminalCwd: 'root',
  sidebarWidth: 260,
  editorWidth: 50,
  terminalHeight: 200,
  
  // Temporary live drafts which aren't permanently written to File System until Ctrl+S or Save is clicked
  unsavedDrafts: {},

  ...loadPersistedState(),

  // Navigation handlers
  setCurrentView: (view) => {
    set({ currentView: view });
    // Write out changes
    saveStateToLocalStorage({
      ...get(),
      currentView: view
    });
  },

  setActiveProject: (projectId) => {
    set({ activeProjectId: projectId });
    if (projectId) {
      const proj = get().projects[projectId];
      if (proj) {
        // Clear active draft buffers
        set({ unsavedDrafts: {} });
        saveStateToLocalStorage({
          ...get(),
          activeProjectId: projectId
        });
      }
    } else {
      saveStateToLocalStorage({
        ...get(),
        activeProjectId: null
      });
    }
  },

  setTheme: (theme) => {
    set({ theme });
    // Update body Class name for tailwind style switching
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    saveStateToLocalStorage({
      ...get(),
      theme
    });
  },

  setSidebarPanel: (panel) => {
    set({ sidebarPanel: panel });
    saveStateToLocalStorage({
      ...get(),
      sidebarPanel: panel
    });
  },

  setTerminalOpen: (open) => {
    set({ terminalOpen: open });
    saveStateToLocalStorage({
      ...get(),
      terminalOpen: open
    });
  },

  // Projects CRUD
  createProject: (name, description, techStack) => {
    const id = 'proj_' + Math.random().toString(36).substring(2, 11);
    const dateStr = new Date().toLocaleString();
    
    // Auto-generate prearranged starter packages/extensions
    const starterPackages: string[] = ['react', 'react-dom'];
    if (techStack.includes('TypeScript')) starterPackages.push('typescript', '@types/react', '@types/react-dom');
    if (techStack.includes('Tailwind CSS')) starterPackages.push('tailwindcss', 'postcss', 'autoprefixer');
    if (techStack.includes('Framer Motion')) starterPackages.push('framer-motion');
    if (techStack.includes('Zustand')) starterPackages.push('zustand');
    if (techStack.includes('Axios')) starterPackages.push('axios');
    if (techStack.includes('React Router')) starterPackages.push('react-router-dom');
    if (techStack.includes('Lucide React')) starterPackages.push('lucide-react');

    const starterExtensions: string[] = [];
    if (techStack.includes('React')) starterExtensions.push('React Snippets');
    if (techStack.includes('Tailwind CSS')) starterExtensions.push('Tailwind IntelliSense');
    if (techStack.includes('TypeScript')) starterExtensions.push('TypeScript Tools');
    starterExtensions.push('Prettier', 'ESLint');

    const starterFiles = generateStarterFiles(name, techStack);

    const history: HistoryLog[] = [
      {
        id: 'init',
        timestamp: new Date().toLocaleTimeString(),
        action: 'create',
        message: `Project ${name} created with stack: ${techStack.join(', ')}`
      }
    ];

    const newProject: Project = {
      id,
      name,
      description,
      techStack,
      files: starterFiles,
      openTabs: ['src/App.tsx'],
      activeFile: 'src/App.tsx',
      installedPackages: starterPackages,
      installedExtensions: starterExtensions,
      recycleBin: [],
      historyLogs: history,
      createdDate: dateStr,
      lastEdited: dateStr
    };

    set((state) => {
      const updatedProjects = { ...state.projects, [id]: newProject };
      const updated = {
        ...state,
        projects: updatedProjects
      };
      saveStateToLocalStorage(updated);
      return updated;
    });

    return id;
  },

  renameProject: (projectId, newName) => {
    set((state) => {
      const proj = state.projects[projectId];
      if (!proj) return {};
      
      const updatedProj: Project = {
        ...proj,
        name: newName,
        lastEdited: new Date().toLocaleString(),
        historyLogs: [
          ...proj.historyLogs,
          {
            id: 'rename_' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            action: 'rename',
            message: `Project renamed to ${newName}`
          }
        ]
      };

      const updated = {
        ...state,
        projects: { ...state.projects, [projectId]: updatedProj }
      };
      saveStateToLocalStorage(updated);
      return updated;
    });
  },

  deleteProject: (projectId) => {
    set((state) => {
      const proj = state.projects[projectId];
      if (!proj) return {};

      // Prepare Recycle bin item containing full project JSON payload!
      const trashItem: RecycleBinItem = {
        id: 'trash_' + projectId,
        name: proj.name,
        type: 'project',
        content: JSON.stringify(proj),
        timestamp: new Date().toLocaleString()
      };

      // Extract from open database
      const remainingProjects = { ...state.projects };
      delete remainingProjects[projectId];

      // Add to other remaining projects recycle bins or keep global trash bin? 
      // Since project deletion is a global action, let's store it globally, 
      // or we can represent Trash in the workspace Recycle Bin panel list.
      // Let's store project deletions globally in a dedicated "recycle bin" or add to standard store project keys. Since we are on dashboard when deleting project, we can store in any surviving project or keep a standalone global recycle bin lists in other projects. Let's make sure it is saved safely.
      // Let's store dead projects inside a global recycle bin, or attach to standard local storage keys for recovery! Let's append to localStorage.
      
      const updated = {
        ...state,
        projects: remainingProjects,
        // Let's add it to some survivor log or store in a global list
      };

      // Let's also push it into a backup key in localStorage if needed so we can restore deleted projects on dashboard! Yes, this is perfect.
      const globalBin = JSON.parse(localStorage.getItem('devdocks_dashboard_recycle_projects') || '[]');
      globalBin.push(trashItem);
      localStorage.setItem('devdocks_dashboard_recycle_projects', JSON.stringify(globalBin));

      saveStateToLocalStorage(updated);
      return updated;
    });
  },

  restoreProject: (itemId) => {
    try {
      const globalBin = JSON.parse(localStorage.getItem('devdocks_dashboard_recycle_projects') || '[]');
      const foundIdx = globalBin.findIndex((item: RecycleBinItem) => item.id === itemId);
      if (foundIdx > -1) {
        const trashItem = globalBin[foundIdx];
        const projData = JSON.parse(trashItem.content!) as Project;
        
        // Restore
        projData.lastEdited = new Date().toLocaleString();
        projData.historyLogs.push({
          id: 'restore_' + Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          action: 'restore',
          message: `Project ${projData.name} restored from Recycle Bin`
        });

        set((state) => {
          const updated = {
            ...state,
            projects: { ...state.projects, [projData.id]: projData }
          };
          saveStateToLocalStorage(updated);
          return updated;
        });

        globalBin.splice(foundIdx, 1);
        localStorage.setItem('devdocks_dashboard_recycle_projects', JSON.stringify(globalBin));
      }
    } catch (e) {
      console.error(e);
    }
  },

  deleteProjectPermanently: (itemId) => {
    try {
      const globalBin = JSON.parse(localStorage.getItem('devdocks_dashboard_recycle_projects') || '[]');
      const filtered = globalBin.filter((item: RecycleBinItem) => item.id !== itemId);
      localStorage.setItem('devdocks_dashboard_recycle_projects', JSON.stringify(filtered));
      set({}); // Trigger quick refresh
    } catch (e) {
      console.error(e);
    }
  },

  // Virtual Files CRUD
  createFile: (projectId, path, content) => {
    const proj = get().projects[projectId];
    if (!proj) return false;
    if (proj.files[path]) return false; // File exists!

    set((state) => {
      const currentProj = state.projects[projectId];
      const newFiles = {
        ...currentProj.files,
        [path]: { path, content, isFolder: false }
      };

      const updatedProj: Project = {
        ...currentProj,
        files: newFiles,
        lastEdited: new Date().toLocaleString(),
        historyLogs: [
          ...currentProj.historyLogs,
          {
            id: 'create_file_' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            action: 'create',
            message: `File "${path}" created`
          }
        ]
      };

      const updated = {
        ...state,
        projects: { ...state.projects, [projectId]: updatedProj }
      };
      saveStateToLocalStorage(updated);
      return updated;
    });

    return true;
  },

  createFolder: (projectId, path) => {
    const proj = get().projects[projectId];
    if (!proj) return false;
    if (proj.files[path]) return false;

    set((state) => {
      const currentProj = state.projects[projectId];
      const newFiles = {
        ...currentProj.files,
        [path]: { path, content: '', isFolder: true }
      };

      const updatedProj: Project = {
        ...currentProj,
        files: newFiles,
        lastEdited: new Date().toLocaleString(),
        historyLogs: [
          ...currentProj.historyLogs,
          {
            id: 'create_folder_' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            action: 'create',
            message: `Folder "${path}" created`
          }
        ]
      };

      const updated = {
        ...state,
        projects: { ...state.projects, [projectId]: updatedProj }
      };
      saveStateToLocalStorage(updated);
      return updated;
    });

    return true;
  },

  renameFileOrFolder: (projectId, oldPath, newPath) => {
    const proj = get().projects[projectId];
    if (!proj) return false;
    if (proj.files[newPath]) return false;

    set((state) => {
      const currentProj = state.projects[projectId];
      const target = currentProj.files[oldPath];
      if (!target) return {};

      const newFiles = { ...currentProj.files };
      
      // If folder: Rename all content starting with `oldPath/` !
      if (target.isFolder) {
        Object.keys(newFiles).forEach((p) => {
          if (p === oldPath) {
            delete newFiles[oldPath];
            newFiles[newPath] = { path: newPath, content: '', isFolder: true };
          } else if (p.startsWith(oldPath + '/')) {
            const relative = p.substring(oldPath.length + 1);
            const renamedKey = `${newPath}/${relative}`;
            const fileItem = newFiles[p];
            delete newFiles[p];
            newFiles[renamedKey] = { ...fileItem, path: renamedKey };
          }
        });
      } else {
        // Individual file rename
        delete newFiles[oldPath];
        newFiles[newPath] = { path: newPath, content: target.content, isFolder: false };
      }

      // Re-map active tabs and draft buffers!
      let activeFile = currentProj.activeFile;
      if (activeFile === oldPath) activeFile = newPath;
      else if (activeFile && activeFile.startsWith(oldPath + '/')) {
        activeFile = `${newPath}/${activeFile.substring(oldPath.length + 1)}`;
      }

      const openTabs = currentProj.openTabs.map((t) => {
        if (t === oldPath) return newPath;
        if (t.startsWith(oldPath + '/')) {
          return `${newPath}/${t.substring(oldPath.length + 1)}`;
        }
        return t;
      });

      // Update intermediate drafts
      const draftVal = state.unsavedDrafts[oldPath];
      const newDrafts = { ...state.unsavedDrafts };
      if (draftVal !== undefined) {
        delete newDrafts[oldPath];
        newDrafts[newPath] = draftVal;
      }

      const updatedProj: Project = {
        ...currentProj,
        files: newFiles,
        openTabs,
        activeFile,
        lastEdited: new Date().toLocaleString(),
        historyLogs: [
          ...currentProj.historyLogs,
          {
            id: 'rename_file_' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            action: 'rename',
            message: `Renamed "${oldPath}" to "${newPath}"`
          }
        ]
      };

      const updated = {
        ...state,
        projects: { ...state.projects, [projectId]: updatedProj },
        unsavedDrafts: newDrafts
      };
      saveStateToLocalStorage(updated);
      return updated;
    });

    return true;
  },

  deleteFileOrFolder: (projectId, path) => {
    set((state) => {
      const currentProj = state.projects[projectId];
      if (!currentProj) return {};

      const target = currentProj.files[path];
      if (!target) return {};

      const isFolder = target.isFolder;
      const newFiles = { ...currentProj.files };
      const recycleBin = [...currentProj.recycleBin];
      const logs = [...currentProj.historyLogs];

      const deletedItems: RecycleBinItem[] = [];

      if (isFolder) {
        // Find children files to delete together and place in a single group trash item or separate
        Object.keys(newFiles).forEach((p) => {
          if (p === path || p.startsWith(path + '/')) {
            const item = newFiles[p];
            deletedItems.push({
              id: 'item_' + Math.random().toString(36).substring(2, 9),
              name: item.path.split('/').pop() || item.path,
              type: item.isFolder ? 'folder' : 'file',
              originalPath: item.path,
              content: item.content,
              isFolder: item.isFolder,
              timestamp: new Date().toLocaleTimeString()
            });
            delete newFiles[p];
          }
        });
      } else {
        // Single file delete
        deletedItems.push({
          id: 'item_' + Math.random().toString(36).substring(2, 9),
          name: target.path.split('/').pop() || target.path,
          type: 'file',
          originalPath: target.path,
          content: target.content,
          isFolder: false,
          timestamp: new Date().toLocaleTimeString()
        });
        delete newFiles[path];
      }

      // Close respective open tabs
      const openTabs = currentProj.openTabs.filter((t) => {
        if (t === path) return false;
        if (isFolder && t.startsWith(path + '/')) return false;
        return true;
      });

      let activeFile = currentProj.activeFile;
      if (activeFile && (activeFile === path || (isFolder && activeFile.startsWith(path + '/')))) {
        activeFile = openTabs.length > 0 ? openTabs[0] : null;
      }

      // Push logs
      deletedItems.forEach((d) => {
        logs.push({
          id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
          timestamp: new Date().toLocaleTimeString(),
          action: 'delete',
          message: `${d.name} deleted from ${d.originalPath?.substring(0, d.originalPath.lastIndexOf('/')) || 'root'} at ${new Date().toLocaleTimeString()}`
        });
      });

      const updatedProj: Project = {
        ...currentProj,
        files: newFiles,
        openTabs,
        activeFile,
        recycleBin: [...recycleBin, ...deletedItems],
        historyLogs: logs,
        lastEdited: new Date().toLocaleString()
      };

      const updated = {
        ...state,
        projects: { ...state.projects, [projectId]: updatedProj }
      };
      saveStateToLocalStorage(updated);
      return updated;
    });
  },

  restoreFileOrFolder: (projectId, itemId) => {
    set((state) => {
      const currentProj = state.projects[projectId];
      if (!currentProj) return {};

      const foundIdx = currentProj.recycleBin.findIndex((item) => item.id === itemId);
      if (foundIdx === -1) return {};

      const trashItem = currentProj.recycleBin[foundIdx];
      const newFiles = { ...currentProj.files };
      const originalPath = trashItem.originalPath!;

      // Insert back to active project map
      newFiles[originalPath] = {
        path: originalPath,
        content: trashItem.content || '',
        isFolder: !!trashItem.isFolder
      };

      const updatedRecycle = currentProj.recycleBin.filter((item) => item.id !== itemId);
      
      const newHistory: HistoryLog[] = [
        ...currentProj.historyLogs,
        {
          id: 'restore_' + Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          action: 'restore',
          message: `${trashItem.name} restored back to original nested path: ${originalPath}`
        }
      ];

      const updatedProj: Project = {
        ...currentProj,
        files: newFiles,
        recycleBin: updatedRecycle,
        historyLogs: newHistory,
        lastEdited: new Date().toLocaleString()
      };

      const updated = {
        ...state,
        projects: { ...state.projects, [projectId]: updatedProj }
      };
      saveStateToLocalStorage(updated);
      return updated;
    });
  },

  deletePermanently: (projectId, itemId) => {
    set((state) => {
      const currentProj = state.projects[projectId];
      if (!currentProj) return {};

      const found = currentProj.recycleBin.find((item) => item.id === itemId);
      const updatedRecycle = currentProj.recycleBin.filter((item) => item.id !== itemId);

      const newHistory: HistoryLog[] = [
        ...currentProj.historyLogs
      ];
      if (found) {
        newHistory.push({
          id: 'perm_' + Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          action: 'perm_delete',
          message: `${found.name} permanently deleted from database`
        });
      }

      const updatedProj: Project = {
        ...currentProj,
        recycleBin: updatedRecycle,
        historyLogs: newHistory,
        lastEdited: new Date().toLocaleString()
      };

      const updated = {
        ...state,
        projects: { ...state.projects, [projectId]: updatedProj }
      };
      saveStateToLocalStorage(updated);
      return updated;
    });
  },

  // Edit actions
  updateFileContent: (projectId, path, content) => {
    // Stage inside local drafts so we can hold a dirty "unsaved state Indicator"
    set((state) => {
      const newDrafts = { ...state.unsavedDrafts, [path]: content };
      return { unsavedDrafts: newDrafts };
    });
  },

  saveChanges: (projectId) => {
    const drafts = get().unsavedDrafts;
    if (Object.keys(drafts).length === 0) return; // Nothing to save

    set((state) => {
      const currentProj = state.projects[projectId];
      if (!currentProj) return {};

      const newFiles = { ...currentProj.files };
      Object.entries(state.unsavedDrafts).forEach(([path, content]) => {
        if (newFiles[path]) {
          newFiles[path] = { ...newFiles[path], content };
        }
      });

      const updatedProj: Project = {
        ...currentProj,
        files: newFiles,
        lastEdited: new Date().toLocaleString(),
        historyLogs: [
          ...currentProj.historyLogs,
          {
            id: 'save_' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            action: 'save',
            message: `Workspace modified files saved (${Object.keys(state.unsavedDrafts).length} item/s)`
          }
        ]
      };

      const updated = {
        ...state,
        projects: { ...state.projects, [projectId]: updatedProj },
        unsavedDrafts: {} // Reset buffer draft map
      };
      saveStateToLocalStorage(updated);
      return updated;
    });
  },

  openTab: (projectId, path) => {
    set((state) => {
      const currentProj = state.projects[projectId];
      if (!currentProj) return {};

      const openTabs = currentProj.openTabs.includes(path)
        ? currentProj.openTabs
        : [...currentProj.openTabs, path];

      const updatedProj: Project = {
        ...currentProj,
        openTabs,
        activeFile: path
      };

      const updated = {
        ...state,
        projects: { ...state.projects, [projectId]: updatedProj }
      };
      saveStateToLocalStorage(updated);
      return updated;
    });
  },

  closeTab: (projectId, path) => {
    set((state) => {
      const currentProj = state.projects[projectId];
      if (!currentProj) return {};

      const openTabs = currentProj.openTabs.filter((t) => t !== path);
      let activeFile = currentProj.activeFile;
      if (activeFile === path) {
        activeFile = openTabs.length > 0 ? openTabs[openTabs.length - 1] : null;
      }

      // Also scrub unsaved draft buffer if tab is closed and changes aren't auto-saved? 
      // It is better to preserve drafts in memory even if tab is closed to prevent loss of code, 
      // which is exactly what VS Code does! We keep drafts in unsavedDrafts.

      const updatedProj: Project = {
        ...currentProj,
        openTabs,
        activeFile
      };

      const updated = {
        ...state,
        projects: { ...state.projects, [projectId]: updatedProj }
      };
      saveStateToLocalStorage(updated);
      return updated;
    });
  },

  setUnsavedDraft: (projectId, path, content) => {
    set((state) => {
      const newDrafts = { ...state.unsavedDrafts };
      if (content === null) {
        delete newDrafts[path];
      } else {
        newDrafts[path] = content;
      }
      return { unsavedDrafts: newDrafts };
    });
  },

  // Package Installer
  installPackage: (projectId, packageName) => {
    set((state) => {
      const currentProj = state.projects[projectId];
      if (!currentProj) return {};
      if (currentProj.installedPackages.includes(packageName)) return {};

      const installedPackages = [...currentProj.installedPackages, packageName];
      
      // Update virtual app package.json dependency values
      const newFiles = { ...currentProj.files };
      const pkgFile = newFiles['package.json'];
      if (pkgFile) {
        try {
          const parsed = JSON.parse(pkgFile.content);
          parsed.dependencies = parsed.dependencies || {};
          parsed.dependencies[packageName] = "latest";
          pkgFile.content = JSON.stringify(parsed, null, 2);
        } catch (err) {
          console.error(err);
        }
      }

      const updatedProj: Project = {
        ...currentProj,
        installedPackages,
        files: newFiles,
        lastEdited: new Date().toLocaleString(),
        historyLogs: [
          ...currentProj.historyLogs,
          {
            id: 'pkg_' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            action: 'pkg_install',
            message: `Installed npm package "${packageName}"`
          }
        ]
      };

      const updated = {
        ...state,
        projects: { ...state.projects, [projectId]: updatedProj }
      };
      saveStateToLocalStorage(updated);
      return updated;
    });
  },

  uninstallPackage: (projectId, packageName) => {
    set((state) => {
      const currentProj = state.projects[projectId];
      if (!currentProj) return {};

      const installedPackages = currentProj.installedPackages.filter((p) => p !== packageName);
      
      const newFiles = { ...currentProj.files };
      const pkgFile = newFiles['package.json'];
      if (pkgFile) {
        try {
          const parsed = JSON.parse(pkgFile.content);
          if (parsed.dependencies) {
            delete parsed.dependencies[packageName];
          }
          pkgFile.content = JSON.stringify(parsed, null, 2);
        } catch (err) {
          console.error(err);
        }
      }

      const updatedProj: Project = {
        ...currentProj,
        installedPackages,
        files: newFiles,
        lastEdited: new Date().toLocaleString(),
        historyLogs: [
          ...currentProj.historyLogs,
          {
            id: 'unpkg_' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            action: 'pkg_uninstall',
            message: `Uninstalled npm package "${packageName}"`
          }
        ]
      };

      const updated = {
        ...state,
        projects: { ...state.projects, [projectId]: updatedProj }
      };
      saveStateToLocalStorage(updated);
      return updated;
    });
  },

  // Extensions
  installExtension: (projectId, extensionId) => {
    set((state) => {
      const currentProj = state.projects[projectId];
      if (!currentProj) return {};
      if (currentProj.installedExtensions.includes(extensionId)) return {};

      const installedExtensions = [...currentProj.installedExtensions, extensionId];
      const updatedProj: Project = {
        ...currentProj,
        installedExtensions,
        lastEdited: new Date().toLocaleString(),
        historyLogs: [
          ...currentProj.historyLogs,
          {
            id: 'ext_' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            action: 'ext_install',
            message: `Installed DX Extension helper: "${extensionId}"`
          }
        ]
      };

      const updated = {
        ...state,
        projects: { ...state.projects, [projectId]: updatedProj }
      };
      saveStateToLocalStorage(updated);
      return updated;
    });
  },

  uninstallExtension: (projectId, extensionId) => {
    set((state) => {
      const currentProj = state.projects[projectId];
      if (!currentProj) return {};

      const installedExtensions = currentProj.installedExtensions.filter((e) => e !== extensionId);
      const updatedProj: Project = {
        ...currentProj,
        installedExtensions,
        lastEdited: new Date().toLocaleString(),
        historyLogs: [
          ...currentProj.historyLogs,
          {
            id: 'unext_' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            action: 'ext_uninstall',
            message: `Uninstalled DX Extension helper: "${extensionId}"`
          }
        ]
      };

      const updated = {
        ...state,
        projects: { ...state.projects, [projectId]: updatedProj }
      };
      saveStateToLocalStorage(updated);
      return updated;
    });
  },

  // Terminal actions
  addTerminalLog: (log) => {
    const id = 'log_' + Math.random().toString(36).substring(2, 9);
    const newLogItem: TerminalLog = {
      ...log,
      id,
      timestamp: new Date().toLocaleTimeString()
    };
    set((state) => {
      const logs = [...state.terminalLogs, newLogItem].slice(-200); // Limit to last 200 logs
      const updated = {
        ...state,
        terminalLogs: logs
      };
      saveStateToLocalStorage(updated);
      return updated;
    });
  },

  executeTerminalCommand: (commandStr) => {
    const currentCmd = commandStr.trim();
    if (!currentCmd) return;

    // Log the input
    get().addTerminalLog({ type: 'input', content: `${get().terminalCwd} $ ${currentCmd}` });

    // Append to running command history list
    set((state) => {
      const hist = [...state.terminalCommandHistory, currentCmd].slice(-40);
      return { terminalCommandHistory: hist };
    });

    const words = currentCmd.split(/\s+/);
    const cmd = words[0].toLowerCase();
    const args = words.slice(1);

    const activeProjId = get().activeProjectId;

    if (cmd === 'help') {
      get().addTerminalLog({
        type: 'output',
        content: `Available shell runtime commands:
- npm install <pkg>       Install custom npm dependency
- npm uninstall <pkg>     Uninstall custom npm dependency
- npm run dev             Execute and boot dynamic compilation live preview sandbox
- clear                   Clear active screen terminal logs
- ls                      List files & directory structures inside current CWD
- pwd                     Show absolute path location inside virtual workspace
- mkdir <dir_name>        Create a nested directory
- touch <file_name>       Create a file at CWD path`
      });
      return;
    }

    if (cmd === 'clear') {
      get().clearTerminal();
      return;
    }

    // Checking Workspace scope commands
    if (cmd === 'pwd') {
      get().addTerminalLog({ type: 'output', content: `/workspace/${activeProjId ? activeProjId : 'root'}/${get().terminalCwd}` });
      return;
    }

    if (cmd === 'ls') {
      if (!activeProjId) {
        get().addTerminalLog({ type: 'error', content: 'No open projects found. Please open/create a project first.' });
        return;
      }
      const proj = get().projects[activeProjId];
      if (!proj) return;

      const items = Object.keys(proj.files);
      if (items.length === 0) {
        get().addTerminalLog({ type: 'output', content: '(empty workspace directory)' });
      } else {
        const sorted = items.sort();
        const display = sorted.map((p) => {
          const isF = proj.files[p].isFolder;
          return isF ? `📁 ${p}/` : `📄 ${p}`;
        }).join('\n');
        get().addTerminalLog({ type: 'output', content: display });
      }
      return;
    }

    if (cmd === 'mkdir') {
      if (!activeProjId) {
        get().addTerminalLog({ type: 'error', content: 'ls/mkdir error: Must open an active workspace first!' });
        return;
      }
      if (!args[0]) {
        get().addTerminalLog({ type: 'error', content: 'mkdir error: directory name argument required' });
        return;
      }
      const dirPath = args[0];
      const success = get().createFolder(activeProjId, dirPath);
      if (success) {
        get().addTerminalLog({ type: 'success', content: `Created directory "${dirPath}" successfully` });
      } else {
        get().addTerminalLog({ type: 'error', content: `mkdir: failed to create directory "${dirPath}" (path conflict)` });
      }
      return;
    }

    if (cmd === 'touch') {
      if (!activeProjId) {
        get().addTerminalLog({ type: 'error', content: 'No active project running.' });
        return;
      }
      if (!args[0]) {
        get().addTerminalLog({ type: 'error', content: 'touch error: fileName required' });
        return;
      }
      const fPath = args[0];
      const success = get().createFile(activeProjId, fPath, '// new empty file');
      if (success) {
        get().addTerminalLog({ type: 'success', content: `File "${fPath}" created successfully` });
      } else {
        get().addTerminalLog({ type: 'error', content: `touch: path conflict or invalid permissions: "${fPath}"` });
      }
      return;
    }

    if (cmd === 'npm') {
      if (!activeProjId) {
        get().addTerminalLog({ type: 'error', content: 'npm tasks failed: No active workspace opened' });
        return;
      }
      const action = args[0];
      if (action === 'install') {
        const pkg_name = args[1];
        if (!pkg_name) {
          get().addTerminalLog({ type: 'output', content: 'npm WARN: running bare npm install to audit node_modules... Success' });
          return;
        }
        get().addTerminalLog({ type: 'system', content: `Resolving dependency tree from CDN registry for "${pkg_name}"...` });
        setTimeout(() => {
          get().installPackage(activeProjId, pkg_name);
          get().addTerminalLog({ type: 'success', content: `+ ${pkg_name}@latest nested dependency download complete. Saved to package.json dependencies list.` });
        }, 800);
      } else if (action === 'uninstall') {
        const pkg_name = args[1];
        if (!pkg_name) {
          get().addTerminalLog({ type: 'error', content: 'npm error: Specify package name to remove' });
          return;
        }
        get().addTerminalLog({ type: 'system', content: `Removing dynamic references for "${pkg_name}"...` });
        setTimeout(() => {
          get().uninstallPackage(activeProjId, pkg_name);
          get().addTerminalLog({ type: 'success', content: `Removed package references successfully. Workspace refreshed.` });
        }, 500);
      } else if (action === 'run') {
        const script = args[1];
        if (script === 'dev') {
          get().addTerminalLog({ type: 'system', content: `Starting development asset bundler server on post 3000...` });
          get().addTerminalLog({ type: 'success', content: `Vite v5.2 Ready inside sandbox iframe. Transpilation hot reload active.` });
          // Force a compilation frame trigger
          const triggerCode = document.getElementById('sandbox-compile-btn');
          if (triggerCode) triggerCode.click();
        } else {
          get().addTerminalLog({ type: 'error', content: `No npm script found called: "${script}". Please check package.json.` });
        }
      } else {
        get().addTerminalLog({ type: 'error', content: 'npm ERR: Unknown Action command. Supports: install, uninstall, run' });
      }
      return;
    }

    // Default error command message
    get().addTerminalLog({ type: 'error', content: `shell command not found: "${cmd}". Type "help" to learn about workspace core commands.` });
  },

  clearTerminal: () => {
    set({ terminalLogs: [] });
    saveStateToLocalStorage({
      ...get(),
      terminalLogs: []
    });
  },

  // Dimensions
  setSidebarWidth: (width) => {
    const val = Math.max(160, Math.min(width, 480));
    set({ sidebarWidth: val });
    saveStateToLocalStorage({
      ...get(),
      sidebarWidth: val
    });
  },

  setEditorWidth: (width) => {
    const val = Math.max(15, Math.min(width, 85));
    set({ editorWidth: val });
    saveStateToLocalStorage({
      ...get(),
      editorWidth: val
    });
  },

  setTerminalHeight: (height) => {
    const val = Math.max(80, Math.min(height, 600));
    set({ terminalHeight: val });
    saveStateToLocalStorage({
      ...get(),
      terminalHeight: val
    });
  }

}));
