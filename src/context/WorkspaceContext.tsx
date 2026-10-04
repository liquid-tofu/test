import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  WorkspaceData,
  Task,
  Project,
  ActivityItem,
  TeamMember,
  UserPresence,
  TaskStatus,
  TaskPriority,
  ViewMode,
  WebSocketMessage,
} from '../types';
import { wsService } from '../services/websocket';

interface WorkspaceContextType {
  workspace: WorkspaceData;
  isLoading: boolean;
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentUser: TeamMember;
  setCurrentUser: (member: TeamMember) => void;
  onlinePresences: UserPresence[];
  connectionStatus: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
  latencyMs: number;
  
  // Search & Filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterStatus: TaskStatus | 'all';
  setFilterStatus: (s: TaskStatus | 'all') => void;
  filterPriority: TaskPriority | 'all';
  setFilterPriority: (p: TaskPriority | 'all') => void;
  filterAssignee: string | 'all';
  setFilterAssignee: (a: string | 'all') => void;

  // Task Mutations
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  addTaskComment: (taskId: string, text: string) => void;
  toggleTaskStatus: (taskId: string) => void;

  // Project Mutations
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  duplicateProject: (projectId: string) => void;

  // Team Mutations
  addTeamMember: (member: Omit<TeamMember, 'id'>) => TeamMember;

  // Workspace actions
  resetWorkspace: () => Promise<void>;
  
