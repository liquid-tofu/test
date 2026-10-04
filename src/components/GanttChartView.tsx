import React, { useState, useMemo, useRef } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Task, TaskStatus } from '../types';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter,
  Layers,
  ArrowRight,
  MoveRight,
  Sparkles,
} from 'lucide-react';

const STATUS_COLORS: Record<TaskStatus, { bg: string; border: string; text: string }> = {
  backlog: { bg: 'bg-slate-700/80', border: 'border-slate-600', text: 'text-slate-300' },
  todo: { bg: 'bg-slate-600/90', border: 'border-slate-500', text: 'text-slate-200' },
  in_progress: { bg: 'bg-blue-600/90', border: 'border-blue-400', text: 'text-white' },
  review: { bg: 'bg-purple-600/90', border: 'border-purple-400', text: 'text-white' },
  done: { bg: 'bg-emerald-600/90', border: 'border-emerald-400', text: 'text-white' },
};

type TimelineSpan = 14 | 30 | 60;

export const GanttChartView: React.FC = () => {
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

  const [spanDays, setSpanDays] = useState<TimelineSpan>(30);
  const [dayOffset, setDayOffset] = useState<number>(-5); // start 5 days before today by default
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Normalize today at midnight
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayStr = useMemo(() => {
    return today.toISOString().slice(0, 10);
  }, [today]);

  // Generate timeline days array
  const timelineDays = useMemo(() => {
    const days: { date: Date; dateStr: string; dayNum: number; dayOfWeek: string; isToday: boolean; isWeekend: boolean }[] = [];
    const start = new Date(today);
    start.setDate(start.getDate() + dayOffset);

    for (let i = 0; i < spanDays; i++) {
      const cur = new Date(start);
      cur.setDate(cur.getDate() + i);
      const dateStr = cur.toISOString().slice(0, 10);
      const isToday = dateStr === todayStr;
      const dayOfWeekNum = cur.getDay();
      const isWeekend = dayOfWeekNum === 0 || dayOfWeekNum === 6;
      const daysShort = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

      days.push({
        date: cur,
        dateStr,
        dayNum: cur.getDate(),
        dayOfWeek: daysShort[dayOfWeekNum],
        isToday,
        isWeekend,
      });
    }
    return days;
  }, [today, dayOffset, spanDays, todayStr]);

  const timelineStartStr = timelineDays[0]?.dateStr || todayStr;
  const timelineEndStr = timelineDays[timelineDays.length - 1]?.dateStr || todayStr;

  // Filter tasks
  const projMap = useMemo(() => new Map(workspace.projects.map(p => [p.id, p])), [workspace.projects]);

  const filteredTasks = useMemo(() => {
    return workspace.tasks.filter(t => {
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
  }, [workspace.tasks, activeProjectId, filterStatus, filterPriority, filterAssignee, searchQuery]);

  // Calculate task process day and coordinates
  const taskGanttItems = useMemo(() => {
    return filteredTasks.map(task => {
      // Determine effective start date
      let startStr = task.startDate;
      if (!startStr) {
        // Fallback: created date or 3 days before due date
        if (task.dueDate) {
          const d = new Date(task.dueDate);
          d.setDate(d.getDate() - 4);
          startStr = d.toISOString().slice(0, 10);
        } else {
          startStr = new Date(task.createdAt).toISOString().slice(0, 10);
        }
      }

      // Determine effective due date
      let dueStr = task.dueDate;
      if (!dueStr) {
        const d = new Date(startStr);
        d.setDate(d.getDate() + 5);
        dueStr = d.toISOString().slice(0, 10);
      }

      // If start is after due, adjust
      if (startStr > dueStr) {
        dueStr = startStr;
      }

      const startDate = new Date(startStr);
      const dueDate = new Date(dueStr);
      const totalDurationDays = Math.max(1, Math.round((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      // Calculate Process Day
      let currentProcessDay = 0;
      let processDayStatus: 'not_started' | 'in_process' | 'completed' | 'overdue' = 'in_process';

      if (task.status === 'done') {
        currentProcessDay = totalDurationDays;
        processDayStatus = 'completed';
      } else if (today < startDate) {
        currentProcessDay = 0;
        processDayStatus = 'not_started';
      } else if (today > dueDate) {
        currentProcessDay = totalDurationDays;
        processDayStatus = 'overdue';
      } else {
        currentProcessDay = Math.min(
          totalDurationDays,
          Math.max(1, Math.round((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        );
        processDayStatus = 'in_process';
      }

      // Calculate bar grid position
      const firstTimelineDate = timelineDays[0].date.getTime();
      const oneDayMs = 1000 * 60 * 60 * 24;

      const startIndex = Math.round((startDate.getTime() - firstTimelineDate) / oneDayMs);
      const endIndex = Math.round((dueDate.getTime() - firstTimelineDate) / oneDayMs);

      const isVisible = !(endIndex < 0 || startIndex >= spanDays);
      const clampStart = Math.max(0, startIndex);
      const clampEnd = Math.min(spanDays - 1, endIndex);
      const spanCols = Math.max(1, clampEnd - clampStart + 1);

      const subDone = task.subtasks.filter(s => s.completed).length;
      const progressPct = task.status === 'done'
        ? 100
        : task.subtasks.length
        ? Math.round((subDone / task.subtasks.length) * 100)
        : Math.round((currentProcessDay / totalDurationDays) * 100);

      return {
        task,
        startStr,
        dueStr,
        totalDurationDays,
        currentProcessDay,
        processDayStatus,
        progressPct,
        clampStart,
        spanCols,
        isVisible,
      };
    });
  }, [filteredTasks, timelineDays, spanDays, today]);

  // Schedule KPIs
  const activeProcessCount = taskGanttItems.filter(i => i.processDayStatus === 'in_process').length;
  const overdueCount = taskGanttItems.filter(i => i.processDayStatus === 'overdue').length;
  const completedCount = taskGanttItems.filter(i => i.processDayStatus === 'completed').length;
  const onTrackRate = taskGanttItems.length ? Math.round(((taskGanttItems.length - overdueCount) / taskGanttItems.length) * 100) : 100;

  // Shift task dates (for interactive reschedule directly on Gantt)
  const shiftTaskDays = (task: Task, daysDelta: number) => {
    const curStart = task.startDate || new Date(task.createdAt).toISOString().slice(0, 10);
    const curDue = task.dueDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const s = new Date(curStart);
    s.setDate(s.getDate() + daysDelta);
    const d = new Date(curDue);
    d.setDate(d.getDate() + daysDelta);

    updateTask({
      ...task,
      startDate: s.toISOString().slice(0, 10),
      dueDate: d.toISOString().slice(0, 10),
    });
  };

  const jumpToToday = () => {
    setDayOffset(-5);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100 min-h-[calc(100vh-140px)] flex flex-col space-y-5">
      
      {/* Top Header with Process Day Overview & Controls */}
      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Gantt Project Timeline & Process Day Tracking
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Day-by-day execution roadmap showing task process days, active duration spans, and delivery milestones.
          </p>
        </div>

        {/* Controls: Zoom, Navigation, Jump to Today */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time range zoom */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setSpanDays(14)}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                spanDays === 14 ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => setSpanDays(30)}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                spanDays === 30 ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setSpanDays(60)}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                spanDays === 60 ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              60 Days
            </button>
          </div>

          {/* Timeline Pan Controls */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setDayOffset(prev => prev - 7)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Pan 1 week earlier"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={jumpToToday}
              className="px-2.5 py-1 text-xs font-semibold text-blue-400 hover:text-blue-300 rounded hover:bg-slate-800 transition"
              title="Center timeline on Today"
            >
              Today
            </button>
            <button
              onClick={() => setDayOffset(prev => prev + 7)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Pan 1 week later"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Process Day KPI Ribbon */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Today's Date</span>
            <span className="text-base font-bold text-white font-mono">{todayStr}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Active In-Process</span>
            <span className="text-base font-bold text-blue-400 font-mono">{activeProcessCount} tasks</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <CalendarRange className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Schedule Health</span>
            <span className="text-base font-bold text-emerald-400 font-mono">{onTrackRate}% On Schedule</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Overdue Slippage</span>
            <span className={`text-base font-bold font-mono ${overdueCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {overdueCount} Delayed
            </span>
          </div>
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
            overdueCount > 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Gantt Grid Container */}
      <div className="max-w-7xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
        
        {/* Gantt Header */}
        <div className="grid grid-cols-12 bg-slate-950 border-b border-slate-800 text-xs">
          
          {/* Left info column: Task, Assignee, Process Day Status */}
          <div className="col-span-12 md:col-span-4 p-3 border-r border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">Deliverable / Task</span>
              <span className="text-[11px] text-slate-500">({taskGanttItems.length})</span>
            </div>
            <span className="font-semibold text-slate-400 text-[11px]">Process Day</span>
          </div>

          {/* Right: Days scale */}
          <div className="col-span-12 md:col-span-8 overflow-x-auto select-none" ref={timelineScrollRef}>
            <div
              className="grid text-center font-mono text-[11px]"
              style={{ gridTemplateColumns: `repeat(${spanDays}, minmax(32px, 1fr))` }}
            >
              {timelineDays.map((d) => (
                <div
                  key={d.dateStr}
                  className={`py-2 px-0.5 border-r border-slate-800 flex flex-col items-center justify-center transition-colors ${
                    d.isToday
                      ? 'bg-blue-600/20 text-blue-300 font-bold border-blue-500/40'
                      : d.isWeekend
                      ? 'bg-slate-950/90 text-slate-500'
                      : 'text-slate-400'
                  }`}
                  title={`${d.dateStr} (${d.dayOfWeek})`}
                >
                  <span className="text-[10px] uppercase font-sans tracking-tight">{d.dayOfWeek}</span>
                  <span className={`text-xs ${d.isToday ? 'text-blue-300 font-bold' : 'text-slate-200'}`}>
                    {d.dayNum}
                  </span>
                  {d.isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-0.5 animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gantt Rows */}
        <div className="divide-y divide-slate-800/80 max-h-[620px] overflow-y-auto">
          {taskGanttItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No deliverables match your current filter criteria.
            </div>
          ) : (
            taskGanttItems.map(({ task, startStr, dueStr, totalDurationDays, currentProcessDay, processDayStatus, progressPct, clampStart, spanCols, isVisible }) => {
              const project = projMap.get(task.projectId);
              const statusStyle = STATUS_COLORS[task.status];

              return (
                <div key={task.id} className="grid grid-cols-12 hover:bg-slate-800/30 transition group items-center">
                  
                  {/* Left Column: Task Name, Project dot, Assignee, Process Day Badge */}
                  <div className="col-span-12 md:col-span-4 p-3 border-r border-slate-800 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`text-left text-xs font-semibold text-slate-200 hover:text-blue-400 transition truncate block w-full ${
                          task.status === 'done' ? 'line-through text-slate-400' : ''
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </button>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        {project && (
                          <span className="flex items-center gap-1 font-medium truncate max-w-[120px]">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                            <span>{project.name}</span>
                          </span>
                        )}
                        <span>•</span>
                        <span className="truncate max-w-[90px]">{task.assignee || 'Unassigned'}</span>
                      </div>
                    </div>

                    {/* Process Day Indicator */}
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                        processDayStatus === 'completed'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                          : processDayStatus === 'overdue'
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                          : processDayStatus === 'in_process'
                          ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {processDayStatus === 'completed'
                          ? 'Done'
                          : processDayStatus === 'not_started'
                          ? 'Not Started'
                          : `Day ${currentProcessDay} / ${totalDurationDays}`}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {totalDurationDays}d total
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Timeline Grid & Interactive Gantt Bar */}
                  <div className="col-span-12 md:col-span-8 p-1.5 relative overflow-hidden">
                    
                    {/* Background Grid Lines for days */}
                    <div
                      className="absolute inset-0 grid pointer-events-none"
                      style={{ gridTemplateColumns: `repeat(${spanDays}, minmax(32px, 1fr))` }}
                    >
                      {timelineDays.map((d) => (
                        <div
                          key={d.dateStr}
                          className={`h-full border-r border-slate-800/50 ${
                            d.isToday ? 'bg-blue-500/10' : d.isWeekend ? 'bg-slate-950/40' : ''
                          }`}
                        />
                      ))}
                    </div>

                    {/* Gantt Bar Grid Container */}
                    <div
                      className="relative h-10 w-full grid items-center"
                      style={{ gridTemplateColumns: `repeat(${spanDays}, minmax(32px, 1fr))` }}
                    >
                      {isVisible ? (
                        <div
                          style={{
                            gridColumnStart: clampStart + 1,
                            gridColumnEnd: `span ${spanCols}`,
                          }}
                          className="relative h-8 rounded-lg shadow-md cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg group/bar z-10 overflow-hidden"
                          onClick={() => setSelectedTaskId(task.id)}
                          title={`${task.title} | Process Day: ${currentProcessDay} of ${totalDurationDays} | Start: ${startStr} | Due: ${dueStr}`}
                        >
                          {/* Base Bar with Status Color */}
                          <div className={`w-full h-full border ${statusStyle.bg} ${statusStyle.border} rounded-lg flex items-center px-2.5 justify-between gap-2 overflow-hidden relative`}>
                            
                            {/* Inner Progress Fill */}
                            <div
                              className="absolute left-0 top-0 bottom-0 bg-white/20 pointer-events-none transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />

                            {/* Label inside the bar */}
                            <div className="relative z-10 flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-xs text-white truncate max-w-[140px] drop-shadow-sm">
                                {task.title}
                              </span>
                            </div>

                            {/* Process Day / Duration Tag inside Bar */}
                            <div className="relative z-10 flex items-center gap-1 font-mono text-[10px] text-white/90 font-medium flex-shrink-0 bg-black/30 px-1.5 py-0.5 rounded">
                              <span>
                                {task.status === 'done' ? '100%' : `Day ${currentProcessDay}/${totalDurationDays}`}
                              </span>
                            </div>
                          </div>

                          {/* Quick Shift Handle Controls on Hover */}
                          <div
                            className="absolute -top-1 -right-1 hidden group-hover/bar:flex items-center gap-0.5 bg-slate-900 border border-slate-700 rounded shadow-md z-20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => shiftTaskDays(task, -1)}
                              className="px-1 text-[10px] text-slate-300 hover:text-white"
                              title="Shift schedule 1 day earlier"
                            >
                              -1d
                            </button>
                            <button
                              onClick={() => shiftTaskDays(task, 1)}
                              className="px-1 text-[10px] text-slate-300 hover:text-white"
                              title="Shift schedule 1 day later"
                            >
                              +1d
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="h-7 border border-dashed border-slate-700/60 rounded flex items-center justify-center text-[10px] text-slate-500 font-mono italic"
                          style={{ gridColumn: '1 / -1' }}
                        >
                          Scheduled outside current timeline span ({startStr} to {dueStr})
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Gantt Legend Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-300">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-purple-600" />
              <span>In Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-600" />
              <span>To Do / Backlog</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <span>Red/Blue vertical line marks Current Process Day (Today)</span>
          </div>
        </div>

      </div>

    </div>
  );
};
