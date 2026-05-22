import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import LandingPage from './components/LandingPage';
import DashboardView from './components/DashboardView';
import NewProjectModal from './components/NewProjectModal';
import IDEWorkspace from './components/IDEWorkspace';

export default function App() {
  const store = useStore();
  const [modalOpen, setModalOpen] = useState(false);

  // Sync state and active theme classes on Mount
  useEffect(() => {
    const root = document.documentElement;
    if (store.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [store.theme]);

  // Project generation submit action
  const handleCreateProject = (name: string, description: string, techStack: string[]) => {
    const newId = store.createProject(name, description, techStack);
    // Mount and switch automatically to IDE Workspace
    store.setActiveProject(newId);
    store.setCurrentView('ide');
    store.setSidebarPanel('explorer');
  };

  const handleOpenWorkspace = (id: string) => {
    store.setActiveProject(id);
    store.setCurrentView('ide');
    store.setSidebarPanel('explorer');
  };

  const handleBackToDashboard = () => {
    store.setActiveProject(null);
    store.setCurrentView('dashboard');
  };

  const handleBackToLanding = () => {
    store.setActiveProject(null);
    store.setCurrentView('landing');
  };

  return (
    <div className="min-h-screen">
      
      {/* 1. Landing Screen Router */}
      {store.currentView === 'landing' && (
        <LandingPage onGetStarted={() => store.setCurrentView('dashboard')} theme={store.theme} onThemeToggle={() => store.setTheme(store.theme === 'dark' ? 'light' : 'dark')} />
      )}

      {/* 2. Unified Developer Workbenches Grid */}
      {store.currentView === 'dashboard' && (
        <DashboardView
          projects={store.projects}
          onCreateProjectClick={() => setModalOpen(true)}
          onOpenProject={handleOpenWorkspace}
          onRenameProject={store.renameProject}
          onDeleteProject={store.deleteProject}
          theme={store.theme}
          onThemeToggle={() => store.setTheme(store.theme === 'dark' ? 'light' : 'dark')}
          onBackToHome={handleBackToLanding}
        />
      )}

      {/* 3. Deep Integrated Sandbox IDE Workspace */}
      {store.currentView === 'ide' && (
        <IDEWorkspace onBackToDashboard={handleBackToDashboard} />
      )}

      {/* New Project setup wizard Modal overlay */}
      <NewProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateProject}
      />

    </div>
  );
}

