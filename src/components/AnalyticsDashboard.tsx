import React, { useMemo, useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { TaskStatus, TaskPriority } from '../types';
import {
  BarChart3,
  PieChart as PieIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Download,
  Users,
  Activity,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { buildTeamWorkloadData, exportToExcel, exportToPdf } from '../services/export';

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: '#94a3b8' },
  todo: { label: 'To Do', color: '#64748b' },
  in_progress: { label: 'In Progress', color: '#3b82f6' },
  review: { label: 'In Review', color: '#8b5cf6' },
  done: { label: 'Completed', color: '#10b981' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  urgent: { label: 'Urgent', color: '#ef4444' },
  high: { label: 'High', color: '#f59e0b' },
  medium: { label: 'Medium', color: '#3b82f6' },
  low: { label: 'Low', color: '#64748b' },
};

export const AnalyticsDashboard: React.FC = () => {
  const { workspace, activeProjectId } = useWorkspace();
  const [hoveredStatus, setHoveredStatus] = useState<TaskStatus | null>(null);

  const filteredTasks = useMemo(() => {
    return activeProjectId && activeProjectId !== 'all'
      ? workspace.tasks.filter(t => t.projectId === activeProjectId)
      : workspace.tasks;
  }, [workspace.tasks, activeProjectId]);

  const activeProject = workspace.projects.find(p => p.id === activeProjectId);

  // Status Distribution
  const statusCounts = useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };
    filteredTasks.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [filteredTasks]);

  // Priority Distribution
  const priorityCounts = useMemo(() => {
    const counts: Record<TaskPriority, number> = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    filteredTasks.forEach(t => {
      counts[t.priority] = (counts[t.priority] || 0) + 1;
    });
    return counts;
  }, [filteredTasks]);

  const total = filteredTasks.length;
  const completed = statusCounts.done;
  const inProgress = statusCounts.in_progress;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  const overdueTasks = filteredTasks.filter(
    t => t.dueDate && t.status !== 'done' && new Date(t.dueDate).getTime() < Date.now()
  );
  const totalHours = filteredTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);

  const workloadData = useMemo(() => {
    return buildTeamWorkloadData(filteredTasks, workspace.teamMembers);
  }, [filteredTasks, workspace.teamMembers]);

  const maxMemberTotal = Math.max(1, ...workloadData.map(w => w.total));

  // Compute SVG Donut Chart Coordinates
  const donutSegments = useMemo(() => {
    if (total === 0) return [];
    let cumulative = 0;
    const radius = 54;
    const circumference = 2 * Math.PI * radius;

    return (Object.keys(STATUS_CONFIG) as TaskStatus[]).map(status => {
      const count = statusCounts[status];
      const fraction = count / total;
      const strokeDasharray = `${fraction * circumference} ${circumference}`;
      const strokeDashoffset = -cumulative * circumference;
      cumulative += fraction;

      return {
        status,
        label: STATUS_CONFIG[status].label,
        color: STATUS_CONFIG[status].color,
        count,
        pct: Math.round(fraction * 100),
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [statusCounts, total]);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100 min-h-[calc(100vh-140px)]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header with Export Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h1 className="text-xl font-bold text-white tracking-tight">
                {activeProject ? `${activeProject.name} • Executive Intelligence` : 'Workspace Analytics & Performance Reporting'}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time multi-dimensional tracking of delivery velocity, team load, and milestone progress.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToPdf(workspace, activeProjectId)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition"
            >
              <FileText className="w-4 h-4 text-rose-400" />
              <span>Executive PDF Report</span>
            </button>
            <button
              onClick={() => exportToExcel(workspace, activeProjectId)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Workload Matrix (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Action Items</p>
              <h3 className="text-2xl font-bold text-white mt-1 font-mono">{total}</h3>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Activity className="w-3 h-3 text-blue-400" />
                <span>Across {activeProject ? 'this project' : `${workspace.projects.length} projects`}</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Completion Velocity</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{completionRate}%</h3>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{completed} of {total} resolved</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Active Work in Flight</p>
              <h3 className="text-2xl font-bold text-blue-400 mt-1 font-mono">{inProgress}</h3>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-400" />
                <span>Currently in development</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Delivery Risk & Overdue</p>
              <h3 className={`text-2xl font-bold mt-1 font-mono ${overdueTasks.length > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                {overdueTasks.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                {overdueTasks.length > 0 ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span className="text-rose-400">Requires triage attention</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">100% on schedule</span>
                  </>
                )}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
              overdueTasks.length > 0
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Middle Tier: 2 Visual Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Status Donut Ring Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-blue-400" />
                  <h3 className="font-semibold text-sm text-slate-100">Status Allocation</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">{total} total</span>
              </div>

              {/* Donut SVG */}
              <div className="flex items-center justify-center py-4 relative">
                <svg width="170" height="170" viewBox="0 0 140 140" className="transform -rotate-90">
                  <circle
                    cx="70"
                    cy="70"
                    r="54"
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="18"
                  />
                  {donutSegments.map(seg => (
                    <circle
                      key={seg.status}
                      cx="70"
                      cy="70"
                      r="54"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="18"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      className="transition-all duration-500 hover:opacity-80"
                      onMouseEnter={() => setHoveredStatus(seg.status)}
                      onMouseLeave={() => setHoveredStatus(null)}
                    />
                  ))}
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold font-mono text-white">
                    {hoveredStatus ? statusCounts[hoveredStatus] : `${completionRate}%`}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {hoveredStatus ? STATUS_CONFIG[hoveredStatus].label : 'Done'}
                  </span>
                </div>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs">
              {donutSegments.map(seg => (
                <div
                  key={seg.status}
                  className={`flex items-center justify-between p-1.5 rounded transition ${
                    hoveredStatus === seg.status ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300'
                  }`}
                  onMouseEnter={() => setHoveredStatus(seg.status)}
                  onMouseLeave={() => setHoveredStatus(null)}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="truncate">{seg.label}</span>
                  </div>
                  <span className="font-mono text-slate-400 font-medium">{seg.count} ({seg.pct}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Matrix & Resource Allocation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-semibold text-sm text-slate-100">Team Workload Distribution</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> In Progress
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Done
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500" /> Review
                  </span>
                </div>
              </div>

              {/* Stacked Workload Bar Chart */}
              <div className="space-y-3.5 my-2">
                {workloadData.slice(0, 6).map(member => {
                  return (
                    <div key={member.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200">{member.name}</span>
                          <span className="text-[10px] text-slate-400 hidden sm:inline">({member.role})</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                          {member.overdue > 0 && (
                            <span className="text-rose-400 font-semibold">{member.overdue} overdue</span>
                          )}
                          <span className="text-slate-200 font-bold">{member.total} tasks</span>
                        </div>
                      </div>

                      {/* Stacked bar */}
                      <div className="w-full h-4 bg-slate-800 rounded-md overflow-hidden flex gap-0.5">
                        {member.byStatus.in_progress > 0 && (
                          <div
                            style={{ width: `${(member.byStatus.in_progress / maxMemberTotal) * 100}%` }}
                            className="bg-blue-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                            title={`In Progress: ${member.byStatus.in_progress}`}
                          >
                            {member.byStatus.in_progress}
                          </div>
                        )}
                        {member.byStatus.review > 0 && (
                          <div
                            style={{ width: `${(member.byStatus.review / maxMemberTotal) * 100}%` }}
                            className="bg-purple-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                            title={`In Review: ${member.byStatus.review}`}
                          >
                            {member.byStatus.review}
                          </div>
                        )}
                        {member.byStatus.todo > 0 && (
                          <div
                            style={{ width: `${(member.byStatus.todo / maxMemberTotal) * 100}%` }}
                            className="bg-slate-600 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                            title={`To Do: ${member.byStatus.todo}`}
                          >
                            {member.byStatus.todo}
                          </div>
                        )}
                        {member.byStatus.done > 0 && (
                          <div
                            style={{ width: `${(member.byStatus.done / maxMemberTotal) * 100}%` }}
                            className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                            title={`Done: ${member.byStatus.done}`}
                          >
                            {member.byStatus.done}
                          </div>
                        )}
                        {member.byStatus.backlog > 0 && (
                          <div
                            style={{ width: `${(member.byStatus.backlog / maxMemberTotal) * 100}%` }}
                            className="bg-slate-700 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                            title={`Backlog: ${member.byStatus.backlog}`}
                          >
                            {member.byStatus.backlog}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Priority summary banner */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded bg-slate-800/60 border border-slate-700/60">
                <span className="text-rose-400 font-semibold">Urgent</span>
                <div className="text-lg font-bold font-mono text-white mt-0.5">{priorityCounts.urgent}</div>
              </div>
              <div className="p-2 rounded bg-slate-800/60 border border-slate-700/60">
                <span className="text-amber-400 font-semibold">High</span>
                <div className="text-lg font-bold font-mono text-white mt-0.5">{priorityCounts.high}</div>
              </div>
              <div className="p-2 rounded bg-slate-800/60 border border-slate-700/60">
                <span className="text-blue-400 font-semibold">Medium</span>
                <div className="text-lg font-bold font-mono text-white mt-0.5">{priorityCounts.medium}</div>
              </div>
              <div className="p-2 rounded bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 font-semibold">Low</span>
                <div className="text-lg font-bold font-mono text-white mt-0.5">{priorityCounts.low}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Tier: Team Capacity & Workload Detailed Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-100">
                Team Workload & Capacity Utilization Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Monitor work volume distribution to prevent burnout and ensure on-time release.
              </p>
            </div>
            <button
              onClick={() => exportToExcel(workspace, activeProjectId)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Sheet</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                  <th className="py-2.5 px-4">Collaborator</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Active</th>
                  <th className="py-2.5 px-3 text-right">Done</th>
                  <th className="py-2.5 px-3 text-right">Overdue</th>
                  <th className="py-2.5 px-4">Completion %</th>
                  <th className="py-2.5 px-4">Load Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {workloadData.map(member => {
                  const pct = member.total ? Math.round((member.byStatus.done / member.total) * 100) : 0;
                  return (
                    <tr key={member.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {member.name}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{member.role}</td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-200">{member.total}</td>
                      <td className="py-3 px-3 text-right font-mono text-blue-400 font-medium">
                        {member.byStatus.in_progress + member.byStatus.todo}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 font-medium">
                        {member.byStatus.done}
                      </td>
                      <td className={`py-3 px-3 text-right font-mono font-semibold ${
                        member.overdue > 0 ? 'text-rose-400' : 'text-slate-500'
                      }`}>
                        {member.overdue}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-slate-300">{pct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          member.loadStatus === 'Heavy Load'
                            ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                            : member.loadStatus === 'Needs Assignment'
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                            : member.loadStatus === 'Available Capacity'
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {member.loadStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
