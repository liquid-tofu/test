import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import {
  Layers,
  Kanban,
  ListTodo,
  Table as TableIcon,
  CalendarRange,
  BarChart3,
  Users,
  History,
  Plus,
  Download,
  Wifi,
  WifiOff,
  RefreshCw,
  FolderPlus,
  Laptop,
  Smartphone,
  ChevronDown,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  FileCode,
  Sun,
  Moon,
  UserPlus,
} from 'lucide-react';
import { exportToExcel, exportToPdf, exportToCsv, exportToJson } from '../services/export';

interface NavbarProps {
  onOpenNewTask: () => void;
  onOpenNewProject: () => void;
  onOpenAddTeammate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewTask, onOpenNewProject, onOpenAddTeammate }) => {
  const {
    workspace,
    activeProjectId,
    setActiveProjectId,
    viewMode,
    setViewMode,
    currentUser,
    setCurrentUser,
    onlinePresences,
    connectionStatus,
    latencyMs,
    resetWorkspace,
  } = useWorkspace();

  const { theme, toggleTheme } = useTheme();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  const activeProject = workspace.projects.find(p => p.id === activeProjectId);
  const totalTasks = workspace.tasks.length;
  const completedTasks = workspace.tasks.filter(t => t.status === 'done').length;
  const overallProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleExport = (type: 'excel' | 'pdf' | 'csv' | 'json') => {
    setShowExportMenu(false);
    if (type === 'excel') exportToExcel(workspace, activeProjectId);
    else if (type === 'pdf') exportToPdf(workspace, activeProjectId);
    else if (type === 'csv') exportToCsv(workspace.tasks, workspace.projects);
    else if (type === 'json') exportToJson(workspace);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md">
      {/* Top tier: Brand, Project switcher, Live Collaborators, Cloud status & Action buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  SyncTeam
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cloud Collab
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-800 hidden md:block" />

            {/* Project Picker dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 text-xs sm:text-sm font-medium transition-all"
              >
                {activeProject ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeProject.color }} />
                    <span className="max-w-[140px] sm:max-w-[200px] truncate">{activeProject.name}</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>All Projects ({workspace.projects.length})</span>
                  </>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showProjectMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProjectMenu(false)} />
                  <div className="absolute left-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-slate-200 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Workspaces & Projects
                    </div>
                    <button
                      onClick={() => {
                        setActiveProjectId('all');
                        setShowProjectMenu(false);
                      }}
                      className={`w-full px-3 py-2 flex items-center justify-between text-left text-xs sm:text-sm hover:bg-slate-700/60 transition ${
                        activeProjectId === 'all' ? 'bg-blue-600/20 text-blue-400 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>All Projects Overview</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {workspace.tasks.length} tasks
                      </span>
                    </button>

                    <div className="my-1 border-t border-slate-700/60" />

                    {workspace.projects.map(proj => {
                      const count = workspace.tasks.filter(t => t.projectId === proj.id).length;
                      return (
                        <button
                          key={proj.id}
                          onClick={() => {
                            setActiveProjectId(proj.id);
                            setShowProjectMenu(false);
                          }}
                          className={`w-full px-3 py-2 flex items-center justify-between text-left text-xs sm:text-sm hover:bg-slate-700/60 transition ${
                            activeProjectId === proj.id ? 'bg-blue-600/20 text-blue-400 font-semibold' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: proj.color }} />
                            <span className="truncate">{proj.name}</span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono flex-shrink-0">
                            {count}
                          </span>
                        </button>
                      );
                    })}

                    <div className="my-1 border-t border-slate-700/60" />

                    <button
                      onClick={() => {
                        setShowProjectMenu(false);
                        onOpenNewProject();
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2 text-xs sm:text-sm text-blue-400 hover:bg-blue-900/30 transition font-medium"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span>+ Create New Project</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Side: Cloud Connection, Presence Avatars, Actions */}
          <div className="flex items-center gap-3">
            
            {/* Live Cloud Sync Status Badge */}
            <div
              className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                  : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
                  ? 'bg-amber-950/40 border-amber-700/50 text-amber-300'
                  : 'bg-rose-950/40 border-rose-700/50 text-rose-300'
              }`}
              title={
                connectionStatus === 'connected'
                  ? `Cloud synchronized via WebSocket on port 3000. Latency: ${latencyMs}ms`
                  : 'Attempting cloud reconnection...'
              }
            >
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Cloud Synced</span>
                  <span className="text-[10px] text-emerald-400/80 font-mono">
                    {latencyMs ? `${latencyMs}ms` : 'live'}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                  <span>{connectionStatus}</span>
                </>
              )}
            </div>

            {/* Collaborator Presence Avatars */}
            <div className="flex items-center -space-x-2 overflow-hidden py-1 px-1">
              {onlinePresences.slice(0, 4).map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="relative group cursor-pointer"
                  title={`${p.name} (${p.device || 'Active'})${p.activeTaskId ? ' • Editing task' : ''}`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white border-2 border-slate-900 shadow-sm transition-transform group-hover:scale-110"
                    style={{ backgroundColor: p.avatarColor || '#3b82f6' }}
                  >
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900" />
                </div>
              ))}
              {onlinePresences.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[10px] font-semibold text-slate-300">
                  +{onlinePresences.length - 4}
                </div>
              )}
            </div>

            {/* Persona Switcher (Allows testing multi-device / multi-collaborator real-time behavior) */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition"
                title="Switch persona to test real-time collaboration across multiple teammates"
              >
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: currentUser.avatarColor }}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <span className="hidden md:inline max-w-[90px] truncate">{currentUser.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showPersonaMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPersonaMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-slate-200">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Collaborator Persona (Real-Time Test)
                    </div>
                    <p className="px-3 pb-2 text-[11px] text-slate-400">
                      Switch persona to see real-time updates and presence live across devices:
                    </p>
                    {workspace.teamMembers.map(member => (
                      <button
                        key={member.id}
                        onClick={() => {
                          setCurrentUser(member);
                          setShowPersonaMenu(false);
                        }}
                        className={`w-full px-3 py-2 flex items-center justify-between text-left text-xs hover:bg-slate-700/60 transition ${
                          currentUser.id === member.id ? 'bg-blue-600/20 text-blue-400 font-semibold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ backgroundColor: member.avatarColor }}
                          >
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-200">{member.name}</div>
                            <div className="text-[10px] text-slate-400">{member.role}</div>
                          </div>
                        </div>
                        {currentUser.id === member.id && (
                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        )}
                      </button>
                    ))}

                    <div className="pt-2 mt-1 border-t border-slate-700/80 px-2">
                      <button
                        onClick={() => {
                          setShowPersonaMenu(false);
                          onOpenAddTeammate();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-semibold text-xs transition"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Add New Teammate</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Add Teammate button in navbar */}
            <button
              onClick={onOpenAddTeammate}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition"
              title="Add a teammate to assign tasks and contribute"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-400" />
              <span>Invite Teammate</span>
            </button>

            {/* Theme Toggle Button (Light/Dark Mode) */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition shadow-sm"
              title={theme === 'dark' ? 'Switch to Light Mode background' : 'Switch to Dark Mode background'}
              aria-label="Toggle theme background"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            {/* Export Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-medium transition"
              >
                <Download className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-slate-200">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Export Reports & Data
                    </div>
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full px-3 py-2 flex items-center gap-2.5 text-xs sm:text-sm text-left hover:bg-slate-700/70 transition"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-medium">Excel Report (.xlsx)</div>
                        <div className="text-[11px] text-slate-400">Multi-sheet with Workload & Tasks</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full px-3 py-2 flex items-center gap-2.5 text-xs sm:text-sm text-left hover:bg-slate-700/70 transition"
                    >
                      <FileText className="w-4 h-4 text-rose-400" />
                      <div>
                        <div className="font-medium">Executive PDF Report</div>
                        <div className="text-[11px] text-slate-400">Printable landscape layout with KPIs</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full px-3 py-2 flex items-center gap-2.5 text-xs sm:text-sm text-left hover:bg-slate-700/70 transition"
                    >
                      <FileText className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="font-medium">CSV Spreadsheet (.csv)</div>
                        <div className="text-[11px] text-slate-400">Compatible with Google Sheets</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full px-3 py-2 flex items-center gap-2.5 text-xs sm:text-sm text-left hover:bg-slate-700/70 transition"
                    >
                      <FileCode className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-medium">Full JSON Workspace Backup</div>
                        <div className="text-[11px] text-slate-400">Complete raw project dump</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* + New Task Primary Button */}
            <button
              onClick={onOpenNewTask}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom tier: View mode selector & Project quick stats */}
      <div className="bg-slate-950/60 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-2 gap-4">
          {/* Navigation view tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Views">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                viewMode === 'board'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>Kanban Board</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                viewMode === 'list'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>List View</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                viewMode === 'table'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Data Table</span>
            </button>

            <button
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                viewMode === 'gantt'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Gantt Timeline with Process Day tracking"
            >
              <CalendarRange className="w-4 h-4" />
              <div className="flex items-center gap-1.5">
                <span>Gantt</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono hidden sm:inline">
                  Process Day
                </span>
              </div>
            </button>

            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                viewMode === 'analytics'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics & Charts</span>
            </button>

            <button
              onClick={() => setViewMode('workload')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                viewMode === 'workload'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team Workload</span>
            </button>

            <button
              onClick={() => setViewMode('activity')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                viewMode === 'activity'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Trail</span>
            </button>
          </nav>

          {/* Quick Metrics Progress Bar */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400">
            <span>Overall Progress</span>
            <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <span className="font-semibold text-slate-300 font-mono">{overallProgress}%</span>
          </div>
        </div>
      </div>
    </header>
  );
};