  // Active task drawer/modal
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

const DEFAULT_WORKSPACE: WorkspaceData = {
  projects: [],
  tasks: [],
  activities: [],
  teamMembers: [],
  lastSync: Date.now(),
};

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<WorkspaceData>(DEFAULT_WORKSPACE);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [onlinePresences, setOnlinePresences] = useState<UserPresence[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'reconnecting' | 'disconnected'>('connecting');
  const [latencyMs, setLatencyMs] = useState(0);

  // Current persona simulation (user can switch devices/names to test real-time collaboration)
  const [currentUser, setCurrentUser] = useState<TeamMember>({
    id: 'usr-1',
    name: 'Savin Ngoeurm',
    role: 'Lead Architect',
    email: 'savinngoeurm@gmail.com',
    avatarColor: '#3b82f6',
    device: 'Desktop Browser',
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string | 'all'>('all');

  // Initial fetch and WebSocket connection
  useEffect(() => {
    // 1. Fetch initial state via REST
    fetch('/api/workspace')
      .then(res => res.json())
      .then((data: WorkspaceData) => {
        if (data && Array.isArray(data.projects)) {
          setWorkspace(data);
          if (data.teamMembers?.length > 0 && !workspace.teamMembers?.length) {
            const found = data.teamMembers.find(m => m.id === currentUser.id);
            if (found) setCurrentUser(found);
          }
        }
      })
      .catch(err => {
        console.warn('Initial REST fetch failed, waiting for WebSocket init:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // 2. Connect WebSocket
    wsService.connect();

    const unsubStatus = wsService.onStatusChange((status, latency) => {
      setConnectionStatus(status);
      setLatencyMs(latency);
    });

    const unsubMsg = wsService.onMessage((msg: WebSocketMessage) => {
      switch (msg.type) {
        case 'init':
          if (msg.payload?.workspace) {
            setWorkspace(msg.payload.workspace);
            setIsLoading(false);
          }
          if (msg.payload?.presences) {
            setOnlinePresences(msg.payload.presences);
          }
          break;

        case 'presence:list':
          if (Array.isArray(msg.payload)) {
            setOnlinePresences(msg.payload);
          }
          break;

        case 'task:created': {
          const newTask: Task = msg.payload.task;
          if (newTask) {
            setWorkspace(prev => ({
              ...prev,
              tasks: prev.tasks.some(t => t.id === newTask.id) ? prev.tasks : [newTask, ...prev.tasks],
              activities: msg.payload.activity ? [msg.payload.activity, ...prev.activities] : prev.activities,
              lastSync: Date.now(),
            }));
          }
          break;
        }

        case 'task:updated': {
          const updated: Task = msg.payload.task;
          if (updated) {
            setWorkspace(prev => ({
              ...prev,
              tasks: prev.tasks.map(t => (t.id === updated.id ? updated : t)),
              activities: msg.payload.activity ? [msg.payload.activity, ...prev.activities] : prev.activities,
              lastSync: Date.now(),
            }));
          }
          break;
        }

        case 'task:deleted': {
          const taskId: string = msg.payload.taskId;
          setWorkspace(prev => ({
            ...prev,
            tasks: prev.tasks.filter(t => t.id !== taskId),
            activities: msg.payload.activity ? [msg.payload.activity, ...prev.activities] : prev.activities,
            lastSync: Date.now(),
          }));
          break;
        }

        case 'task:reordered': {
          const reordered: Task[] = msg.payload.tasks;
          if (Array.isArray(reordered)) {
            const map = new Map(reordered.map(t => [t.id, t]));
            setWorkspace(prev => ({
              ...prev,
              tasks: prev.tasks.map(t => map.get(t.id) || t),
              lastSync: Date.now(),
            }));
          }
          break;
        }

        case 'task:comment': {
          const { taskId, comment, activity } = msg.payload;
          setWorkspace(prev => ({
            ...prev,
            tasks: prev.tasks.map(t => {
              if (t.id === taskId) {
                return {
                  ...t,
                  comments: [...(t.comments || []), comment],
                  updatedAt: Date.now(),
                };
              }
              return t;
            }),
            activities: activity ? [activity, ...prev.activities] : prev.activities,
            lastSync: Date.now(),
          }));
          break;
        }

        case 'project:created': {
          const newProj: Project = msg.payload.project;
          if (newProj) {
            setWorkspace(prev => ({
              ...prev,
              projects: prev.projects.some(p => p.id === newProj.id) ? prev.projects : [...prev.projects, newProj],
              activities: msg.payload.activity ? [msg.payload.activity, ...prev.activities] : prev.activities,
              lastSync: Date.now(),
            }));
          }
          break;
        }

        case 'project:updated': {
          const updatedProj: Project = msg.payload.project;
          if (updatedProj) {
            setWorkspace(prev => ({
              ...prev,
              projects: prev.projects.map(p => (p.id === updatedProj.id ? updatedProj : p)),
              activities: msg.payload.activity ? [msg.payload.activity, ...prev.activities] : prev.activities,
              lastSync: Date.now(),
            }));
          }
          break;
        }

        case 'project:deleted': {
          const projId: string = msg.payload.projectId;
          setWorkspace(prev => ({
            ...prev,
            projects: prev.projects.filter(p => p.id !== projId),
            tasks: prev.tasks.filter(t => t.projectId !== projId),
            lastSync: Date.now(),
          }));
          break;
        }

        case 'member:created': {
          const member: TeamMember = msg.payload.member;
          if (member) {
            setWorkspace(prev => ({
              ...prev,
              teamMembers: prev.teamMembers.some(m => m.id === member.id) ? prev.teamMembers : [...prev.teamMembers, member],
              activities: msg.payload.activity ? [msg.payload.activity, ...prev.activities] : prev.activities,
              lastSync: Date.now(),
            }));
          }
          break;
        }
      }
    });

    return () => {
      unsubStatus();
      unsubMsg();
    };
  }, []);

  // Update presence when user, active project, or active task changes
  useEffect(() => {
    wsService.updatePresence({
      name: currentUser.name,
      avatarColor: currentUser.avatarColor,
      device: currentUser.device || 'Desktop Browser',
      activeProjectId,
      activeTaskId: selectedTaskId,
    });
  }, [currentUser, activeProjectId, selectedTaskId]);

  /* ---------------- Task Mutations ---------------- */

  const createTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    const now = Date.now();
    const newTask: Task = {
      ...taskData,
      id: `task-${now}-${Math.random().toString(36).slice(2, 6)}`,
      order: 0,
      createdAt: now,
      updatedAt: now,
      comments: taskData.comments || [],
      subtasks: taskData.subtasks || [],
      tags: taskData.tags || [],
    };

    const activity: ActivityItem = {
      id: `act-${now}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: currentUser.avatarColor,
      action: 'created',
      targetType: 'task',
      targetTitle: newTask.title,
      details: `Created in ${workspace.projects.find(p => p.id === newTask.projectId)?.name || 'Project'}`,
      timestamp: now,
    };

    // Optimistic update
    setWorkspace(prev => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
      activities: [activity, ...prev.activities],
      lastSync: now,
    }));

    // Broadcast through WebSocket
    wsService.send({
      type: 'task:created',
      payload: { task: newTask, activity },
    });
  }, [currentUser, workspace.projects]);

  const updateTask = useCallback((updated: Task) => {
    const now = Date.now();
    const existing = workspace.tasks.find(t => t.id === updated.id);
    const statusChanged = existing && existing.status !== updated.status;
    const isCompleted = updated.status === 'done';

    if (statusChanged && isCompleted) {
      updated.completedAt = now;
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.8 },
      });
    }

    updated.updatedAt = now;

    let actionType: ActivityItem['action'] = 'updated';
    let details = 'Task details updated';
    if (statusChanged) {
      actionType = 'status_changed';
      details = `Status updated to ${updated.status.replace('_', ' ').toUpperCase()}`;
    }

    const activity: ActivityItem = {
      id: `act-${now}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: currentUser.avatarColor,
      action: actionType,
      targetType: 'task',
      targetTitle: updated.title,
      details,
      timestamp: now,
    };

    // Optimistic
    setWorkspace(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === updated.id ? updated : t)),
      activities: [activity, ...prev.activities],
      lastSync: now,
    }));

    wsService.send({
      type: 'task:updated',
      payload: { task: updated, activity },
    });
  }, [currentUser, workspace.tasks]);

