import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import LandingPage from './components/LandingPage';
import DashboardView from './components/DashboardView';
import NewProjectModal from './components/NewProjectModal';
import IDEWorkspace from './components/IDEWorkspace';
import AuthPage from './components/AuthPage';

export default function App() {
  const store = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const userProjects = Object.fromEntries(
    Object.entries(store.projects).filter(([, project]) => (
      project.ownerId === store.currentUser?.id && project.ownerEmail === store.currentUser?.email
    ))
  );

  // DevDocks is dark-only. Remove any older persisted light theme class on mount.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');
    if (store.theme !== 'dark') store.setTheme('dark');
  }, []);

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
      {!store.currentUser && (
        <AuthPage onSignIn={store.signIn} onSignUp={store.signUp} />
      )}
      
      {/* 1. Landing Screen Router */}
      {store.currentUser && store.currentView === 'landing' && (
        <LandingPage onGetStarted={() => store.setCurrentView('dashboard')} currentUser={store.currentUser} onSignOut={store.signOut} />
      )}

      {/* 2. Unified Developer Workbenches Grid */}
      {store.currentUser && store.currentView === 'dashboard' && (
        <DashboardView
          projects={userProjects}
          onCreateProjectClick={() => setModalOpen(true)}
          onOpenProject={handleOpenWorkspace}
          onRenameProject={store.renameProject}
          onDeleteProject={store.deleteProject}
          onBackToHome={handleBackToLanding}
          currentUser={store.currentUser}
          onSignOut={store.signOut}
        />
      )}

      {/* 3. Deep Integrated Sandbox IDE Workspace */}
      {store.currentUser && store.currentView === 'ide' && (
        <IDEWorkspace onBackToDashboard={handleBackToDashboard} />
      )}

      {/* New Project setup wizard Modal overlay */}
      <NewProjectModal
        isOpen={Boolean(store.currentUser) && modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateProject}
      />

    </div>
  );
}

