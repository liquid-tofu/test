import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  Wifi,
  ExternalLink,
  Users,
  Sparkles,
  Smartphone,
  Laptop,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { wsService } from '../services/websocket';

export const CollaboratorBar: React.FC = () => {
  const {
    workspace,
    currentUser,
    setCurrentUser,
    onlinePresences,
    connectionStatus,
    latencyMs,
    resetWorkspace,
  } = useWorkspace();

  const [confirmReset, setConfirmReset] = useState(false);

  const simulateRemoteUpdate = () => {
    // Pick another teammate persona
    const otherMember = workspace.teamMembers.find(m => m.id !== currentUser.id) || workspace.teamMembers[1];
    if (!otherMember) return;

    // Pick an existing task or create one from that teammate
    const targetTask = workspace.tasks[0];
    if (targetTask) {
      const now = Date.now();
      const updatedStatus = targetTask.status === 'done' ? 'in_progress' : 'done';
      const updatedTask = {
        ...targetTask,
        status: updatedStatus,
        updatedAt: now,
      };

      wsService.send({
        type: 'task:updated',
        payload: {
          task: updatedTask,
          activity: {
            id: `act-${now}`,
            userId: otherMember.id,
            userName: otherMember.name,
            userColor: otherMember.avatarColor,
            action: 'status_changed',
            targetType: 'task',
            targetTitle: targetTask.title,
            details: `Simulated live update by ${otherMember.name}: marked as ${updatedStatus.toUpperCase()}`,
            timestamp: now,
          },
        },
      });
    }
  };

  return (
    <aside aria-label="Collaboration & Cloud Sync Panel" className="bg-slate-900/95 border-t border-slate-800 text-slate-300 text-xs py-2 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Active collaborators & presence */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Collaborators:</span>
            <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              {onlinePresences.length} online
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-slate-400 text-[11px]">
            <span>•</span>
            <span>You are: <b className="text-white">{currentUser.name}</b> ({currentUser.role})</span>
          </div>
        </div>

        {/* Right: Real-time Testing Tools */}
        <div className="flex items-center gap-2">
          {/* Simulate Remote Collaborator Event */}
          <button
            onClick={simulateRemoteUpdate}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Simulate a remote teammate making an edit to test live sync"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Simulate Teammate Edit</span>
          </button>

          {/* Reset Workspace Demo Data */}
          {confirmReset ? (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-amber-300">Reset?</span>
              <button
                onClick={() => {
                  resetWorkspace();
                  setConfirmReset(false);
                }}
                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
              title="Reset workspace to default demo state"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Reset Sample Data</span>
            </button>
          )}
        </div>

      </div>
    </aside>
  );
};
