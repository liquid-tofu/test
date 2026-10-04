import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Search, Filter, X, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { TaskStatus, TaskPriority } from '../types';

export const Toolbar: React.FC = () => {
  const {
    workspace,
    activeProjectId,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    filterAssignee,
    setFilterAssignee,
  } = useWorkspace();

  const filteredTasks = activeProjectId && activeProjectId !== 'all'
    ? workspace.tasks.filter(t => t.projectId === activeProjectId)
    : workspace.tasks;

  const total = filteredTasks.length;
  const done = filteredTasks.filter(t => t.status === 'done').length;
  const overdue = filteredTasks.filter(
    t => t.dueDate && t.status !== 'done' && new Date(t.dueDate).getTime() < Date.now()
  ).length;
  const dueSoon = filteredTasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false;
    const diffDays = (new Date(t.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const hasActiveFilters = searchQuery !== '' || filterStatus !== 'all' || filterPriority !== 'all' || filterAssignee !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterAssignee('all');
  };

  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search input */}
        <div className="flex-1 flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks, tags, assignees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="done">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'all')}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent Priority</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Team Members</option>
            <option value="Unassigned">Unassigned</option>
            {workspace.teamMembers.map(m => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-rose-300 border border-rose-900/40 transition"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Status Metrics Ribbon */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium text-slate-300 flex-shrink-0">
          <div className="flex items-center gap-1.5" title="Completed tasks">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{done}/{total} done ({pct}%)</span>
          </div>

          {overdue > 0 && (
            <div className="flex items-center gap-1.5 text-rose-400 font-semibold" title="Overdue tasks">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{overdue} overdue</span>
            </div>
          )}

          {dueSoon > 0 && (
            <div className="flex items-center gap-1.5 text-amber-300 hidden sm:flex" title="Tasks due within 7 days">
              <Clock className="w-3.5 h-3.5" />
              <span>{dueSoon} due this week</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
