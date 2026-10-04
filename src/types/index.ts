export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  assignee?: string;
}

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarColor: string;
  text: string;
  createdAt: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string; // name or user id
  startDate?: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  tags: string[];
  estimatedHours: number;
  subtasks: SubTask[];
  comments: TaskComment[];
  order: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  category: string;
  deadline: string;
  budgetHours: number;
  createdAt: number;
  updatedAt: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarColor: string;
  device?: string;
}

export interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  action: 'created' | 'updated' | 'status_changed' | 'deleted' | 'commented' | 'reassigned';
  targetType: 'task' | 'project';
  targetTitle: string;
  details?: string;
  timestamp: number;
}

export interface UserPresence {
  id: string;
  name: string;
  avatarColor: string;
  device: string;
  activeProjectId: string; // project id or 'all'
  activeTaskId?: string | null;
  lastSeen: number;
}

export interface WorkspaceData {
  projects: Project[];
  tasks: Task[];
  activities: ActivityItem[];
  teamMembers: TeamMember[];
  lastSync: number;
}

export type ViewMode = 'board' | 'list' | 'table' | 'gantt' | 'analytics' | 'workload' | 'activity';

export interface WebSocketMessage {
  type: 
    | 'init'
    | 'presence:update'
    | 'presence:list'
    | 'task:created'
    | 'task:updated'
    | 'task:deleted'
    | 'task:reordered'
    | 'task:comment'
    | 'project:created'
    | 'project:updated'
    | 'project:deleted'
    | 'member:created'
    | 'activity:new'
    | 'workspace:reset'
    | 'ping'
    | 'pong';
  senderId?: string;
  payload?: any;
}
