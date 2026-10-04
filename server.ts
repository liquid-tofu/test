import express, { Request, Response } from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { WorkspaceData, Task, Project, ActivityItem, TeamMember, UserPresence, WebSocketMessage } from './src/types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'workspace.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Team Members
const INITIAL_TEAM: TeamMember[] = [
  { id: 'usr-1', name: 'Savin Ngoeurm', role: 'Lead Architect', email: 'savinngoeurm@gmail.com', avatarColor: '#3b82f6', device: 'MacBook Pro' },
  { id: 'usr-2', name: 'Elena Rostova', role: 'Senior Product Designer', email: 'elena@syncteam.dev', avatarColor: '#10b981', device: 'iPad Pro' },
  { id: 'usr-3', name: 'Marcus Chen', role: 'Full Stack Engineer', email: 'marcus@syncteam.dev', avatarColor: '#8b5cf6', device: 'Linux Workstation' },
  { id: 'usr-4', name: 'Priya Sharma', role: 'Technical Program Manager', email: 'priya@syncteam.dev', avatarColor: '#f59e0b', device: 'Pixel 9' },
  { id: 'usr-5', name: 'Liam O\'Connor', role: 'DevOps & Cloud Specialist', email: 'liam@syncteam.dev', avatarColor: '#ec4899', device: 'Windows Desktop' },
];

