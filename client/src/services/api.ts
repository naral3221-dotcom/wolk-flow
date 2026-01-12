import {
  mockProjects,
  mockTasks,
  mockMembers,
  mockDashboardStats,
  mockTeamProgress,
  mockActivities,
  mockCurrentUser,
} from './mockData';
import type { Member, Project, Task, TaskStatus } from '@/types';

// 목업 모드 (백엔드 없이 동작)
const USE_MOCK = true;

// 지연 시뮬레이션
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 로컬 상태 (목업용)
let localTasks = [...mockTasks];

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || 'An error occurred');
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};

// Auth
export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; member: Member }> => {
    if (USE_MOCK) {
      await delay(500);
      const member = mockMembers.find((m) => m.email === email);
      if (member && password === 'password123') {
        return { token: 'mock-jwt-token', member };
      }
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    return api.post('/auth/login', { email, password });
  },
  me: async (): Promise<Member> => {
    if (USE_MOCK) {
      await delay(200);
      return mockCurrentUser;
    }
    return api.get('/auth/me');
  },
};

// Projects
export const projectsApi = {
  list: async (): Promise<Project[]> => {
    if (USE_MOCK) {
      await delay(300);
      return mockProjects;
    }
    return api.get('/projects');
  },
  get: async (id: string): Promise<Project> => {
    if (USE_MOCK) {
      await delay(200);
      const project = mockProjects.find((p) => p.id === id);
      if (!project) throw new Error('프로젝트를 찾을 수 없습니다.');
      return project;
    }
    return api.get(`/projects/${id}`);
  },
  create: (data: { name: string; description?: string; startDate?: string; endDate?: string }) =>
    api.post<Project>('/projects', data),
  update: (id: string, data: Partial<Project>) =>
    api.put<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  addMember: (projectId: string, memberId: string, role?: string) =>
    api.post(`/projects/${projectId}/members`, { memberId, role }),
  removeMember: (projectId: string, memberId: string) =>
    api.delete(`/projects/${projectId}/members/${memberId}`),
};

// Tasks
export const tasksApi = {
  list: async (params?: { projectId?: string; status?: string; assigneeId?: string }): Promise<Task[]> => {
    if (USE_MOCK) {
      await delay(300);
      let filtered = [...localTasks];
      if (params?.projectId) {
        filtered = filtered.filter((t) => t.projectId === params.projectId);
      }
      if (params?.status) {
        filtered = filtered.filter((t) => t.status === params.status);
      }
      if (params?.assigneeId) {
        filtered = filtered.filter((t) => t.assignee?.id === params.assigneeId);
      }
      return filtered;
    }
    const searchParams = new URLSearchParams();
    if (params?.projectId) searchParams.set('projectId', params.projectId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.assigneeId) searchParams.set('assigneeId', params.assigneeId);
    const query = searchParams.toString();
    return api.get(`/tasks${query ? `?${query}` : ''}`);
  },
  get: async (id: string): Promise<Task> => {
    if (USE_MOCK) {
      await delay(200);
      const task = localTasks.find((t) => t.id === id);
      if (!task) throw new Error('업무를 찾을 수 없습니다.');
      return task;
    }
    return api.get(`/tasks/${id}`);
  },
  create: (data: {
    projectId: string;
    title: string;
    description?: string;
    priority?: string;
    assigneeId?: string;
    startDate?: string;
    dueDate?: string;
    folderUrl?: string;
  }) => api.post<Task>('/tasks', data),
  update: (id: string, data: Partial<Task>) =>
    api.put<Task>(`/tasks/${id}`, data),
  updateStatus: async (id: string, status: string, order?: number): Promise<Task> => {
    if (USE_MOCK) {
      await delay(200);
      const taskIndex = localTasks.findIndex((t) => t.id === id);
      if (taskIndex === -1) throw new Error('업무를 찾을 수 없습니다.');
      localTasks[taskIndex] = {
        ...localTasks[taskIndex],
        status: status as TaskStatus,
        order: order ?? localTasks[taskIndex].order,
      };
      return localTasks[taskIndex];
    }
    return api.patch(`/tasks/${id}/status`, { status, order });
  },
  updateOrder: (id: string, order: number) =>
    api.patch<Task>(`/tasks/${id}/order`, { order }),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  getComments: (taskId: string) =>
    api.get<import('@/types').Comment[]>(`/tasks/${taskId}/comments`),
  addComment: (taskId: string, content: string) =>
    api.post<import('@/types').Comment>(`/tasks/${taskId}/comments`, { content }),
};

// Members
export const membersApi = {
  list: async (): Promise<Member[]> => {
    if (USE_MOCK) {
      await delay(200);
      return mockMembers;
    }
    return api.get('/members');
  },
  get: async (id: string): Promise<Member> => {
    if (USE_MOCK) {
      await delay(200);
      const member = mockMembers.find((m) => m.id === id);
      if (!member) throw new Error('팀원을 찾을 수 없습니다.');
      return member;
    }
    return api.get(`/members/${id}`);
  },
  getTasks: (id: string) => api.get<Task[]>(`/members/${id}/tasks`),
  getWorkload: (id: string) =>
    api.get<{ todo: number; inProgress: number; review: number; done: number }>(`/members/${id}/workload`),
};

// Dashboard
export const dashboardApi = {
  summary: async () => {
    if (USE_MOCK) {
      await delay(300);
      return mockDashboardStats;
    }
    return api.get<import('@/types').DashboardStats>('/dashboard/summary');
  },
  myTasks: async () => {
    if (USE_MOCK) {
      await delay(300);
      return localTasks.filter((t) => t.status !== 'DONE').slice(0, 5);
    }
    return api.get<Task[]>('/dashboard/my-tasks');
  },
  teamProgress: async () => {
    if (USE_MOCK) {
      await delay(300);
      return mockTeamProgress;
    }
    return api.get<import('@/types').TeamProgress[]>('/dashboard/team-progress');
  },
  recentActivities: async () => {
    if (USE_MOCK) {
      await delay(300);
      return mockActivities;
    }
    return api.get<import('@/types').ActivityLog[]>('/dashboard/recent-activities');
  },
};
