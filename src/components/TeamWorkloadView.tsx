import React, { useMemo } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Users, AlertCircle, CheckCircle2, Clock, ArrowRight, UserPlus } from 'lucide-react';
import { buildTeamWorkloadData, exportToExcel } from '../services/export';
import { TaskStatus } from '../types';

interface TeamWorkloadViewProps {
  onOpenAddTeammate?: () => void;
}

export const TeamWorkloadView: React.FC<TeamWorkloadViewProps> = ({ onOpenAddTeammate }) => {
  const { workspace, activeProjectId, updateTask, setSelectedTaskId } = useWorkspace();

  const filteredTasks = useMemo(() => {
    return activeProjectId && activeProjectId !== 'all'
      ? workspace.tasks.filter(t => t.projectId === activeProjectId)
      : workspace.tasks;
  }, [workspace.tasks, activeProjectId]);

  const workload = useMemo(() => {
    return buildTeamWorkloadData(filteredTasks, workspace.teamMembers);
  }, [filteredTasks, workspace.teamMembers]);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100 min-h-[calc(100vh-140px)]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h1 className="text-xl font-bold text-white tracking-tight">Team Workload & Capacity Management</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time resource balance, task delegations, and delivery risk prevention.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAddTeammate && (
              <button
                onClick={onOpenAddTeammate}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Teammate</span>
              </button>
            )}

            <button
              onClick={() => exportToExcel(workspace, activeProjectId)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition"
            >
              Export Team Roster (.xlsx)
            </button>
          </div>
        </div>

        {/* Member Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workload.map(member => {
            const memberTasks = filteredTasks.filter(t => (t.assignee || 'Unassigned') === member.name);
            const activeTasks = memberTasks.filter(t => t.status !== 'done');
            const doneTasks = memberTasks.filter(t => t.status === 'done');
            const pct = member.total ? Math.round((doneTasks.length / member.total) * 100) : 0;

            return (
              <div
                key={member.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-slate-100">{member.name}</h3>
                        <p className="text-xs text-slate-400">{member.role}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      member.loadStatus === 'Heavy Load'
                        ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                        : member.loadStatus === 'Available Capacity'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {member.loadStatus}
                    </span>
                  </div>

                  {/* Quick Metrics */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center text-xs">
                    <div className="bg-slate-950/50 p-2 rounded-lg">
                      <span className="text-slate-400 text-[10px] block">Total</span>
                      <span className="text-base font-bold font-mono text-white">{member.total}</span>
                    </div>
                    <div className="bg-slate-950/50 p-2 rounded-lg">
                      <span className="text-blue-400 text-[10px] block">Active</span>
                      <span className="text-base font-bold font-mono text-blue-400">{activeTasks.length}</span>
                    </div>
                    <div className="bg-slate-950/50 p-2 rounded-lg">
                      <span className="text-rose-400 text-[10px] block">Overdue</span>
                      <span className={`text-base font-bold font-mono ${member.overdue > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                        {member.overdue}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Delivery Completion</span>
                      <span className="font-mono font-medium text-slate-200">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Active Tasks List for this user */}
                  <div className="mt-4 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Current Tasks ({activeTasks.length})
                    </span>
                    {activeTasks.slice(0, 3).map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className="w-full p-2 rounded bg-slate-950/50 hover:bg-slate-800 border border-slate-800/80 text-left text-xs flex items-center justify-between gap-2 transition"
                      >
                        <span className="truncate text-slate-300 hover:text-white font-medium">
                          {t.title}
                        </span>
                        <span className="text-[10px] text-slate-500 flex-shrink-0 font-mono">
                          {t.status.replace('_', ' ')}
                        </span>
                      </button>
                    ))}
                    {activeTasks.length > 3 && (
                      <span className="text-[11px] text-slate-500 italic block text-right">
                        +{activeTasks.length - 3} more tasks
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