function generateSeedData(): WorkspaceData {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const fmtDate = (daysFromNow: number) => {
    const d = new Date(now + daysFromNow * oneDay);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const projects: Project[] = [
    {
      id: 'proj-1',
      name: 'Cloud Infrastructure & Real-Time Sync Engine',
      description: 'Architecting distributed websocket cluster, database migrations, and low-latency delta replication.',
      color: '#3b82f6',
      category: 'Backend & Cloud',
      deadline: fmtDate(14),
      budgetHours: 120,
      createdAt: now - 10 * oneDay,
      updatedAt: now,
    },
    {
      id: 'proj-2',
      name: 'Mobile App 2.0 & Cross-Device Sync',
      description: 'Building native multi-platform client with offline-first local cache and push notifications.',
      color: '#10b981',
      category: 'Product & Mobile',
      deadline: fmtDate(21),
      budgetHours: 90,
      createdAt: now - 8 * oneDay,
      updatedAt: now,
    },
    {
      id: 'proj-3',
      name: 'Enterprise Security & SOC2 Compliance',
      description: 'End-to-end encryption audit, role-based access controls, and compliance reporting engine.',
      color: '#8b5cf6',
      category: 'Security & DevOps',
      deadline: fmtDate(7),
      budgetHours: 65,
      createdAt: now - 5 * oneDay,
      updatedAt: now,
    },
  ];

  const tasks: Task[] = [
    {
      id: 'task-101',
      projectId: 'proj-1',
      title: 'Implement WebSocket delta replication protocol',
      description: 'Ensure broadcast events carry minimal JSON diffs and idempotent updates to prevent state desync.',
      status: 'in_progress',
      priority: 'urgent',
      assignee: 'Savin Ngoeurm',
      startDate: fmtDate(-3),
      dueDate: fmtDate(2),
      tags: ['WebSocket', 'Architecture', 'Real-time'],
      estimatedHours: 16,
      subtasks: [
        { id: 'sub-1', title: 'Define event schema with senderId tracking', completed: true, assignee: 'Savin Ngoeurm' },
        { id: 'sub-2', title: 'Implement reconnect state resynchronization', completed: true, assignee: 'Marcus Chen' },
        { id: 'sub-3', title: 'Write load test suite for 1,000 concurrent sockets', completed: false, assignee: 'Liam O\'Connor' },
      ],
      comments: [
        { id: 'c-1', authorId: 'usr-1', authorName: 'Savin Ngoeurm', authorAvatarColor: '#3b82f6', text: 'WebSocket upgrade handshake tested on port 3000. Low latency confirmed.', createdAt: now - 3 * 3600 * 1000 },
        { id: 'c-2', authorId: 'usr-3', authorName: 'Marcus Chen', authorAvatarColor: '#8b5cf6', text: 'Reconciliation logic tested against concurrent client edits. Working smoothly.', createdAt: now - 1 * 3600 * 1000 },
      ],
      order: 0,
      createdAt: now - 4 * oneDay,
      updatedAt: now - 1 * 3600 * 1000,
    },
    {
      id: 'task-102',
      projectId: 'proj-1',
      title: 'Build automated disk snapshot & cloud persistence',
      description: 'Auto-save workspace data with atomic file writes to ensure data durability across server restarts.',
      status: 'done',
      priority: 'high',
      assignee: 'Marcus Chen',
      startDate: fmtDate(-5),
      dueDate: fmtDate(-1),
      tags: ['Backend', 'Storage', 'Persistence'],
      estimatedHours: 8,
      subtasks: [
        { id: 'sub-4', title: 'Create atomic temp file swap', completed: true },
        { id: 'sub-5', title: 'Verify crash-recovery semantics', completed: true },
      ],
      comments: [],
      order: 1,
      createdAt: now - 5 * oneDay,
      updatedAt: now - 4 * 3600 * 1000,
      completedAt: now - 4 * 3600 * 1000,
    },
    {
      id: 'task-103',
      projectId: 'proj-1',
      title: 'Configure automated telemetry & connection health monitor',
      description: 'Display live ping latency and active connection count in the top navigation bar.',
      status: 'todo',
      priority: 'medium',
      assignee: 'Liam O\'Connor',
      startDate: fmtDate(0),
      dueDate: fmtDate(5),
      tags: ['DevOps', 'Observability'],
      estimatedHours: 6,
      subtasks: [
        { id: 'sub-6', title: 'Add heartbeat ping/pong listener', completed: true },
        { id: 'sub-7', title: 'Render latency badge in UI', completed: false },
      ],
      comments: [],
      order: 2,
      createdAt: now - 3 * oneDay,
      updatedAt: now,
    },
    {
      id: 'task-201',
      projectId: 'proj-2',
      title: 'Design high-density executive analytics charts',
      description: 'Create multi-dimensional visual charts for team workload distribution, velocity, and project status.',
      status: 'in_progress',
      priority: 'high',
      assignee: 'Elena Rostova',
      startDate: fmtDate(-2),
      dueDate: fmtDate(3),
      tags: ['UI/UX', 'Charts', 'DataVis'],
      estimatedHours: 14,
      subtasks: [
        { id: 'sub-8', title: 'Design stacked workload distribution bar', completed: true },
        { id: 'sub-9', title: 'Add task status donut breakdown with percentages', completed: true },
        { id: 'sub-10', title: 'Implement responsive SVG tooltips and legends', completed: false },
      ],
      comments: [
        { id: 'c-3', authorId: 'usr-2', authorName: 'Elena Rostova', authorAvatarColor: '#10b981', text: 'Color palette aligned with modern design system. Contrast ratios pass WCAG AA.', createdAt: now - 5 * 3600 * 1000 }
      ],
      order: 0,
      createdAt: now - 3 * oneDay,
      updatedAt: now,
    },
    {
      id: 'task-202',
      projectId: 'proj-2',
      title: 'Generate multi-sheet Excel & vector PDF report export',
      description: 'Export structured workbook with Actions, Team Workload, and Subtasks sheets without external dependencies.',
      status: 'review',
      priority: 'urgent',
      assignee: 'Savin Ngoeurm',
      startDate: fmtDate(-4),
      dueDate: fmtDate(1),
      tags: ['Reporting', 'Export', 'Excel', 'PDF'],
      estimatedHours: 12,
      subtasks: [
        { id: 'sub-11', title: 'Build OpenXML ZIP store generator', completed: true },
        { id: 'sub-12', title: 'Format PDF executive summary with KPIs', completed: true },
        { id: 'sub-13', title: 'Support Unicode & multi-language scripts', completed: true },
      ],
      comments: [],
      order: 1,
      createdAt: now - 2 * oneDay,
      updatedAt: now - 2 * 3600 * 1000,
    },
    {
      id: 'task-203',
      projectId: 'proj-2',
      title: 'Touch-optimized Kanban drag-and-drop for mobile devices',
      description: 'Enable smooth card dragging across columns on iPad, tablet, and mobile screens.',
      status: 'backlog',
      priority: 'medium',
      assignee: 'Elena Rostova',
      startDate: fmtDate(1),
      dueDate: fmtDate(8),
      tags: ['Mobile', 'Gestures', 'Kanban'],
      estimatedHours: 10,
      subtasks: [],
      comments: [],
      order: 2,
      createdAt: now - 2 * oneDay,
      updatedAt: now,
    },
    {
      id: 'task-301',
      projectId: 'proj-3',
      title: 'Audit role-based permissions & collaborator invites',
      description: 'Review access rules for project team members and viewer guest accounts.',
      status: 'in_progress',
      priority: 'high',
      assignee: 'Priya Sharma',
      startDate: fmtDate(-3),
      dueDate: fmtDate(4),
      tags: ['Security', 'Compliance', 'Audit'],
      estimatedHours: 10,
      subtasks: [
        { id: 'sub-14', title: 'Review member permission tiers', completed: true },
        { id: 'sub-15', title: 'Verify sanitized inputs for all API endpoints', completed: false },
      ],
      comments: [],
      order: 0,
      createdAt: now - 4 * oneDay,
      updatedAt: now,
    },
    {
      id: 'task-302',
      projectId: 'proj-3',
      title: 'Generate quarterly SOC2 audit compliance matrix',
      description: 'Compile task audit logs into compliance evidence package for auditors.',
      status: 'done',
      priority: 'urgent',
      assignee: 'Priya Sharma',
      startDate: fmtDate(-6),
      dueDate: fmtDate(-2),
      tags: ['Compliance', 'Audit', 'SOC2'],
      estimatedHours: 15,
      subtasks: [
        { id: 'sub-16', title: 'Collect automated activity logs', completed: true },
        { id: 'sub-17', title: 'Sign off with executive security officer', completed: true },
      ],
      comments: [],
      order: 1,
      createdAt: now - 6 * oneDay,
      updatedAt: now - 1 * oneDay,
      completedAt: now - 1 * oneDay,
    },
  ];

  const activities: ActivityItem[] = [
    {
      id: 'act-1',
      userId: 'usr-1',
      userName: 'Savin Ngoeurm',
      userColor: '#3b82f6',
      action: 'created',
      targetType: 'task',
      targetTitle: 'Implement WebSocket delta replication protocol',
      details: 'Assigned to Savin Ngoeurm with urgent priority',
      timestamp: now - 4 * 3600 * 1000,
    },
    {
      id: 'act-2',
      userId: 'usr-2',
      userName: 'Elena Rostova',
      userColor: '#10b981',
      action: 'updated',
      targetType: 'task',
      targetTitle: 'Design high-density executive analytics charts',
      details: 'Completed subtask: Add task status donut breakdown',
      timestamp: now - 2 * 3600 * 1000,
    },
    {
      id: 'act-3',
      userId: 'usr-3',
      userName: 'Marcus Chen',
      userColor: '#8b5cf6',
      action: 'status_changed',
      targetType: 'task',
      targetTitle: 'Build automated disk snapshot & cloud persistence',
      details: 'Moved from In Progress to Done',
      timestamp: now - 1 * 3600 * 1000,
    },
  ];

  return {
    projects,
    tasks,
    activities,
    teamMembers: INITIAL_TEAM,
    lastSync: now,
  };
}

let workspaceState: WorkspaceData;

// Load or initialize state
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    workspaceState = JSON.parse(raw);
    console.log(`Loaded workspace with ${workspaceState.projects.length} projects and ${workspaceState.tasks.length} tasks.`);
  } else {
    workspaceState = generateSeedData();
    saveWorkspaceToDisk();
    console.log('Initialized fresh workspace seed data.');
  }
} catch (err) {
  console.error('Error loading data file, generating fresh state:', err);
  workspaceState = generateSeedData();
}

