export interface FileNode {
  path: string;       // e.g. "src/App.tsx" or "public"
  content: string;    // Only relevant for files
  isFolder: boolean;
}

export interface RecycleBinItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'project';
  originalPath?: string; // For files/folders: e.g. "src/App.tsx", for projects: empty
  content?: string;      // If file: file content. If project: full project JSON string. If folder: folder items serialized.
  isFolder?: boolean;
  timestamp: string;
}

export interface HistoryLog {
  id: string;
  timestamp: string;
  action: 'create' | 'delete' | 'restore' | 'rename' | 'pkg_install' | 'pkg_uninstall' | 'ext_install' | 'ext_uninstall' | 'save' | 'clear' | 'run' | 'perm_delete';
  message: string;
}

export interface TerminalLog {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'system';
  content: string;
  timestamp: string;
  sessionId?: string;
}

export interface TerminalSession {
  id: string;
  name: string;
  cwd: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  files: Record<string, FileNode>;
  openTabs: string[];
  activeFile: string | null;
  installedPackages: string[];
  installedExtensions: string[];
  recycleBin: RecycleBinItem[];
  historyLogs: HistoryLog[];
  createdDate: string;
  lastEdited: string;
}

export type SidebarPanel = 'explorer' | 'extensions' | 'packages' | 'terminal' | 'recycle' | 'profile' | null;

export interface AppState {
  projects: Record<string, Project>;
  activeProjectId: string | null; // null means we are on Dashboard/Landing
  currentView: 'landing' | 'dashboard' | 'ide';
  theme: 'dark' | 'light';
  sidebarPanel: SidebarPanel;
  terminalOpen: boolean;
  previewOpen?: boolean;
  autoSave: boolean;
  terminalLogs: TerminalLog[];
  terminalSessions: TerminalSession[];
  activeTerminalSessionId: string;
  terminalCommandHistory: string[];
  terminalCwd: string; // current working directory virtual path like "root" or "src"
  
  // Panel resizing dimensions (in percent or pixels)
  sidebarWidth: number; // in pixels (e.g. 260)
  editorWidth: number; // in percent (e.g. 50)
  terminalHeight: number; // in pixels (e.g. 200)
}
