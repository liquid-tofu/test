import React, { useState, useMemo } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Task, TaskStatus, TaskPriority } from '../types';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  CheckCircle2,
  Calendar,
  Clock,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { exportToExcel } from '../services/export';

type SortColumn = 'title' | 'project' | 'status' | 'priority' | 'assignee' | 'dueDate' | 'progress' | 'hours';
type SortDirection = 'asc' | 'desc';

export const TaskTableView: React.FC = () => {
  const {
    workspace,
    activeProjectId,
    searchQuery,
    filterStatus,
    filterPriority,
    filterAssignee,
    updateTask,
    setSelectedTaskId,
  } = useWorkspace();

  const [sortCol, setSortCol] = useState<SortColumn>('dueDate');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const projMap = useMemo(() => new Map(workspace.projects.map(p => [p.id, p])), [workspace.projects]);

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const processedTasks = useMemo(() => {
    let list = workspace.tasks.filter(t => {
      if (activeProjectId && activeProjectId !== 'all' && t.projectId !== activeProjectId) {
        return false;
      }
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterAssignee !== 'all' && (t.assignee || 'Unassigned') !== filterAssignee) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.assignee?.toLowerCase().includes(q) ||
          t.tags?.some(tag => tag.toLowerCase().includes(q))
        );
      }
      return true;
    });

    list.sort((a, b) => {
      let vA: any = '';
      let vB: any = '';

      switch (sortCol) {
        case 'title':
          vA = a.title.toLowerCase();
          vB = b.title.toLowerCase();
          break;
        case 'project':
          vA = (projMap.get(a.projectId)?.name || '').toLowerCase();
          vB = (projMap.get(b.projectId)?.name || '').toLowerCase();
          break;
        case 'status': {
          const rank: Record<TaskStatus, number> = { in_progress: 1, todo: 2, review: 3, backlog: 4, done: 5 };
          vA = rank[a.status];
          vB = rank[b.status];
          break;
        }
        case 'priority': {
          const pRank: Record<TaskPriority, number> = { urgent: 1, high: 2, medium: 3, low: 4 };
          vA = pRank[a.priority];
          vB = pRank[b.priority];
          break;
        }
        case 'assignee':
          vA = (a.assignee || 'zzz').toLowerCase();
          vB = (b.assignee || 'zzz').toLowerCase();
          break;
        case 'dueDate':
          vA = a.dueDate || '9999-99-99';
          vB = b.dueDate || '9999-99-99';
          break;
        case 'progress': {
          const sA = a.subtasks.filter(s => s.completed).length;
          const sB = b.subtasks.filter(s => s.completed).length;
          vA = a.status === 'done' ? 100 : (a.subtasks.length ? (sA / a.subtasks.length) * 100 : 0);
          vB = b.status === 'done' ? 100 : (b.subtasks.length ? (sB / b.subtasks.length) * 100 : 0);
          break;
        }
        case 'hours':
          vA = a.estimatedHours || 0;
          vB = b.estimatedHours || 0;
          break;
      }

      if (vA < vB) return sortDir === 'asc' ? -1 : 1;
      if (vA > vB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [workspace.tasks, activeProjectId, filterStatus, filterPriority, filterAssignee, searchQuery, sortCol, sortDir, projMap]);

  // Aggregate stats for table summary footer
  const totalHours = processedTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
  const completedCount = processedTasks.filter(t => t.status === 'done').length;
  const overdueCount = processedTasks.filter(
    t => t.dueDate && t.status !== 'done' && new Date(t.dueDate).getTime() < Date.now()
  ).length;

  const renderSortIcon = (col: SortColumn) => {
    if (sortCol !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 opacity-60" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-400 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-400 font-bold" />
    );
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100 min-h-[calc(100vh-140px)]">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Table Top Controls & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Structured Deliverables & Task Master Table
            </h2>
            <p className="text-xs text-slate-400">
              Interactive multi-column data grid with inline state updating and Excel data interchange.
            </p>
          </div>

          <button
            onClick={() => exportToExcel(workspace, activeProjectId)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Master Sheet (.xlsx)</span>
          </button>
        </div>

        {/* Table Wrap */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-md">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/70 text-slate-300 border-b border-slate-800 uppercase tracking-wider font-semibold select-none">
                <th
                  onClick={() => handleSort('title')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition whitespace-nowrap min-w-[220px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Task Title</span>
                    {renderSortIcon('title')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('project')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition whitespace-nowrap min-w-[140px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Project</span>
                    {renderSortIcon('project')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition whitespace-nowrap min-w-[120px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('priority')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition whitespace-nowrap min-w-[100px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Priority</span>
                    {renderSortIcon('priority')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('assignee')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition whitespace-nowrap min-w-[130px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Assignee</span>
                    {renderSortIcon('assignee')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('dueDate')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition whitespace-nowrap min-w-[110px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Due Date</span>
                    {renderSortIcon('dueDate')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('progress')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition whitespace-nowrap min-w-[130px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Subtasks & Progress</span>
                    {renderSortIcon('progress')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('hours')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition whitespace-nowrap text-right min-w-[90px]"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Est. Hrs</span>
                    {renderSortIcon('hours')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-normal">
              {processedTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No tasks match the active filters.
                  </td>
                </tr>
              ) : (
                processedTasks.map(task => {
                  const project = projMap.get(task.projectId);
                  const subDone = task.subtasks.filter(s => s.completed).length;
                  const totalSub = task.subtasks.length;
                  const pct = task.status === 'done' ? 100 : (totalSub ? Math.round((subDone / totalSub) * 100) : 0);
                  const isOverdue = task.dueDate && task.status !== 'done' && new Date(task.dueDate).getTime() < Date.now();

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Title */}
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`text-left font-medium text-slate-100 hover:text-blue-400 transition-colors line-clamp-1 ${
                            task.status === 'done' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </button>
                      </td>

                      {/* Project */}
                      <td className="py-2.5 px-3">
                        {project ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                            <span className="truncate max-w-[120px] text-slate-300 font-medium">
                              {project.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">None</span>
                        )}
                      </td>

                      {/* Status Selector */}
                      <td className="py-2.5 px-3">
                        <select
                          value={task.status}
                          onChange={(e) => updateTask({ ...task, status: e.target.value as TaskStatus })}
                          className={`text-xs px-2 py-1 rounded border bg-slate-800 font-medium transition ${
                            task.status === 'done'
                              ? 'text-emerald-300 border-emerald-800/60 bg-emerald-950/30'
                              : task.status === 'in_progress'
                              ? 'text-blue-300 border-blue-800/60 bg-blue-950/30'
                              : task.status === 'review'
                              ? 'text-purple-300 border-purple-800/60 bg-purple-950/30'
                              : 'text-slate-300 border-slate-700'
                          }`}
                        >
                          <option value="backlog">Backlog</option>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">In Review</option>
                          <option value="done">Completed</option>
                        </select>
                      </td>

                      {/* Priority Selector */}
                      <td className="py-2.5 px-3">
                        <select
                          value={task.priority}
                          onChange={(e) => updateTask({ ...task, priority: e.target.value as TaskPriority })}
                          className={`text-xs px-2 py-1 rounded border bg-slate-800 font-medium ${
                            task.priority === 'urgent'
                              ? 'text-rose-300 border-rose-800/60 bg-rose-950/20'
                              : task.priority === 'high'
                              ? 'text-amber-300 border-amber-800/60 bg-amber-950/20'
                              : 'text-slate-400 border-slate-700'
                          }`}
                        >
                          <option value="urgent">Urgent</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </td>

                      {/* Assignee Selector */}
                      <td className="py-2.5 px-3">
                        <select
                          value={task.assignee || 'Unassigned'}
                          onChange={(e) => updateTask({ ...task, assignee: e.target.value === 'Unassigned' ? '' : e.target.value })}
                          className="text-xs px-2 py-1 rounded border border-slate-700 bg-slate-800 text-slate-200"
                        >
                          <option value="Unassigned">Unassigned</option>
                          {workspace.teamMembers.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Due Date */}
                      <td className="py-2.5 px-3">
                        <input
                          type="date"
                          value={task.dueDate || ''}
                          onChange={(e) => updateTask({ ...task, dueDate: e.target.value })}
                          className={`text-xs bg-slate-800 border rounded px-1.5 py-0.5 ${
                            isOverdue
                              ? 'border-rose-600 text-rose-300 font-semibold'
                              : 'border-slate-700 text-slate-300'
                          }`}
                        />
                      </td>

                      {/* Progress */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden flex-shrink-0">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-300 min-w-[32px] text-right">
                            {pct}%
                          </span>
                        </div>
                      </td>

                      {/* Est. Hours */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {task.estimatedHours || 0}h
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Summary Footer */}
            <tfoot>
              <tr className="bg-slate-950 text-slate-300 font-semibold border-t-2 border-slate-800">
                <td colSpan={2} className="py-3 px-4">
                  Totals ({processedTasks.length} tasks)
                </td>
                <td className="py-3 px-3 text-emerald-400">
                  {completedCount} Completed
                </td>
                <td className="py-3 px-3 text-rose-400">
                  {overdueCount > 0 ? `${overdueCount} Overdue` : '0 Overdue'}
                </td>
                <td colSpan={3} className="py-3 px-3 text-right text-slate-400 font-normal">
                  Total Allocated Effort:
                </td>
                <td className="py-3 px-3 text-right font-mono text-blue-400">
                  {totalHours} hrs
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
