import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Task, TaskStatus } from '../types';
import {
  Plus,
  Calendar,
  CheckSquare,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Tag,
  Flame,
  ArrowRight,
} from 'lucide-react';

const COLUMNS: { key: TaskStatus; label: string; accentColor: string; bg: string }[] = [
  { key: 'backlog', label: 'Backlog', accentColor: '#94a3b8', bg: 'bg-slate-800/40' },
  { key: 'todo', label: 'To Do', accentColor: '#64748b', bg: 'bg-slate-800/40' },
  { key: 'in_progress', label: 'In Progress', accentColor: '#3b82f6', bg: 'bg-blue-950/20' },
  { key: 'review', label: 'In Review', accentColor: '#8b5cf6', bg: 'bg-purple-950/20' },
  { key: 'done', label: 'Completed', accentColor: '#10b981', bg: 'bg-emerald-950/20' },
];

export const KanbanBoard: React.FC = () => {
  const {
    workspace,
    activeProjectId,
    searchQuery,
    filterStatus,
    filterPriority,
    filterAssignee,
    updateTask,
    setSelectedTaskId,
    createTask,
    onlinePresences,
    currentUser,
  } = useWorkspace();

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [quickAddCol, setQuickAddCol] = useState<TaskStatus | null>(null);
  const [quickTitle, setQuickTitle] = useState('');

  // Filter tasks
  const visibleTasks = workspace.tasks.filter(t => {
    if (activeProjectId && activeProjectId !== 'all' && t.projectId !== activeProjectId) {
      return false;
    }
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterAssignee !== 'all' && (t.assignee || 'Unassigned') !== filterAssignee) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchAssignee = t.assignee?.toLowerCase().includes(q);
      const matchTags = t.tags?.some(tag => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchAssignee && !matchTags) return false;
    }
    return true;
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, col: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(col);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    setDraggedTaskId(null);
    setDragOverCol(null);

    if (taskId) {
      const task = workspace.tasks.find(t => t.id === taskId);
      if (task && task.status !== targetStatus) {
        updateTask({
          ...task,
          status: targetStatus,
        });
      }
    }
  };

  const handleQuickAdd = (col: TaskStatus) => {
    if (!quickTitle.trim()) return;
    const projId = activeProjectId !== 'all' ? activeProjectId : (workspace.projects[0]?.id || 'proj-1');

    createTask({
      projectId: projId,
      title: quickTitle.trim(),
      description: '',
      status: col,
      priority: 'medium',
      assignee: currentUser.name,
      dueDate: '',
      tags: [],
      estimatedHours: 4,
      subtasks: [],
      comments: [],
    });

    setQuickTitle('');
    setQuickAddCol(null);
  };

  return (
    <div className="flex-1 overflow-x-auto p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100 min-h-[calc(100vh-140px)]">
      <div className="max-w-7xl mx-auto flex gap-4 min-w-[1100px] items-start">
        {COLUMNS.map(col => {
          const colTasks = visibleTasks.filter(t => t.status === col.key);
          const isOver = dragOverCol === col.key;

          return (
            <div
              key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.key)}
              className={`flex-1 flex flex-col rounded-xl border transition-all duration-150 ${col.bg} ${
                isOver
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-slate-800/80 shadow-lg'
                  : 'border-slate-800/80 shadow-sm'
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: col.accentColor }}
                  />
                  <h3 className="font-semibold text-sm text-slate-200">{col.label}</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-400">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => setQuickAddCol(quickAddCol === col.key ? null : col.key)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 transition"
                  title={`Add task to ${col.label}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Inline Quick Add Input */}
              {quickAddCol === col.key && (
                <div className="p-3 bg-slate-900 border-b border-slate-800 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="Task name... press Enter"
                    autoFocus
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAdd(col.key);
                      if (e.key === 'Escape') setQuickAddCol(null);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setQuickAddCol(null)}
                      className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleQuickAdd(col.key)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Tasks List */}
              <div className="p-3 flex flex-col gap-2.5 min-h-[300px]">
                {colTasks.length === 0 && (
                  <div className="border border-dashed border-slate-800/80 rounded-lg p-6 text-center text-xs text-slate-500">
                    Drop tasks here
                  </div>
                )}

                {colTasks.map(task => {
                  const subDone = task.subtasks.filter(s => s.completed).length;
                  const totalSub = task.subtasks.length;
                  const progressPct = totalSub ? Math.round((subDone / totalSub) * 100) : 0;
                  const isOverdue = task.dueDate && task.status !== 'done' && new Date(task.dueDate).getTime() < Date.now();
                  
                  // Check if any collaborator is currently viewing/editing this task
                  const viewers = onlinePresences.filter(p => p.activeTaskId === task.id);

                  // Priority badge styles
                  const priorityConfig = {
                    urgent: { bg: 'bg-rose-950/50 text-rose-300 border-rose-800/50', icon: Flame },
                    high: { bg: 'bg-amber-950/50 text-amber-300 border-amber-800/50', icon: AlertTriangle },
                    medium: { bg: 'bg-blue-950/50 text-blue-300 border-blue-800/50', icon: null },
                    low: { bg: 'bg-slate-800/60 text-slate-400 border-slate-700/60', icon: null },
                  }[task.priority];

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`group relative bg-slate-900 border rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-slate-700 transition cursor-grab active:cursor-grabbing ${
                        draggedTaskId === task.id ? 'opacity-40 scale-95 border-blue-500' : 'border-slate-800'
                      }`}
                    >
                      {/* Live Collaborator Presence Indicator badge */}
                      {viewers.length > 0 && (
                        <div className="absolute -top-2 -right-1 flex items-center gap-1 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-md z-10 animate-pulse font-medium">
                          <span>{viewers[0].name.split(' ')[0]} viewing</span>
                        </div>
                      )}

                      {/* Tags & Priority Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${priorityConfig.bg}`}
                        >
                          {priorityConfig.icon && <priorityConfig.icon className="w-3 h-3" />}
                          <span className="capitalize">{task.priority}</span>
                        </span>

                        {task.tags.length > 0 && (
                          <div className="flex items-center gap-1 overflow-hidden">
                            <span className="text-[11px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-800 truncate max-w-[100px]">
                              {task.tags[0]}
                            </span>
                            {task.tags.length > 1 && (
                              <span className="text-[10px] text-slate-500">+{task.tags.length - 1}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className={`text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 ${
                        task.status === 'done' ? 'line-through text-slate-400' : ''
                      }`}>
                        {task.title}
                      </h4>

                      {/* Description excerpt */}
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Subtasks Progress Bar (if task has subtasks) */}
                      {totalSub > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <div className="flex items-center gap-1">
                              <CheckSquare className="w-3 h-3 text-slate-400" />
                              <span>Subtasks</span>
                            </div>
                            <span className="font-mono">{subDone}/{totalSub} ({progressPct}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Footer: Due date, comments count, assignee avatar */}
                      <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          {task.dueDate && (
                            <span
                              className={`flex items-center gap-1 font-medium text-[11px] ${
                                isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-400'
                              }`}
                              title={isOverdue ? 'Task is overdue!' : `Due ${task.dueDate}`}
                            >
                              <Calendar className="w-3 h-3" />
                              <span>{task.dueDate.slice(5)}</span>
                            </span>
                          )}

                          {task.comments && task.comments.length > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400" title={`${task.comments.length} comments`}>
                              <MessageSquare className="w-3 h-3" />
                              <span>{task.comments.length}</span>
                            </span>
                          )}
                        </div>

                        {/* Assignee Avatar */}
                        <div className="flex items-center gap-1.5" title={`Assigned to ${task.assignee || 'Unassigned'}`}>
                          {task.assignee ? (
                            <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center text-[10px] font-bold">
                              {task.assignee.slice(0, 2).toUpperCase()}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Unassigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
