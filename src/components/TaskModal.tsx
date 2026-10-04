import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Task, TaskStatus, TaskPriority, SubTask } from '../types';
import {
  X,
  Trash2,
  Calendar,
  CheckSquare,
  Plus,
  MessageSquare,
  Tag,
  Clock,
  Send,
  AlertTriangle,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface TaskModalProps {
  taskId: string | null;
  onClose: () => void;
  isNew?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({ taskId, onClose, isNew = false }) => {
  const {
    workspace,
    activeProjectId,
    createTask,
    updateTask,
    deleteTask,
    addTaskComment,
    currentUser,
    onlinePresences,
  } = useWorkspace();

  const existingTask = taskId ? workspace.tasks.find(t => t.id === taskId) : null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(activeProjectId !== 'all' ? activeProjectId : (workspace.projects[0]?.id || 'proj-1'));
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignee, setAssignee] = useState(currentUser.name);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(4);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [commentText, setCommentText] = useState('');

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description || '');
      setProjectId(existingTask.projectId);
      setStatus(existingTask.status);
      setPriority(existingTask.priority);
      setAssignee(existingTask.assignee || '');
      setStartDate(existingTask.startDate || '');
      setDueDate(existingTask.dueDate || '');
      setEstimatedHours(existingTask.estimatedHours || 4);
      setTags(existingTask.tags || []);
      setSubtasks(existingTask.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setProjectId(activeProjectId !== 'all' ? activeProjectId : (workspace.projects[0]?.id || 'proj-1'));
      setStatus('todo');
      setPriority('medium');
      setAssignee(currentUser.name);
      setDueDate('');
      setEstimatedHours(4);
      setTags(['Feature']);
      setSubtasks([]);
    }
    titleRef.current?.focus();
  }, [existingTask, isNew, activeProjectId, workspace.projects, currentUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    if (!title.trim()) return;

    if (existingTask) {
      updateTask({
        ...existingTask,
        title: title.trim(),
        description: description.trim(),
        projectId,
        status,
        priority,
        assignee,
        startDate,
        dueDate,
        estimatedHours: Number(estimatedHours) || 0,
        tags,
        subtasks,
      });
    } else {
      createTask({
        projectId,
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignee,
        startDate,
        dueDate,
        estimatedHours: Number(estimatedHours) || 0,
        tags,
        subtasks,
        comments: [],
      });
    }
    onClose();
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (!existingTask) return;
    deleteTask(existingTask.id);
    onClose();
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const item: SubTask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: newSubtask.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, item]);
    setNewSubtask('');
  };

  const toggleSubtask = (subId: string) => {
    setSubtasks(subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s));
  };

  const removeSubtask = (subId: string) => {
    setSubtasks(subtasks.filter(s => s.id !== subId));
  };

  const handleAddTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setTags([...tags, newTag.trim()]);
    setNewTag('');
  };

  const removeTag = (t: string) => {
    setTags(tags.filter(item => item !== t));
  };

  const handlePostComment = () => {
    if (!commentText.trim() || !existingTask) return;
    addTaskComment(existingTask.id, commentText.trim());
    setCommentText('');
  };

  const subDone = subtasks.filter(s => s.completed).length;
  const progressPct = subtasks.length ? Math.round((subDone / subtasks.length) * 100) : (status === 'done' ? 100 : 0);

  // Other users currently viewing this task
  const viewers = onlinePresences.filter(p => p.activeTaskId === existingTask?.id && p.id !== currentUser.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full min-h-screen flex flex-col shadow-2xl text-slate-100"
        role="dialog"
      >
        {/* Top Header */}
        <div className="p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
              {isNew ? 'New Deliverable' : 'Task Details'}
            </span>
            {viewers.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-indigo-300 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                {viewers.map(v => v.name.split(' ')[0]).join(', ')} active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isNew && (
              confirmDelete ? (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-rose-300">Delete?</span>
                  <button
                    onClick={handleDelete}
                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Task Title
            </label>
            <input
              ref={titleRef}
              type="text"
              placeholder="e.g., Deploy production replica cluster"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3.5 py-2 text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Project & Assignee (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {workspace.projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Assignee
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {workspace.teamMembers.map(m => (
                  <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="done">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Timeline Process Days: Start Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Start Date (Gantt Schedule)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Target Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Description & Acceptance Criteria
            </label>
            <textarea
              rows={3}
              placeholder="Add comprehensive specs, technical constraints, links..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Subtasks Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Subtasks & Deliverables Checklist ({subDone}/{subtasks.length})
              </label>
              <span className="text-xs font-mono text-emerald-400 font-semibold">{progressPct}%</span>
            </div>

            {/* Mini Progress */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Subtasks list */}
            <div className="space-y-1.5 mb-2.5">
              {subtasks.map(st => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition"
                >
                  <label className="flex items-center gap-2.5 text-xs sm:text-sm cursor-pointer min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => toggleSubtask(st.id)}
                      className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span className={`truncate ${st.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                      {st.title}
                    </span>
                  </label>
                  <button
                    onClick={() => removeSubtask(st.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add subtask step and press Enter..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Tags & Labels
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {tags.map(t => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300"
                >
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>{t}</span>
                  <button
                    onClick={() => removeTag(t)}
                    className="text-slate-400 hover:text-rose-400 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-xs">
              <input
                type="text"
                placeholder="New tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddTag}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700"
              >
                Add Tag
              </button>
            </div>
          </div>

          {/* Real-Time Team Comments Thread */}
          {!isNew && existingTask && (
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Live Collaboration Comments ({existingTask.comments?.length || 0})
                </h4>
              </div>

              {/* Comments Feed */}
              <div className="space-y-2.5 mb-3 max-h-48 overflow-y-auto">
                {(!existingTask.comments || existingTask.comments.length === 0) ? (
                  <p className="text-xs text-slate-500 italic">No notes or comments yet. Post the first one.</p>
                ) : (
                  existingTask.comments.map(c => (
                    <div key={c.id} className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                            style={{ backgroundColor: c.authorAvatarColor || '#3b82f6' }}
                          >
                            {c.authorName.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-200">{c.authorName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 pl-7 leading-relaxed">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Post comment to team in real-time..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handlePostComment}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-slate-800 bg-slate-900/95 flex items-center justify-end gap-3 sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 transition active:scale-95"
          >
            {isNew ? 'Create Task' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