function saveWorkspaceToDisk() {
  try {
    workspaceState.lastSync = Date.now();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(workspaceState, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    console.error('Failed to persist workspace data to disk:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const host = request.headers.host || `localhost:${PORT}`;
      const url = new URL(request.url || '', `http://${host}`);
      if (url.pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } else {
        // Not a /ws request, ignore or let Vite handle
      }
    } catch (e) {
      socket.destroy();
    }
  });

  // Map of connected client IDs to their presence & WebSocket
  const clients = new Map<string, { ws: WebSocket; presence: UserPresence }>();

  function broadcast(msg: WebSocketMessage, excludeSenderId?: string) {
    const data = JSON.stringify(msg);
    clients.forEach((client, clientId) => {
      if (excludeSenderId && clientId === excludeSenderId) return;
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    });
  }

  function getOnlinePresences(): UserPresence[] {
    const now = Date.now();
    const list: UserPresence[] = [];
    clients.forEach((c) => {
      list.push(c.presence);
    });
    // Add default mock simulated teammates if only 1 user is connected so the team feels alive
    if (list.length === 1) {
      list.push(
        {
          id: 'sim-elena',
          name: 'Elena Rostova',
          avatarColor: '#10b981',
          device: 'iPad Pro',
          activeProjectId: 'proj-2',
          activeTaskId: 'task-201',
          lastSeen: now,
        },
        {
          id: 'sim-marcus',
          name: 'Marcus Chen',
          avatarColor: '#8b5cf6',
          device: 'Linux Workstation',
          activeProjectId: 'proj-1',
          activeTaskId: 'task-101',
          lastSeen: now - 30000,
        }
      );
    }
    return list;
  }

  wss.on('connection', (ws: WebSocket, req) => {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Default presence for newly connected socket
    const presence: UserPresence = {
      id: clientId,
      name: 'Savin Ngoeurm',
      avatarColor: '#3b82f6',
      device: req.headers['user-agent']?.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
      activeProjectId: 'all',
      activeTaskId: null,
      lastSeen: Date.now(),
    };

    clients.set(clientId, { ws, presence });

    // Send initial full state to newly connected client
    const initMsg: WebSocketMessage = {
      type: 'init',
      payload: {
        workspace: workspaceState,
        presences: getOnlinePresences(),
        clientId,
      },
    };
    ws.send(JSON.stringify(initMsg));

    // Broadcast updated presence list to everyone
    broadcast({
      type: 'presence:list',
      payload: getOnlinePresences(),
    });

    ws.on('message', (raw) => {
      try {
        const msg: WebSocketMessage = JSON.parse(raw.toString());
        const senderId = msg.senderId || clientId;

        switch (msg.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', payload: { time: Date.now() } }));
            break;

          case 'presence:update':
            if (msg.payload) {
              const current = clients.get(clientId);
              if (current) {
                current.presence = {
                  ...current.presence,
                  ...msg.payload,
                  id: clientId,
                  lastSeen: Date.now(),
                };
                broadcast({
                  type: 'presence:list',
                  payload: getOnlinePresences(),
                });
              }
            }
            break;

          case 'task:created': {
            const newTask: Task = msg.payload.task;
            if (newTask && !workspaceState.tasks.some(t => t.id === newTask.id)) {
              workspaceState.tasks.unshift(newTask);
              if (msg.payload.activity) {
                workspaceState.activities.unshift(msg.payload.activity);
              }
              saveWorkspaceToDisk();
              broadcast(msg, senderId);
            }
            break;
          }

          case 'task:updated': {
            const updatedTask: Task = msg.payload.task;
            if (updatedTask) {
              const idx = workspaceState.tasks.findIndex(t => t.id === updatedTask.id);
              if (idx !== -1) {
                workspaceState.tasks[idx] = updatedTask;
              } else {
                workspaceState.tasks.unshift(updatedTask);
              }
              if (msg.payload.activity) {
                workspaceState.activities.unshift(msg.payload.activity);
              }
              saveWorkspaceToDisk();
              broadcast(msg, senderId);
            }
            break;
          }

          case 'task:deleted': {
            const taskId: string = msg.payload.taskId;
            workspaceState.tasks = workspaceState.tasks.filter(t => t.id !== taskId);
            if (msg.payload.activity) {
              workspaceState.activities.unshift(msg.payload.activity);
            }
            saveWorkspaceToDisk();
            broadcast(msg, senderId);
            break;
          }

          case 'task:reordered': {
            const reorderedTasks: Task[] = msg.payload.tasks;
            if (Array.isArray(reorderedTasks)) {
              const idMap = new Map(reorderedTasks.map(t => [t.id, t]));
              workspaceState.tasks = workspaceState.tasks.map(t => idMap.get(t.id) || t);
              saveWorkspaceToDisk();
              broadcast(msg, senderId);
            }
            break;
          }

          case 'task:comment': {
            const { taskId, comment, activity } = msg.payload;
            const task = workspaceState.tasks.find(t => t.id === taskId);
            if (task) {
              task.comments = task.comments || [];
              task.comments.push(comment);
              task.updatedAt = Date.now();
              if (activity) {
                workspaceState.activities.unshift(activity);
              }
              saveWorkspaceToDisk();
              broadcast(msg, senderId);
            }
            break;
          }

          case 'project:created': {
            const newProj: Project = msg.payload.project;
            if (newProj && !workspaceState.projects.some(p => p.id === newProj.id)) {
              workspaceState.projects.push(newProj);
              if (msg.payload.activity) {
                workspaceState.activities.unshift(msg.payload.activity);
              }
              saveWorkspaceToDisk();
              broadcast(msg, senderId);
            }
            break;
          }

          case 'project:updated': {
            const updatedProj: Project = msg.payload.project;
            if (updatedProj) {
              const idx = workspaceState.projects.findIndex(p => p.id === updatedProj.id);
              if (idx !== -1) {
                workspaceState.projects[idx] = updatedProj;
              }
              saveWorkspaceToDisk();
              broadcast(msg, senderId);
            }
            break;
          }

          case 'project:deleted': {
            const projId: string = msg.payload.projectId;
            workspaceState.projects = workspaceState.projects.filter(p => p.id !== projId);
            workspaceState.tasks = workspaceState.tasks.filter(t => t.projectId !== projId);
            saveWorkspaceToDisk();
            broadcast(msg, senderId);
            break;
          }

          case 'member:created': {
            const member: TeamMember = msg.payload.member;
            if (member && !workspaceState.teamMembers.some(m => m.id === member.id)) {
              workspaceState.teamMembers.push(member);
              if (msg.payload.activity) {
                workspaceState.activities.unshift(msg.payload.activity);
              }
              saveWorkspaceToDisk();
              broadcast(msg, senderId);
            }
            break;
          }

          case 'workspace:reset': {
            workspaceState = generateSeedData();
            saveWorkspaceToDisk();
            broadcast({
              type: 'init',
              payload: {
                workspace: workspaceState,
                presences: getOnlinePresences(),
              }
            });
            break;
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      broadcast({
        type: 'presence:list',
        payload: getOnlinePresences(),
      });
    });
  });

  // REST API Endpoints for fallback and programmatic access
  app.get('/api/workspace', (_req: Request, res: Response) => {
    res.json(workspaceState);
  });

  app.post('/api/team/members', (req: Request, res: Response) => {
    const { name, role, email, avatarColor, device } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const newMember: TeamMember = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      role: role?.trim() || 'Contributor',
      email: email?.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@syncteam.dev`,
      avatarColor: avatarColor || '#3b82f6',
      device: device || 'Workstation',
    };
    workspaceState.teamMembers.push(newMember);
    saveWorkspaceToDisk();
    broadcast({
      type: 'member:created',
      payload: { member: newMember },
    });
    res.json({ success: true, member: newMember });
  });

  app.post('/api/workspace/reset', (_req: Request, res: Response) => {
    workspaceState = generateSeedData();
    saveWorkspaceToDisk();
    broadcast({
      type: 'init',
      payload: {
        workspace: workspaceState,
        presences: getOnlinePresences(),
      }
    });
    res.json({ success: true, workspace: workspaceState });
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      connectedClients: clients.size,
      projectsCount: workspaceState.projects.length,
      tasksCount: workspaceState.tasks.length,
      lastSync: workspaceState.lastSync,
    });
  });

  // Vite integration in development or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`SyncTeam full-stack server running on http://0.0.0.0:${PORT} with WebSocket on /ws`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