  const deleteTask = useCallback((taskId: string) => {
    const task = workspace.tasks.find(t => t.id === taskId);
    const now = Date.now();

    const activity: ActivityItem = {
      id: `act-${now}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: currentUser.avatarColor,
      action: 'deleted',
      targetType: 'task',
      targetTitle: task ? task.title : 'Task',
      timestamp: now,
    };

    // Optimistic
    setWorkspace(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
      activities: [activity, ...prev.activities],
      lastSync: now,
    }));

    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }

    wsService.send({
      type: 'task:deleted',
      payload: { taskId, activity },
    });
  }, [currentUser, workspace.tasks, selectedTaskId]);

  const reorderTasks = useCallback((reordered: Task[]) => {
    // Optimistic
    setWorkspace(prev => {
      const map = new Map(reordered.map(t => [t.id, t]));
      return {
        ...prev,
        tasks: prev.tasks.map(t => map.get(t.id) || t),
        lastSync: Date.now(),
      };
    });

    wsService.send({
      type: 'task:reordered',
      payload: { tasks: reordered },
    });
  }, []);

  const addTaskComment = useCallback((taskId: string, text: string) => {
    if (!text.trim()) return;
    const now = Date.now();
    const comment = {
      id: `c-${now}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatarColor: currentUser.avatarColor,
      text: text.trim(),
      createdAt: now,
    };

    const task = workspace.tasks.find(t => t.id === taskId);
    const activity: ActivityItem = {
      id: `act-${now}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: currentUser.avatarColor,
      action: 'commented',
      targetType: 'task',
      targetTitle: task ? task.title : 'Task',
      details: `Added note: "${text.slice(0, 40)}${text.length > 40 ? '...' : ''}"`,
      timestamp: now,
    };

    setWorkspace(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            comments: [...(t.comments || []), comment],
            updatedAt: now,
          };
        }
        return t;
      }),
      activities: [activity, ...prev.activities],
      lastSync: now,
    }));

    wsService.send({
      type: 'task:comment',
      payload: { taskId, comment, activity },
    });
  }, [currentUser, workspace.tasks]);

  const toggleTaskStatus = useCallback((taskId: string) => {
    const task = workspace.tasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    updateTask({
      ...task,
      status: newStatus,
    });
  }, [workspace.tasks, updateTask]);

  /* ---------------- Project Mutations ---------------- */

  const createProject = useCallback((projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const now = Date.now();
    const id = `proj-${now}-${Math.random().toString(36).slice(2, 6)}`;
    const newProj: Project = {
      ...projectData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const activity: ActivityItem = {
      id: `act-${now}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: currentUser.avatarColor,
      action: 'created',
      targetType: 'project',
      targetTitle: newProj.name,
      timestamp: now,
    };

    setWorkspace(prev => ({
      ...prev,
      projects: [...prev.projects, newProj],
      activities: [activity, ...prev.activities],
      lastSync: now,
    }));

    wsService.send({
      type: 'project:created',
      payload: { project: newProj, activity },
    });

    setActiveProjectId(id);
    return id;
  }, [currentUser]);

