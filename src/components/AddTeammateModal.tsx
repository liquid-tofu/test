import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  UserPlus,
  X,
  Mail,
  Briefcase,
  Laptop,
  Check,
  Sparkles,
  Users,
} from 'lucide-react';

interface AddTeammateModalProps {
  onClose: () => void;
}

const AVATAR_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#e11d48', // Rose
];

const SUGGESTED_ROLES = [
  'Full Stack Engineer',
  'Frontend Specialist',
  'Backend Architect',
  'Product Designer',
  'Engineering Manager',
  'DevOps & Cloud Engineer',
  'QA Automation Lead',
  'Technical PM',
];

const DEVICES = [
  'MacBook Pro',
  'Windows Workstation',
  'Linux Laptop',
  'iPad Pro',
  'Pixel 9 Pro',
  'Desktop Workstation',
];

export const AddTeammateModal: React.FC<AddTeammateModalProps> = ({ onClose }) => {
  const { addTeamMember, setCurrentUser } = useWorkspace();

  const [name, setName] = useState('');
  const [role, setRole] = useState('Full Stack Engineer');
  const [email, setEmail] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [device, setDevice] = useState(DEVICES[0]);
  const [switchNow, setSwitchNow] = useState(true);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!email || email.includes('@syncteam.dev')) {
      const clean = val.trim().toLowerCase().replace(/\s+/g, '.');
      setEmail(clean ? `${clean}@syncteam.dev` : '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMember = addTeamMember({
      name: name.trim(),
      role: role.trim() || 'Contributor',
      email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@syncteam.dev`,
      avatarColor,
      device,
    });

    if (switchNow) {
      setCurrentUser(newMember);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: avatarColor }}
            >
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Add Teammate to Workspace</h2>
              <p className="text-xs text-slate-400">Invite a collaborator to assign tasks and build together</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              autoFocus
            />
          </div>

          {/* Role with suggested chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Role / Title
            </label>
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="e.g. Lead Architect, UX Designer..."
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_ROLES.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`text-[11px] px-2 py-0.5 rounded-md transition ${
                    role === r
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 font-semibold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                placeholder="alex.morgan@syncteam.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Avatar Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Profile Accent Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {AVATAR_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setAvatarColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  {avatarColor === c && (
                    <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Device Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Primary Device
            </label>
            <select
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              {DEVICES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Switch persona option */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition">
              <input
                type="checkbox"
                checked={switchNow}
                onChange={(e) => setSwitchNow(e.target.checked)}
                className="rounded border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-200 block">Switch to this teammate immediately</span>
                <span className="text-slate-400">Allows you to test live collaborative updates and comments as this user</span>
              </div>
            </label>
          </div>

          {/* Submit & Cancel */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Teammate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
