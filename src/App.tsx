import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { Navbar } from './components/Navbar';
import { Toolbar } from './components/Toolbar';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskListView } from './components/TaskListView';
import { TaskTableView } from './components/TaskTableView';
import { GanttChartView } from './components/GanttChartView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { TeamWorkloadView } from './components/TeamWorkloadView';
import { ActivityLogView } from './components/ActivityLogView';
import { TaskModal } from './components/TaskModal';
import { ProjectModal } from './components/ProjectModal';
import { AddTeammateModal } from './components/AddTeammateModal';
import { CollaboratorBar } from './components/CollaboratorBar';
import { Loader2 } from 'lucide-react';

function WorkspaceApp() {
  const {
    isLoading,
    viewMode,
    selectedTaskId,
    setSelectedTaskId,
  } = useWorkspace();

  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isAddTeammateOpen, setIsAddTeammateOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm font-medium">Connecting to Cloud & Synchronizing Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenNewTask={() => setIsNewTaskOpen(true)}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onOpenAddTeammate={() => setIsAddTeammateOpen(true)}
      />

      {/* Filter & Search Toolbar (shown for task-focused views) */}
      {(viewMode === 'board' || viewMode === 'list' || viewMode === 'table' || viewMode === 'gantt') && (
        <Toolbar />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {viewMode === 'board' && <KanbanBoard />}
        {viewMode === 'list' && <TaskListView />}
        {viewMode === 'table' && <TaskTableView />}
        {viewMode === 'gantt' && <GanttChartView />}
        {viewMode === 'analytics' && <AnalyticsDashboard />}
        {viewMode === 'workload' && <TeamWorkloadView onOpenAddTeammate={() => setIsAddTeammateOpen(true)} />}
        {viewMode === 'activity' && <ActivityLogView />}
      </main>

      {/* Collaborator & Cloud Sync Status Footer */}
      <CollaboratorBar />

      {/* Task Edit or Create Modal */}
      {(selectedTaskId || isNewTaskOpen) && (
        <TaskModal
          taskId={selectedTaskId}
          isNew={isNewTaskOpen && !selectedTaskId}
          onClose={() => {
            setSelectedTaskId(null);
            setIsNewTaskOpen(false);
          }}
        />
      )}

      {/* Project Settings / Create Modal */}
      {isNewProjectOpen && (
        <ProjectModal
          onClose={() => setIsNewProjectOpen(false)}
        />
      )}

      {/* Add Teammate Modal */}
      {isAddTeammateOpen && (
        <AddTeammateModal
          onClose={() => setIsAddTeammateOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <WorkspaceApp />
      </WorkspaceProvider>
    </ThemeProvider>
  );
}