  const updateProject = useCallback((updated: Project) => {
    const now = Date.now();
    updated.updatedAt = now;

    const activity: ActivityItem = {
      id: `act-${now}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: currentUser.avatarColor,
      action: 'updated',
      targetType: 'project',
      targetTitle: updated.name,
      timestamp: now,
    };

    setWorkspace(prev => ({
      ...prev,
      projects: prev.projects.map(p => (p.id === updated.id ? updated : p)),
      activities: [activity, ...prev.activities],
      lastSync: now,
    }));

    wsService.send({
      type: 'project:updated',
      payload: { project: updated, activity },
    });
  }, [currentUser]);

  const deleteProject = useCallback((projectId: string) => {
    const proj = workspace.projects.find(p => p.id === projectId);
    const now = Date.now();

    const activity: ActivityItem = {
      id: `act-${now}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: currentUser.avatarColor,
      action: 'deleted',
      targetType: 'project',
      targetTitle: proj ? proj.name : 'Project',
      timestamp: now,
    };

    setWorkspace(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== projectId),
      tasks: prev.tasks.filter(t => t.projectId !== projectId),
      activities: [activity, ...prev.activities],
      lastSync: now,
    }));

    if (activeProjectId === projectId) {
      setActiveProjectId('all');
    }

    wsService.send({
      type: 'project:deleted',
      payload: { projectId, activity },
    });
  }, [currentUser, workspace.projects, activeProjectId]);

  const duplicateProject = useCallback((projectId: string) => {
    const orig = workspace.projects.find(p => p.id === projectId);
    if (!orig) return;

    const now = Date.now();
    const newId = `proj-${now}-${Math.random().toString(36).slice(2, 6)}`;
    const copyProj: Project = {
      ...orig,
      id: newId,
      name: `${orig.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };

    // Copy associated tasks
    const origTasks = workspace.tasks.filter(t => t.projectId === projectId);
    const copyTasks: Task[] = origTasks.map(t => ({
      ...t,
      id: `task-${now}-${Math.random().toString(36).slice(2, 6)}`,
      projectId: newId,
      createdAt: now,
      updatedAt: now,
      subtasks: t.subtasks.map(s => ({ ...s, id: `sub-${Math.random().toString(36).slice(2, 8)}` })),
      comments: [],
    }));

    setWorkspace(prev => ({
      ...prev,
      projects: [...prev.projects, copyProj],
      tasks: [...prev.tasks, ...copyTasks],
      lastSync: now,
    }));

    wsService.send({
      type: 'project:created',
      payload: { project: copyProj },
    });

    copyTasks.forEach(task => {
      wsService.send({
        type: 'task:created',
        payload: { task },
      });
    });

    setActiveProjectId(newId);
  }, [workspace.projects, workspace.tasks]);

  const addTeamMember = useCallback((data: Omit<TeamMember, 'id'>) => {
    const now = Date.now();
    const newMember: TeamMember = {
      ...data,
      id: `usr-${now}-${Math.random().toString(36).slice(2, 6)}`,
    };

    const activity: ActivityItem = {
      id: `act-${now}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: currentUser.avatarColor,
      action: 'created',
      targetType: 'project',
      targetTitle: newMember.name,
      details: `Added new teammate ${newMember.name} (${newMember.role})`,
      timestamp: now,
    };

    setWorkspace(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, newMember],
      activities: [activity, ...prev.activities],
      lastSync: now,
    }));

    wsService.send({
      type: 'member:created',
      payload: {
        member: newMember,
        activity,
      },
    });

    return newMember;
  }, [currentUser]);

  const resetWorkspace = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace/reset', { method: 'POST' });
      const data = await res.json();
      if (data?.workspace) {
        setWorkspace(data.workspace);
      }
    } catch (err) {
      console.error('Error resetting workspace:', err);
    }
  }, []);

  const value = useMemo(() => ({
    workspace,
    isLoading,
    activeProjectId,
    setActiveProjectId,
    viewMode,
    setViewMode,
    currentUser,
    setCurrentUser,
    onlinePresences,
    connectionStatus,
    latencyMs,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    filterAssignee,
    setFilterAssignee,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    addTaskComment,
    toggleTaskStatus,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    addTeamMember,
    resetWorkspace,
    selectedTaskId,
    setSelectedTaskId,
  }), [
    workspace,
    isLoading,
    activeProjectId,
    viewMode,
    currentUser,
    onlinePresences,
    connectionStatus,
    latencyMs,
    searchQuery,
    filterStatus,
    filterPriority,
    filterAssignee,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    addTaskComment,
    toggleTaskStatus,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    addTeamMember,
    resetWorkspace,
    selectedTaskId,
  ]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
