import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Project } from '../types';
import { X, Trash2, FolderPlus, Copy } from 'lucide-react';

interface ProjectModalProps {
  project?: Project | null;
  onClose: () => void;
}

const PROJECT_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b', // slate
];

const CATEGORIES = [
  'Backend & Cloud',
  'Product & Mobile',
  'Frontend & Design',
  'Security & DevOps',
  'Marketing & Growth',
  'Operations',
];

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  const { createProject, updateProject, deleteProject, duplicateProject } = useWorkspace();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_PALETTE[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [deadline, setDeadline] = useState('');
  const [budgetHours, setBudgetHours] = useState(80);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setColor(project.color || PROJECT_PALETTE[0]);
      setCategory(project.category || CATEGORIES[0]);
      setDeadline(project.deadline || '');
      setBudgetHours(project.budgetHours || 80);
    } else {
      setName('');
      setDescription('');
      setColor(PROJECT_PALETTE[Math.floor(Math.random() * PROJECT_PALETTE.length)]);
      setCategory(CATEGORIES[0]);
      setDeadline('');
      setBudgetHours(80);
    }
  }, [project]);

  const handleSave = () => {
    if (!name.trim()) return;

    if (project) {
      updateProject({
        ...project,
        name: name.trim(),
        description: description.trim(),
        color,
        category,
        deadline,
        budgetHours: Number(budgetHours) || 0,
      });
    } else {
      createProject({
        name: name.trim(),
        description: description.trim(),
        color,
        category,
        deadline,
        budgetHours: Number(budgetHours) || 0,
      });
    }
    onClose();
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (!project) return;
    deleteProject(project.id);
    onClose();
  };

  const handleDuplicate = () => {
    if (!project) return;
    duplicateProject(project.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100 space-y-5 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: color }}>
              <FolderPlus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              {project ? 'Project Settings' : 'Create New Project'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Name input */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Project Name
          </label>
          <input
            type="text"
            placeholder="e.g. NextGen Microservices Migration"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        {/* Color Palette Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Brand Color Accent
          </label>
          <div className="flex items-center gap-2.5">
            {PROJECT_PALETTE.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110 opacity-80'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Category & Budget Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Target Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Project Scope & Objective
          </label>
          <textarea
            rows={2}
            placeholder="Key milestones, business goals, cross-team objectives..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div>
            {project && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition"
                  title="Duplicate project and all tasks"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>
                {confirmDelete ? (
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-rose-300">Delete Project?</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition active:scale-95"
            >
              {project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
