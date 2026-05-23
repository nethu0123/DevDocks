import { create } from 'zustand';
import { Project, FileNode, RecycleBinItem, HistoryLog, TerminalLog, TerminalSession, SidebarPanel, AppState, AuthUser } from './types';

type AuthRecord = AuthUser & {
  passwordHash: string;
};

interface AppStore extends AppState {
  // Authentication actions
  signUp: (name: string, email: string, password: string) => { ok: boolean; message?: string };
  signIn: (email: string, password: string) => { ok: boolean; message?: string };
  signOut: () => void;

  // Navigation actions
  setCurrentView: (view: 'landing' | 'dashboard' | 'ide') => void;
  setActiveProject: (projectId: string | null) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setSidebarPanel: (panel: SidebarPanel) => void;
  setTerminalOpen: (open: boolean) => void;
  setPreviewOpen: (open: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  
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
  installPackage: (projectId: string, packageName: string, version?: string) => void;
  uninstallPackage: (projectId: string, packageName: string) => void;
  installExtension: (projectId: string, extensionId: string) => void;
  uninstallExtension: (projectId: string, extensionId: string) => void;
  
  // Terminal actions
  addTerminalLog: (log: Omit<TerminalLog, 'id' | 'timestamp'>) => void;
  executeTerminalCommand: (commandStr: string) => void;
  clearTerminal: () => void;
  createTerminalSession: () => string;
  closeTerminalSession: (sessionId: string) => void;
  setActiveTerminalSession: (sessionId: string) => void;
  
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
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-purple-400 to-purple-600 flex items-center justify-center text-slate-950 font-bold shadow-lg">
            ${hasLucide ? '<Flame className="h-6 w-6 text-slate-950" />' : 'DD'}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent">
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
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
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
              <span className="w-10 text-center font-mono text-lg text-purple-400 font-semibold bg-slate-950/80 py-1 rounded">
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
          <div className="flex items-center gap-1.5 text-purple-400/80">
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

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}`;

  files[`src/main.${mainExt}`] = {
    path: `src/main.${mainExt}`,
    isFolder: false,
    content: mainCode
  };

  return files;
}

// Load initial state from local storage securely
const STORAGE_KEY = 'devdocks_workspace_state_v1';
const AUTH_STORAGE_KEY = 'devdocks_auth_users_v1';
const DEFAULT_TERMINAL_SESSION: TerminalSession = {
  id: 'terminal_1',
  name: 'powershell',
  cwd: 'root',
  createdAt: new Date().toLocaleTimeString()
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const hashPassword = (password: string) => {
  try {
    return btoa(unescape(encodeURIComponent(`devdocks:${password}`)));
  } catch {
    return password;
  }
};

const loadAuthRecords = (): Record<string, AuthRecord> => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveAuthRecords = (records: Record<string, AuthRecord>) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(records));
};

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
        currentUser: parsed.currentUser || null,
        projects: parsed.projects || {},
        activeProjectId: parsed.activeProjectId || null,
        currentView: parsed.currentView || 'landing',
        theme: 'dark',
        sidebarPanel: parsed.sidebarPanel || 'explorer',
        terminalOpen: parsed.terminalOpen !== undefined ? parsed.terminalOpen : false,
        previewOpen: parsed.previewOpen !== undefined ? parsed.previewOpen : true,
        autoSave: parsed.autoSave !== undefined ? parsed.autoSave : false,
        terminalLogs: (parsed.terminalLogs || []).filter((log: TerminalLog) => {
          const content = log?.content || '';
          return !content.includes("Cannot read properties of undefined (reading 'transform')")
            && !content.includes('npm ERR: Unknown Action command. Supports: install, uninstall, run');
        }),
        terminalSessions: parsed.terminalSessions?.length ? parsed.terminalSessions : [DEFAULT_TERMINAL_SESSION],
        activeTerminalSessionId: parsed.activeTerminalSessionId || parsed.terminalSessions?.[0]?.id || DEFAULT_TERMINAL_SESSION.id,
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

const projectBelongsToUser = (project: Project | undefined, user: AuthUser | null) => {
  if (!project || !user) return false;
  return project.ownerId === user.id && project.ownerEmail === user.email;
};

const saveStateToLocalStorage = (state: Partial<AppState> & { unsavedDrafts?: Record<string, string> }) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to persist state:', e);
  }
};

export const useStore = create<AppStore>((set, get) => ({
  // Core default status
  currentUser: null,
  projects: {},
  activeProjectId: null,
  currentView: 'landing',
  theme: 'dark',
  sidebarPanel: 'explorer',
  terminalOpen: false,
  previewOpen: true,
  autoSave: false,
  terminalSessions: [DEFAULT_TERMINAL_SESSION],
  activeTerminalSessionId: DEFAULT_TERMINAL_SESSION.id,
  terminalLogs: [
    {
      id: 'welcome',
      type: 'system',
      content: 'DevDocks OS/Runtime v1.0.0. Type "help" or select terminal icons.',
      timestamp: new Date().toLocaleTimeString(),
      sessionId: DEFAULT_TERMINAL_SESSION.id
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

  // Authentication handlers
  signUp: (name, email, password) => {
    const cleanName = name.trim();
    const cleanEmail = normalizeEmail(email);

    if (!cleanName) return { ok: false, message: 'Please enter your name.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false, message: 'Please enter a valid email address.' };
    if (password.length < 6) return { ok: false, message: 'Password must be at least 6 characters.' };

    const records = loadAuthRecords();
    if (records[cleanEmail]) return { ok: false, message: 'An account already exists for this email. Please log in.' };

    const user: AuthUser = {
      id: 'user_' + Math.random().toString(36).substring(2, 11),
      name: cleanName,
      email: cleanEmail,
      createdAt: new Date().toLocaleString()
    };

    records[cleanEmail] = { ...user, passwordHash: hashPassword(password) };
    saveAuthRecords(records);
    set({ currentUser: user, activeProjectId: null, currentView: 'landing', unsavedDrafts: {}, theme: 'dark' });
    saveStateToLocalStorage({ ...get(), currentUser: user, activeProjectId: null, currentView: 'landing', unsavedDrafts: {}, theme: 'dark' });
    return { ok: true };
  },

  signIn: (email, password) => {
    const cleanEmail = normalizeEmail(email);
    const records = loadAuthRecords();
    const found = records[cleanEmail];

    if (!found || found.passwordHash !== hashPassword(password)) {
      return { ok: false, message: 'Email or password is incorrect. Please check and try again.' };
    }

    const user: AuthUser = {
      id: found.id,
      name: found.name,
      email: found.email,
      createdAt: found.createdAt
    };

    set({ currentUser: user, activeProjectId: null, currentView: 'landing', unsavedDrafts: {}, theme: 'dark' });
    saveStateToLocalStorage({ ...get(), currentUser: user, activeProjectId: null, currentView: 'landing', unsavedDrafts: {}, theme: 'dark' });
    return { ok: true };
  },

  signOut: () => {
    set({ currentUser: null, activeProjectId: null, currentView: 'landing', theme: 'dark' });
    saveStateToLocalStorage({ ...get(), currentUser: null, activeProjectId: null, currentView: 'landing', theme: 'dark' });
  },

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
    if (projectId && !projectBelongsToUser(get().projects[projectId], get().currentUser)) {
      set({ activeProjectId: null, currentView: 'dashboard', unsavedDrafts: {} });
      saveStateToLocalStorage({
        ...get(),
        activeProjectId: null,
        currentView: 'dashboard',
        unsavedDrafts: {}
      });
      return;
    }

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

  setTheme: () => {
    set({ theme: 'dark' });
    // DevDocks is dark-only. Keep old persisted light settings from resurfacing.
    const root = document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');
    saveStateToLocalStorage({
      ...get(),
      theme: 'dark'
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

  setPreviewOpen: (open) => {
    set({ previewOpen: open });
    saveStateToLocalStorage({
      ...get(),
      previewOpen: open
    });
  },

  setAutoSave: (enabled) => {
    set({ autoSave: enabled });
    saveStateToLocalStorage({
      ...get(),
      autoSave: enabled
    });
  },

  // Projects CRUD
  createProject: (name, description, techStack) => {
    const ownerId = get().currentUser?.id;
    const ownerEmail = get().currentUser?.email;
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

    const starterExtensions: string[] = ['React Snippets'];
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
      ownerId,
      ownerEmail,
      name,
      description,
      techStack,
      files: starterFiles,
      openTabs: [techStack.includes('TypeScript') ? 'src/App.tsx' : 'src/App.jsx'],
      activeFile: techStack.includes('TypeScript') ? 'src/App.tsx' : 'src/App.jsx',
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
      if (!projectBelongsToUser(proj, state.currentUser)) return {};
      
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
      if (!projectBelongsToUser(proj, state.currentUser)) return {};

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
        if (!projectBelongsToUser(projData, get().currentUser)) return;
        
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
    if (!projectBelongsToUser(proj, get().currentUser)) return false;
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
    if (!projectBelongsToUser(proj, get().currentUser)) return false;
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
    if (!projectBelongsToUser(proj, get().currentUser)) return false;
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
      if (!projectBelongsToUser(currentProj, state.currentUser)) return {};

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
      if (!projectBelongsToUser(currentProj, state.currentUser)) return {};

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
      if (!projectBelongsToUser(currentProj, state.currentUser)) return {};

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
      if (!projectBelongsToUser(currentProj, state.currentUser)) return {};

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
      if (!projectBelongsToUser(currentProj, state.currentUser)) return {};

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
      if (!projectBelongsToUser(currentProj, state.currentUser)) return {};

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
  installPackage: (projectId, packageName, version = 'latest') => {
    set((state) => {
      const currentProj = state.projects[projectId];
      if (!projectBelongsToUser(currentProj, state.currentUser)) return {};
      const cleanPackageName = packageName.trim();
      if (!cleanPackageName || currentProj.installedPackages.includes(cleanPackageName)) return {};

      const installedPackages = [...currentProj.installedPackages, cleanPackageName];
      
      // Update virtual app package.json dependency values
      const newFiles = { ...currentProj.files };
      const pkgFile = newFiles['package.json'];
      if (pkgFile) {
        try {
          const parsed = JSON.parse(pkgFile.content);
          parsed.dependencies = parsed.dependencies || {};
          parsed.dependencies[cleanPackageName] = version;
          newFiles['package.json'] = { ...pkgFile, content: JSON.stringify(parsed, null, 2) };
        } catch (err) {
          console.error(err);
        }
      }
      newFiles['.devdocks'] = newFiles['.devdocks'] || { path: '.devdocks', content: '', isFolder: true };
      newFiles['.devdocks/packages.json'] = {
        path: '.devdocks/packages.json',
        isFolder: false,
        content: JSON.stringify({ installedPackages }, null, 2)
      };

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
            message: `Installed npm package "${cleanPackageName}@${version}"`
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
      if (!projectBelongsToUser(currentProj, state.currentUser)) return {};

      const installedPackages = currentProj.installedPackages.filter((p) => p !== packageName);
      
      const newFiles = { ...currentProj.files };
      const pkgFile = newFiles['package.json'];
      if (pkgFile) {
        try {
          const parsed = JSON.parse(pkgFile.content);
          if (parsed.dependencies) {
            delete parsed.dependencies[packageName];
          }
          newFiles['package.json'] = { ...pkgFile, content: JSON.stringify(parsed, null, 2) };
        } catch (err) {
          console.error(err);
        }
      }
      if (newFiles['.devdocks/packages.json']) {
        newFiles['.devdocks/packages.json'] = {
          ...newFiles['.devdocks/packages.json'],
          content: JSON.stringify({ installedPackages }, null, 2)
        };
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
      if (!projectBelongsToUser(currentProj, state.currentUser)) return {};
      if (currentProj.installedExtensions.includes(extensionId)) return {};

      const installedExtensions = [...currentProj.installedExtensions, extensionId];
      const newFiles = { ...currentProj.files };
      newFiles['.devdocks'] = newFiles['.devdocks'] || { path: '.devdocks', content: '', isFolder: true };
      newFiles['.devdocks/extensions.json'] = {
        path: '.devdocks/extensions.json',
        isFolder: false,
        content: JSON.stringify({ activeExtensions: installedExtensions }, null, 2)
      };
      const updatedProj: Project = {
        ...currentProj,
        installedExtensions,
        files: newFiles,
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
      if (!projectBelongsToUser(currentProj, state.currentUser)) return {};

      const installedExtensions = currentProj.installedExtensions.filter((e) => e !== extensionId);
      const newFiles = { ...currentProj.files };
      if (newFiles['.devdocks/extensions.json']) {
        newFiles['.devdocks/extensions.json'] = {
          ...newFiles['.devdocks/extensions.json'],
          content: JSON.stringify({ activeExtensions: installedExtensions }, null, 2)
        };
      }
      const updatedProj: Project = {
        ...currentProj,
        installedExtensions,
        files: newFiles,
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
    if (log.content.includes("Cannot read properties of undefined (reading 'transform')")) {
      log = {
        ...log,
        content: 'Preview compiler issue: the TypeScript transformer was not available. Refresh the workspace and run again. If this began after installing a package, remove that package and retry.'
      };
    }

    const id = 'log_' + Math.random().toString(36).substring(2, 9);
    const sessionId = log.sessionId || get().activeTerminalSessionId || DEFAULT_TERMINAL_SESSION.id;
    const newLogItem: TerminalLog = {
      ...log,
      id,
      sessionId,
      timestamp: new Date().toLocaleTimeString()
    };
    set((state) => {
      const lastLog = state.terminalLogs[state.terminalLogs.length - 1];
      if (lastLog && lastLog.type === newLogItem.type && lastLog.content === newLogItem.content) {
        return {};
      }

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

    if (currentCmd.includes('&&')) {
      currentCmd.split('&&').map((part) => part.trim()).filter(Boolean).forEach((segment) => {
        get().executeTerminalCommand(segment);
      });
      return;
    }

    // Log the input
    const activeProjId = get().activeProjectId;
    const activeProjectName = activeProjId ? get().projects[activeProjId]?.name || activeProjId : 'root';
    get().addTerminalLog({ type: 'input', content: `PS /workspace/${activeProjectName}/${get().terminalCwd === 'root' ? '' : get().terminalCwd} > ${currentCmd}` });

    // Append to running command history list
    set((state) => {
      const hist = [...state.terminalCommandHistory, currentCmd].slice(-40);
      return { terminalCommandHistory: hist };
    });

    const parseArgs = (input: string) => {
      const matches = input.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g);
      return Array.from(matches, (match) => match[1] ?? match[2] ?? match[3]);
    };

    const words = parseArgs(currentCmd);
    const rawCmd = words[0] || '';
    const aliasMap: Record<string, string> = {
      gci: 'ls',
      'get-childitem': 'ls',
      sl: 'cd',
      'set-location': 'cd',
      gc: 'cat',
      'get-content': 'cat',
      md: 'mkdir',
      ni: 'new-item',
      ri: 'rm',
      'remove-item': 'rm',
      cp: 'copy',
      'copy-item': 'copy',
      mv: 'move',
      'move-item': 'move',
      ren: 'rename',
      'rename-item': 'rename',
      sc: 'set-content',
      ac: 'add-content'
    };
    const cmd = aliasMap[rawCmd.toLowerCase()] || rawCmd.toLowerCase();
    const args = words.slice(1);

    const resolveVirtualPath = (rawPath = '') => {
      const cwd = get().terminalCwd === 'root' ? '' : get().terminalCwd;
      const source = rawPath.startsWith('/') ? rawPath.slice(1) : [cwd, rawPath].filter(Boolean).join('/');
      const parts: string[] = [];
      source.split('/').filter(Boolean).forEach((part) => {
        if (part === '.') return;
        if (part === '..') parts.pop();
        else parts.push(part);
      });
      return parts.join('/');
    };

    const ensureParentFolders = (projectId: string, path: string) => {
      const parts = path.split('/').filter(Boolean);
      parts.pop();
      let running = '';
      parts.forEach((part) => {
        running = running ? `${running}/${part}` : part;
        if (!get().projects[projectId]?.files[running]) {
          get().createFolder(projectId, running);
        }
      });
    };

    const writeVirtualFile = (projectId: string, path: string, content: string, append = false) => {
      ensureParentFolders(projectId, path);
      const existing = get().projects[projectId]?.files[path];
      if (!existing) {
        get().createFile(projectId, path, content);
        return true;
      }
      if (existing.isFolder) return false;

      set((state) => {
        const currentProj = state.projects[projectId];
        if (!currentProj) return {};
        const previous = currentProj.files[path]?.content || '';
        const newFiles = {
          ...currentProj.files,
          [path]: {
            ...currentProj.files[path],
            content: append ? `${previous}${previous ? '\n' : ''}${content}` : content
          }
        };
        const updatedProj: Project = {
          ...currentProj,
          files: newFiles,
          lastEdited: new Date().toLocaleString(),
          historyLogs: [
            ...currentProj.historyLogs,
            {
              id: 'terminal_write_' + Date.now(),
              timestamp: new Date().toLocaleTimeString(),
              action: 'save',
              message: `Terminal ${append ? 'appended to' : 'wrote'} "${path}"`
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
    };

    const versions = {
      node: 'v22.15.0',
      npm: '10.9.2',
      npx: '10.9.2',
      yarn: '1.22.22',
      pnpm: '9.15.4',
      git: '2.45.0'
    };

    const printVersion = (name: keyof typeof versions) => {
      get().addTerminalLog({ type: 'output', content: versions[name] });
    };

    if (cmd === 'help') {
      get().addTerminalLog({
        type: 'output',
        content: `Available shell runtime commands:
- npm install <pkg>       Install custom npm dependency
- npm -v / --version      Show npm version
- npm uninstall <pkg>     Uninstall custom npm dependency
- npm run dev             Execute and boot dynamic compilation live preview sandbox
- node -v                 Show Node.js version
- git status              Show virtual repository status
- yarn/pnpm <command>     Package-manager aliases for common npm commands
- clear                   Clear active screen terminal logs
- cls                     Clear active screen terminal logs
- ls                      List files & directory structures inside current CWD
- dir                     List files & directory structures inside current CWD
- cd <dir>                Change virtual working directory
- tree                    Print nested workspace tree
- cat/type <file>         Print file contents
- code <file>             Open a file in the editor
- copy/cp <src> <dest>    Copy a file or folder
- move/mv <src> <dest>    Move or rename a file or folder
- rename/ren <old> <new>  Rename a file or folder
- rm/del <path>           Move a file or folder to Recycle Bin
- set-content <file> txt  Replace file contents
- add-content <file> txt  Append file contents
- echo txt > file         Write text to a file
- echo txt >> file        Append text to a file
- echo <text>             Print text
- history                 Show command history
- npm list                Show installed dependencies
- npm view <pkg>          Show local registry metadata
- pwd                     Show absolute path location inside virtual workspace
- mkdir <dir_name>        Create a nested directory
- touch <file_name>       Create a file at CWD path`
      });
      return;
    }

    if (cmd === 'node') {
      if (args[0] === '-v' || args[0] === '--version') {
        printVersion('node');
      } else if (args[0] === '-e') {
        get().addTerminalLog({ type: 'output', content: '(node -e) evaluated inside DevDocks virtual runtime.' });
      } else {
        get().addTerminalLog({ type: 'output', content: 'Node.js virtual runtime. Try: node -v' });
      }
      return;
    }

    if (cmd === 'npx') {
      if (args[0] === '-v' || args[0] === '--version') {
        printVersion('npx');
      } else if (args[0]) {
        get().addTerminalLog({ type: 'system', content: `npx ${args.join(' ')} resolved in the virtual workspace.` });
      } else {
        get().addTerminalLog({ type: 'output', content: 'npx virtual runner. Try: npx vite --version' });
      }
      return;
    }

    if (cmd === 'git') {
      const action = args[0];
      if (action === '-v' || action === '--version' || action === 'version') {
        printVersion('git');
      } else if (action === 'status') {
        const dirty = Object.keys(get().unsavedDrafts).length;
        get().addTerminalLog({ type: 'output', content: `On branch main\n${dirty ? `Changes not staged for commit:\n  modified: ${Object.keys(get().unsavedDrafts).join('\n  modified: ')}` : 'nothing to commit, working tree clean'}` });
      } else if (action === 'log') {
        const proj = activeProjId ? get().projects[activeProjId] : null;
        get().addTerminalLog({ type: 'output', content: proj?.historyLogs.slice(-8).reverse().map((log) => `commit ${log.id}\nDate: ${log.timestamp}\n\n    ${log.message}`).join('\n\n') || '(no commits)' });
      } else if (action === 'branch') {
        get().addTerminalLog({ type: 'output', content: '* main' });
      } else if (['add', 'commit', 'push', 'pull', 'checkout', 'switch'].includes(action || '')) {
        get().addTerminalLog({ type: 'success', content: `git ${args.join(' ')} completed in the virtual repository.` });
      } else {
        get().addTerminalLog({ type: 'output', content: 'git virtual SCM supports: status, log, branch, add, commit, push, pull, version' });
      }
      return;
    }

    if (cmd === 'yarn' || cmd === 'pnpm') {
      const manager = cmd as 'yarn' | 'pnpm';
      const action = args[0];
      if (action === '-v' || action === '--version') {
        printVersion(manager);
        return;
      }
      if (action === 'add') {
        get().executeTerminalCommand(`npm install ${args.slice(1).join(' ')}`);
        return;
      }
      if (action === 'remove') {
        get().executeTerminalCommand(`npm uninstall ${args.slice(1).join(' ')}`);
        return;
      }
      if (action === 'run') {
        get().executeTerminalCommand(`npm run ${args.slice(1).join(' ')}`);
        return;
      }
      if (!action || action === 'install') {
        get().addTerminalLog({ type: 'output', content: `${manager} install completed. Lockfile is virtualized.` });
        return;
      }
      get().addTerminalLog({ type: 'error', content: `${manager}: unsupported virtual command "${action}"` });
      return;
    }

    if (cmd === 'clear' || cmd === 'cls') {
      get().clearTerminal();
      return;
    }

    // Checking Workspace scope commands
    if (cmd === 'pwd') {
      get().addTerminalLog({ type: 'output', content: `/workspace/${activeProjId ? activeProjId : 'root'}/${get().terminalCwd}` });
      return;
    }

    if (cmd === 'whoami') {
      get().addTerminalLog({ type: 'output', content: 'devdocks\\nethu012345' });
      return;
    }

    if (cmd === 'date' || cmd === 'time') {
      get().addTerminalLog({ type: 'output', content: new Date().toString() });
      return;
    }

    if (cmd === 'history') {
      const history = get().terminalCommandHistory;
      get().addTerminalLog({
        type: 'output',
        content: history.length ? history.map((item, index) => `${index + 1}  ${item}`).join('\n') : '(no command history)'
      });
      return;
    }

    if (cmd === 'cd') {
      if (!activeProjId) {
        get().addTerminalLog({ type: 'error', content: 'cd error: Must open an active workspace first.' });
        return;
      }
      const proj = get().projects[activeProjId];
      const target = args[0] ? resolveVirtualPath(args[0]) : '';
      if (!target) {
        const sessions = get().terminalSessions.map((session) => session.id === get().activeTerminalSessionId ? { ...session, cwd: 'root' } : session);
        set({ terminalCwd: 'root', terminalSessions: sessions });
        saveStateToLocalStorage({ ...get(), terminalCwd: 'root', terminalSessions: sessions });
        return;
      }
      if (proj.files[target]?.isFolder) {
        const sessions = get().terminalSessions.map((session) => session.id === get().activeTerminalSessionId ? { ...session, cwd: target } : session);
        set({ terminalCwd: target, terminalSessions: sessions });
        saveStateToLocalStorage({ ...get(), terminalCwd: target, terminalSessions: sessions });
      } else {
        get().addTerminalLog({ type: 'error', content: `cd: no such directory: ${args[0]}` });
      }
      return;
    }

    if (cmd === 'echo') {
      const redirectIndex = args.findIndex((arg) => arg === '>' || arg === '>>');
      if (redirectIndex > -1) {
        if (!activeProjId) {
          get().addTerminalLog({ type: 'error', content: 'echo redirect error: Must open an active workspace first.' });
          return;
        }
        const target = args[redirectIndex + 1];
        if (!target) {
          get().addTerminalLog({ type: 'error', content: 'echo redirect error: target file required' });
          return;
        }
        const filePath = resolveVirtualPath(target);
        const ok = writeVirtualFile(activeProjId, filePath, args.slice(0, redirectIndex).join(' '), args[redirectIndex] === '>>');
        get().addTerminalLog(ok ? { type: 'success', content: `Wrote ${filePath}` } : { type: 'error', content: `echo: cannot write to ${filePath}` });
        return;
      }
      get().addTerminalLog({ type: 'output', content: args.join(' ') });
      return;
    }

    if (cmd === 'ls' || cmd === 'dir') {
      if (!activeProjId) {
        get().addTerminalLog({ type: 'error', content: 'No open projects found. Please open/create a project first.' });
        return;
      }
      const proj = get().projects[activeProjId];
      if (!proj) return;

      const cwd = get().terminalCwd === 'root' ? '' : get().terminalCwd;
      const items = Object.keys(proj.files).filter((path) => {
        if (!cwd) return !path.includes('/');
        if (!path.startsWith(cwd + '/')) return false;
        return path.slice(cwd.length + 1).split('/').length === 1;
      });
      if (items.length === 0) {
        get().addTerminalLog({ type: 'output', content: '(empty workspace directory)' });
      } else {
        const sorted = items.sort();
        const display = sorted.map((p) => {
          const isF = proj.files[p].isFolder;
          const label = p.split('/').pop() || p;
          return isF ? `${label}/` : label;
        }).join('\n');
        get().addTerminalLog({ type: 'output', content: display });
      }
      return;
    }

    if (cmd === 'tree') {
      if (!activeProjId) {
        get().addTerminalLog({ type: 'error', content: 'tree error: Must open an active workspace first.' });
        return;
      }
      const proj = get().projects[activeProjId];
      const sorted = Object.keys(proj.files).sort();
      const display = sorted.map((p) => {
        const depth = p.split('/').length - 1;
        const name = p.split('/').pop() || p;
        return `${'  '.repeat(depth)}${proj.files[p].isFolder ? '+ ' : '- '}${name}`;
      }).join('\n');
      get().addTerminalLog({ type: 'output', content: display || '(empty workspace tree)' });
      return;
    }

    if (cmd === 'cat' || cmd === 'type') {
      if (!activeProjId) {
        get().addTerminalLog({ type: 'error', content: `${cmd} error: Must open an active workspace first.` });
        return;
      }
      if (!args[0]) {
        get().addTerminalLog({ type: 'error', content: `${cmd} error: file path argument required` });
        return;
      }
      const proj = get().projects[activeProjId];
      const filePath = resolveVirtualPath(args[0]);
      const file = proj.files[filePath];
      if (!file || file.isFolder) {
        get().addTerminalLog({ type: 'error', content: `cat: no such file: ${args[0]}` });
        return;
      }
      get().addTerminalLog({ type: 'output', content: file.content || '(empty file)' });
      return;
    }

    if (cmd === 'code') {
      if (!activeProjId) {
        get().addTerminalLog({ type: 'error', content: 'code error: Must open an active workspace first.' });
        return;
      }
      if (!args[0]) {
        get().addTerminalLog({ type: 'error', content: 'code error: file path argument required' });
        return;
      }
      const proj = get().projects[activeProjId];
      const filePath = resolveVirtualPath(args[0]);
      const file = proj.files[filePath];
      if (!file || file.isFolder) {
        get().addTerminalLog({ type: 'error', content: `code: no such file: ${args[0]}` });
        return;
      }
      get().openTab(activeProjId, filePath);
      get().addTerminalLog({ type: 'success', content: `Opened ${filePath}` });
      return;
    }

    if (cmd === 'rm' || cmd === 'del' || cmd === 'rmdir') {
      if (!activeProjId) {
        get().addTerminalLog({ type: 'error', content: `${cmd} error: Must open an active workspace first.` });
        return;
      }
      if (!args[0]) {
        get().addTerminalLog({ type: 'error', content: `${cmd} error: path argument required` });
        return;
      }
      const targetPath = resolveVirtualPath(args[0]);
      if (!get().projects[activeProjId].files[targetPath]) {
        get().addTerminalLog({ type: 'error', content: `${cmd}: no such path: ${args[0]}` });
        return;
      }
      get().deleteFileOrFolder(activeProjId, targetPath);
      get().addTerminalLog({ type: 'success', content: `Moved ${targetPath} to Recycle Bin.` });
      return;
    }

    if (cmd === 'set-content' || cmd === 'add-content') {
      if (!activeProjId) {
        get().addTerminalLog({ type: 'error', content: `${cmd} error: Must open an active workspace first.` });
        return;
      }
      if (!args[0]) {
        get().addTerminalLog({ type: 'error', content: `${cmd} error: file path argument required` });
        return;
      }
      const filePath = resolveVirtualPath(args[0]);
      const contentArgs = args.filter((arg) => arg !== '-Value' && arg !== '-Path');
      const content = contentArgs.slice(1).join(' ');
      const ok = writeVirtualFile(activeProjId, filePath, content, cmd === 'add-content');
      get().addTerminalLog(ok ? { type: 'success', content: `${cmd} completed for ${filePath}` } : { type: 'error', content: `${cmd}: cannot write to ${filePath}` });
      return;
    }

    if (cmd === 'copy') {
      if (!activeProjId) {
        get().addTerminalLog({ type: 'error', content: 'copy error: Must open an active workspace first.' });
        return;
      }
      if (!args[0] || !args[1]) {
        get().addTerminalLog({ type: 'error', content: 'copy error: source and destination required' });
        return;
      }
      const proj = get().projects[activeProjId];
      const sourcePath = resolveVirtualPath(args[0]);
      const destPath = resolveVirtualPath(args[1]);
      const source = proj.files[sourcePath];
      if (!source) {
        get().addTerminalLog({ type: 'error', content: `copy: no such path: ${args[0]}` });
        return;
      }
      if (source.isFolder) {
        const copied = Object.keys(proj.files).filter((p) => p === sourcePath || p.startsWith(sourcePath + '/'));
        copied.forEach((p) => {
          const item = proj.files[p];
          const nextPath = p === sourcePath ? destPath : `${destPath}/${p.slice(sourcePath.length + 1)}`;
          if (item.isFolder) get().createFolder(activeProjId, nextPath);
          else writeVirtualFile(activeProjId, nextPath, item.content || '');
        });
      } else {
        writeVirtualFile(activeProjId, destPath, source.content || '');
      }
      get().addTerminalLog({ type: 'success', content: `Copied ${sourcePath} to ${destPath}` });
      return;
    }

    if (cmd === 'move' || cmd === 'rename') {
      if (!activeProjId) {
        get().addTerminalLog({ type: 'error', content: `${cmd} error: Must open an active workspace first.` });
        return;
      }
      if (!args[0] || !args[1]) {
        get().addTerminalLog({ type: 'error', content: `${cmd} error: source and destination required` });
        return;
      }
      const sourcePath = resolveVirtualPath(args[0]);
      const destPath = cmd === 'rename' && !args[1].includes('/')
        ? [...sourcePath.split('/').slice(0, -1), args[1]].filter(Boolean).join('/')
        : resolveVirtualPath(args[1]);
      const ok = get().renameFileOrFolder(activeProjId, sourcePath, destPath);
      get().addTerminalLog(ok ? { type: 'success', content: `Moved ${sourcePath} to ${destPath}` } : { type: 'error', content: `${cmd}: failed to move ${sourcePath}` });
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
      const dirPath = resolveVirtualPath(args[0]);
      const success = get().createFolder(activeProjId, dirPath);
      if (success) {
        get().addTerminalLog({ type: 'success', content: `Created directory "${dirPath}" successfully` });
      } else {
        get().addTerminalLog({ type: 'error', content: `mkdir: failed to create directory "${dirPath}" (path conflict)` });
      }
      return;
    }

    if (cmd === 'new-item') {
      if (!activeProjId) {
        get().addTerminalLog({ type: 'error', content: 'New-Item error: Must open an active workspace first.' });
        return;
      }
      const target = args.find((arg) => !arg.startsWith('-'));
      if (!target) {
        get().addTerminalLog({ type: 'error', content: 'New-Item error: path argument required' });
        return;
      }
      const lowerArgs = args.map((arg) => arg.toLowerCase());
      const asDirectory = lowerArgs.includes('directory') || lowerArgs.includes('-itemtype') && lowerArgs.includes('directory');
      const targetPath = resolveVirtualPath(target);
      const success = asDirectory
        ? get().createFolder(activeProjId, targetPath)
        : get().createFile(activeProjId, targetPath, '');
      get().addTerminalLog(success ? { type: 'success', content: `Created ${targetPath}` } : { type: 'error', content: `New-Item: path conflict ${targetPath}` });
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
      const fPath = resolveVirtualPath(args[0]);
      const success = get().createFile(activeProjId, fPath, '// new empty file');
      if (success) {
        get().addTerminalLog({ type: 'success', content: `File "${fPath}" created successfully` });
      } else {
        get().addTerminalLog({ type: 'error', content: `touch: path conflict or invalid permissions: "${fPath}"` });
      }
      return;
    }

    if (cmd === 'npm') {
      if (args[0] === '-v' || args[0] === '--version' || args[0] === 'version') {
        printVersion('npm');
        return;
      }
      if (args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
        get().addTerminalLog({ type: 'output', content: 'npm virtual commands:\n  npm -v\n  npm install <pkg>\n  npm uninstall <pkg>\n  npm list\n  npm view <pkg>\n  npm run [script]\n  npm audit\n  npm outdated' });
        return;
      }
      if (!activeProjId) {
        get().addTerminalLog({ type: 'error', content: 'npm tasks failed: No active workspace opened' });
        return;
      }
      const action = args[0];
      if (!action) {
        get().addTerminalLog({ type: 'output', content: 'npm <command>\n\nUsage: npm install <pkg>, npm run dev, npm list, npm -v' });
        return;
      }
      if (action === 'audit') {
        get().addTerminalLog({ type: 'success', content: 'found 0 vulnerabilities in virtual dependency graph' });
        return;
      }
      if (action === 'outdated') {
        get().addTerminalLog({ type: 'output', content: 'Package           Current   Wanted   Latest\n(all virtual dependencies are using selected versions)' });
        return;
      }
      if (action === 'init') {
        const proj = get().projects[activeProjId];
        if (proj.files['package.json']) {
          get().addTerminalLog({ type: 'output', content: 'package.json already exists' });
        } else {
          writeVirtualFile(activeProjId, 'package.json', JSON.stringify({ name: proj.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'), version: '1.0.0', dependencies: {} }, null, 2));
          get().addTerminalLog({ type: 'success', content: 'Wrote package.json' });
        }
        return;
      }
      if (action === 'list' || action === 'ls') {
        const proj = get().projects[activeProjId];
        get().addTerminalLog({
          type: 'output',
          content: proj.installedPackages.length ? proj.installedPackages.map((pkg) => `+-- ${pkg}`).join('\n') : '(no dependencies installed)'
        });
        return;
      }
      if (action === 'view' || action === 'info') {
        const pkgName = args[1];
        if (!pkgName) {
          get().addTerminalLog({ type: 'error', content: `npm ${action}: package name required` });
          return;
        }
        const proj = get().projects[activeProjId];
        const pkgFile = proj.files['package.json'];
        let version = proj.installedPackages.includes(pkgName) ? 'installed' : 'not installed';
        try {
          const parsed = pkgFile ? JSON.parse(pkgFile.content) : {};
          version = parsed.dependencies?.[pkgName] || version;
        } catch (err) {}
        get().addTerminalLog({ type: 'output', content: `${pkgName}\nversion: ${version}\nregistry: npm\nstatus: ${proj.installedPackages.includes(pkgName) ? 'installed' : 'available'}` });
        return;
      }
      if (action === 'install' || action === 'i' || action === 'add') {
        const pkg_name = args[1];
        if (!pkg_name) {
          get().addTerminalLog({ type: 'output', content: 'npm WARN: running bare npm install to audit node_modules... Success' });
          return;
        }
        const atIndex = pkg_name.startsWith('@') ? pkg_name.indexOf('@', 1) : pkg_name.indexOf('@');
        const cleanName = atIndex > 0 ? pkg_name.slice(0, atIndex) : pkg_name;
        const version = atIndex > 0 ? pkg_name.slice(atIndex + 1) : 'latest';
        get().addTerminalLog({ type: 'system', content: `Resolving dependency tree from npm registry for "${cleanName}"...` });
        setTimeout(() => {
          get().installPackage(activeProjId, cleanName, version);
          get().addTerminalLog({ type: 'success', content: `+ ${cleanName}@${version} dependency download complete. Saved to package.json dependencies list.` });
        }, 800);
      } else if (action === 'uninstall' || action === 'remove' || action === 'rm') {
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
        if (!script) {
          get().addTerminalLog({ type: 'output', content: 'Lifecycle scripts included in package.json:\n  dev\n    vite --host 0.0.0.0\n  build\n    vite build\n  preview\n    vite preview' });
          return;
        }
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
        get().addTerminalLog({ type: 'error', content: `npm ERR: Unknown command "${action}". Try npm help.` });
      }
      return;
    }

    if (cmd === 'where' || cmd === 'which') {
      const target = args[0];
      const known = ['node', 'npm', 'npx', 'git', 'yarn', 'pnpm', 'code'].includes(target || '');
      get().addTerminalLog({ type: known ? 'output' : 'error', content: known ? `/usr/local/bin/${target}` : `${cmd}: ${target || ''} not found` });
      return;
    }

    // Default error command message
    get().addTerminalLog({ type: 'error', content: `shell command not found: "${cmd}". Type "help" to learn about workspace core commands.` });
  },

  clearTerminal: () => {
    const activeSessionId = get().activeTerminalSessionId;
    set((state) => {
      const terminalLogs = state.terminalLogs.filter((log) => log.sessionId !== activeSessionId);
      const updated = {
        ...state,
        terminalLogs
      };
      saveStateToLocalStorage(updated);
      return updated;
    });
  },

  createTerminalSession: () => {
    const id = 'terminal_' + Math.random().toString(36).substring(2, 8);
    const session: TerminalSession = {
      id,
      name: `powershell ${get().terminalSessions.length + 1}`,
      cwd: 'root',
      createdAt: new Date().toLocaleTimeString()
    };
    set((state) => {
      const updated = {
        ...state,
        terminalSessions: [...state.terminalSessions, session],
        activeTerminalSessionId: id,
        terminalCwd: session.cwd,
        terminalOpen: true
      };
      saveStateToLocalStorage(updated);
      return updated;
    });
    get().addTerminalLog({ type: 'system', content: 'PowerShell terminal session started.', sessionId: id });
    return id;
  },

  closeTerminalSession: (sessionId) => {
    set((state) => {
      const remaining = state.terminalSessions.filter((session) => session.id !== sessionId);
      const terminalSessions = remaining.length ? remaining : [DEFAULT_TERMINAL_SESSION];
      const activeTerminalSessionId = state.activeTerminalSessionId === sessionId
        ? terminalSessions[terminalSessions.length - 1].id
        : state.activeTerminalSessionId;
      const activeSession = terminalSessions.find((session) => session.id === activeTerminalSessionId) || terminalSessions[0];
      const updated = {
        ...state,
        terminalSessions,
        activeTerminalSessionId: activeSession.id,
        terminalCwd: activeSession.cwd,
        terminalLogs: state.terminalLogs.filter((log) => log.sessionId !== sessionId)
      };
      saveStateToLocalStorage(updated);
      return updated;
    });
  },

  setActiveTerminalSession: (sessionId) => {
    const session = get().terminalSessions.find((item) => item.id === sessionId);
    if (!session) return;
    set({ activeTerminalSessionId: sessionId, terminalCwd: session.cwd });
    saveStateToLocalStorage({
      ...get(),
      activeTerminalSessionId: sessionId,
      terminalCwd: session.cwd
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

