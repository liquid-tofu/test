import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Task, TaskStatus, TaskPriority } from '../types';
import {
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  AlertCircle,
  MoreVertical,
  CheckSquare,
  Flame,
  AlertTriangle,
} from 'lucide-react';

const STATUS_ORDER: TaskStatus[] = ['in_progress', 'todo', 'review', 'backlog', 'done'];

export const TaskListView: React.FC = () => {
  const {
    workspace,
    activeProjectId,
    searchQuery,
    filterStatus,
    filterPriority,
    filterAssignee,
    updateTask,
    toggleTaskStatus,
    setSelectedTaskId,
  } = useWorkspace();

  const filteredTasks = workspace.tasks.filter(t => {
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

  const projMap = new Map(workspace.projects.map(p => [p.id, p]));

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100 min-h-[calc(100vh-140px)]">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-200">
              Tasks & Action Items ({filteredTasks.length})
            </h3>
            <span className="text-xs text-slate-400">
              Click task to view details or subtasks
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                No tasks match your filters.
              </div>
            ) : (
              filteredTasks.map(task => {
                const subDone = task.subtasks.filter(s => s.completed).length;
                const totalSub = task.subtasks.length;
                const progressPct = totalSub ? Math.round((subDone / totalSub) * 100) : (task.status === 'done' ? 100 : 0);
                const isOverdue = task.dueDate && task.status !== 'done' && new Date(task.dueDate).getTime() < Date.now();
                const project = projMap.get(task.projectId);

                return (
                  <div
                    key={task.id}
                    className="p-3.5 sm:px-5 hover:bg-slate-800/50 transition flex items-center gap-3 group"
                  >
                    {/* Checkbox button */}
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className="text-slate-500 hover:text-emerald-400 transition-colors flex-shrink-0"
                      title={task.status === 'done' ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 group-hover:text-slate-300" />
                      )}
                    </button>

                    {/* Main content click opens modal */}
                    <div
                      onClick={() => setSelectedTaskId(task.id)}
                      className="flex-1 min-w-0 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium truncate ${
                              task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-100 group-hover:text-blue-400'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-slate-400">
                          {project && (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-300">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                              {project.name}
                            </span>
                          )}

                          {task.dueDate && (
                            <span
                              className={`flex items-center gap-1 text-[11px] font-medium ${
                                isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-400'
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              <span>{task.dueDate}</span>
                              {isOverdue && <span>(Overdue)</span>}
                            </span>
                          )}

                          {totalSub > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                              <CheckSquare className="w-3 h-3" />
                              <span>{subDone}/{totalSub}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Meta: Status select, Priority badge, Assignee */}
                      <div className="flex items-center gap-2.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Status Select */}
                        <select
                          value={task.status}
                          onChange={(e) => updateTask({ ...task, status: e.target.value as TaskStatus })}
                          className={`text-xs px-2.5 py-1 rounded-md font-medium border bg-slate-800 transition ${
                            task.status === 'done'
                              ? 'text-emerald-300 border-emerald-800/60 bg-emerald-950/20'
                              : task.status === 'in_progress'
                              ? 'text-blue-300 border-blue-800/60 bg-blue-950/20'
                              : task.status === 'review'
                              ? 'text-purple-300 border-purple-800/60 bg-purple-950/20'
                              : 'text-slate-300 border-slate-700'
                          }`}
                        >
                          <option value="backlog">Backlog</option>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">In Review</option>
                          <option value="done">Completed</option>
                        </select>

                        {/* Priority Select */}
                        <select
                          value={task.priority}
                          onChange={(e) => updateTask({ ...task, priority: e.target.value as TaskPriority })}
                          className={`text-xs px-2 py-1 rounded-md font-medium border bg-slate-800 ${
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

                        {/* Assignee pill */}
                        <div
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-300 min-w-[100px]"
                          title={`Assigned to ${task.assignee || 'Unassigned'}`}
                        >
                          <div className="w-4 h-4 rounded-full bg-blue-600/40 text-blue-300 flex items-center justify-center text-[9px] font-bold">
                            {(task.assignee || 'U').charAt(0)}
                          </div>
                          <span className="truncate max-w-[80px]">{task.assignee || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
