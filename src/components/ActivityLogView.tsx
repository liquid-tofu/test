import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { History, Activity, MessageSquare, CheckCircle2, PlusCircle, Trash2, Edit3, ArrowRight } from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const { workspace } = useWorkspace();

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'created':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">Created</span>;
      case 'status_changed':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-800/40">Status Updated</span>;
      case 'commented':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/40">Comment</span>;
      case 'deleted':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/40">Deleted</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">Modified</span>;
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100 min-h-[calc(100vh-140px)]">
      <div className="max-w-4xl mx-auto space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Live Real-Time Activity Feed</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {workspace.activities.length} audit events logged
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-800/80">
          {workspace.activities.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No recent activity recorded.
            </div>
          ) : (
            workspace.activities.map(act => (
              <div key={act.id} className="p-4 hover:bg-slate-800/40 transition flex items-start gap-3.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5 shadow-sm"
                  style={{ backgroundColor: act.userColor || '#3b82f6' }}
                >
                  {act.userName.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-slate-200">{act.userName}</span>
                    {getActionBadge(act.action)}
                    <span className="text-xs text-slate-400">{timeAgo(act.timestamp)}</span>
                  </div>

                  <p className="text-xs font-medium text-slate-300 mt-1">
                    {act.targetType === 'task' ? 'Task: ' : 'Project: '}
                    <span className="text-white font-semibold">"{act.targetTitle}"</span>
                  </p>

                  {act.details && (
                    <p className="text-xs text-slate-400 mt-1 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 font-mono">
                      {act.details}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
