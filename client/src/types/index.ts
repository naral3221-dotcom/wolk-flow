export interface Member {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  department?: string;
  position?: string;
  role?: Role;
  createdAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission;
  isSystem: boolean;
}

export interface Permission {
  project: {
    create: boolean;
    edit: boolean;
    delete: boolean;
    manage_members: boolean;
  };
  task: {
    create: boolean;
    edit: boolean;
    delete: boolean;
    assign: boolean;
  };
  member: {
    view_all: boolean;
    view_workload: boolean;
    manage: boolean;
  };
  system: {
    manage_roles: boolean;
    view_all_stats: boolean;
    manage_settings: boolean;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'ON_HOLD';
  startDate?: string;
  endDate?: string;
  owner?: Member;
  members?: ProjectMember[];
  labels?: TaskLabel[];
  _count?: { tasks: number };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  memberId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  member: Member;
  joinedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: Member;  // 단일 담당자 (하위 호환)
  assignees?: Member[];  // 다중 담당자
  reporter?: Member;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  order: number;
  parentId?: string;
  folderUrl?: string;
  labels?: { label: TaskLabel }[];
  subtasks?: Task[];
  comments?: Comment[];
  _count?: { subtasks: number; comments: number };
  project?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
  projectId: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  author: Member;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  taskId: string;
  memberId: string;
  action: string;
  details?: Record<string, unknown>;
  member: Member;
  task: { id: string; title: string; project?: { id: string; name: string } };
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  overdue: number;
  projects: number;
  members: number;
}

export interface TeamProgress {
  id: string;
  name: string;
  avatarUrl?: string;
  department?: string;
  taskStats: {
    todo: number;
    inProgress: number;
    review: number;
    done: number;
  };
  total: number;
}
