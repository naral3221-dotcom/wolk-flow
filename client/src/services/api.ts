import {
  mockProjects,
  mockTasks,
  mockMembers,
  mockActivities,
  mockCurrentUser,
} from './mockData';
import type { Member, Project, Task, TaskStatus, TaskPriority } from '@/types';

// 목업 모드 (백엔드 없이 동작)
const USE_MOCK = true;

// 지연 시뮬레이션
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 로컬 상태 (목업용)
let localTasks = [...mockTasks];
let localProjects = [...mockProjects];
let localMembers = [...mockMembers];

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
      return localProjects;
    }
    return api.get('/projects');
  },
  get: async (id: string): Promise<Project> => {
    if (USE_MOCK) {
      await delay(200);
      const project = localProjects.find((p) => p.id === id);
      if (!project) throw new Error('프로젝트를 찾을 수 없습니다.');
      return project;
    }
    return api.get(`/projects/${id}`);
  },
  create: async (data: { name: string; description?: string; startDate?: string; endDate?: string }): Promise<Project> => {
    if (USE_MOCK) {
      await delay(300);
      const newProject: Project = {
        id: `project-${Date.now()}`,
        name: data.name,
        description: data.description,
        status: 'ACTIVE',
        startDate: data.startDate,
        endDate: data.endDate,
        owner: mockCurrentUser,
        members: [],
        _count: { tasks: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localProjects.push(newProject);
      return newProject;
    }
    return api.post<Project>('/projects', data);
  },
  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    if (USE_MOCK) {
      await delay(200);
      const index = localProjects.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('프로젝트를 찾을 수 없습니다.');
      localProjects[index] = {
        ...localProjects[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return localProjects[index];
    }
    return api.put<Project>(`/projects/${id}`, data);
  },
  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      await delay(200);
      const index = localProjects.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('프로젝트를 찾을 수 없습니다.');
      localProjects.splice(index, 1);
      // 관련 태스크도 삭제
      localTasks = localTasks.filter((t) => t.projectId !== id);
      return;
    }
    return api.delete(`/projects/${id}`);
  },
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
  create: async (data: {
    projectId: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;  // 단일 담당자 (하위 호환)
    assigneeIds?: string[];  // 다중 담당자
    startDate?: string;
    dueDate?: string;
    folderUrl?: string;
  }): Promise<Task> => {
    if (USE_MOCK) {
      await delay(300);
      const project = localProjects.find((p) => p.id === data.projectId);
      // 다중 담당자 처리 (assigneeIds 우선, 없으면 assigneeId 사용)
      const assigneeIds = data.assigneeIds || (data.assigneeId ? [data.assigneeId] : []);
      const assignees = assigneeIds
        .map(id => localMembers.find((m) => m.id === id))
        .filter((m): m is Member => m !== undefined);
      const assignee = assignees[0]; // 하위 호환을 위해 첫 번째 담당자
      const newTask: Task = {
        id: `task-${Date.now()}`,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        assignee,
        assignees: assignees.length > 0 ? assignees : undefined,
        reporter: mockCurrentUser,
        startDate: data.startDate,
        dueDate: data.dueDate,
        order: localTasks.filter((t) => t.status === (data.status || 'TODO')).length,
        folderUrl: data.folderUrl,
        labels: [],
        _count: { subtasks: 0, comments: 0 },
        project: project ? { id: project.id, name: project.name } : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localTasks.push(newTask);
      return newTask;
    }
    return api.post<Task>('/tasks', data);
  },
  update: async (id: string, data: Partial<Task> & { assigneeIds?: string[] }): Promise<Task> => {
    if (USE_MOCK) {
      await delay(200);
      const index = localTasks.findIndex((t) => t.id === id);
      if (index === -1) throw new Error('업무를 찾을 수 없습니다.');

      // assigneeIds가 있으면 assignees로 변환
      let assignees: Member[] | undefined;
      let assignee: Member | undefined;
      if (data.assigneeIds) {
        assignees = data.assigneeIds
          .map(memberId => localMembers.find((m) => m.id === memberId))
          .filter((m): m is Member => m !== undefined);
        assignee = assignees[0];
      }

      localTasks[index] = {
        ...localTasks[index],
        ...data,
        ...(assignees !== undefined && { assignees, assignee }),
        updatedAt: new Date().toISOString(),
      };
      return localTasks[index];
    }
    return api.put<Task>(`/tasks/${id}`, data);
  },
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
  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      await delay(200);
      const index = localTasks.findIndex((t) => t.id === id);
      if (index === -1) throw new Error('업무를 찾을 수 없습니다.');
      localTasks.splice(index, 1);
      return;
    }
    return api.delete(`/tasks/${id}`);
  },
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
      return localMembers;
    }
    return api.get('/members');
  },
  get: async (id: string): Promise<Member> => {
    if (USE_MOCK) {
      await delay(200);
      const member = localMembers.find((m) => m.id === id);
      if (!member) throw new Error('팀원을 찾을 수 없습니다.');
      return member;
    }
    return api.get(`/members/${id}`);
  },
  invite: async (email: string, role?: string): Promise<Member> => {
    if (USE_MOCK) {
      await delay(500);
      // 이미 존재하는 멤버인지 확인
      const existing = localMembers.find((m) => m.email === email);
      if (existing) throw new Error('이미 등록된 이메일입니다.');

      const newMember: Member = {
        id: `member-${Date.now()}`,
        email,
        name: email.split('@')[0],
        department: '미지정',
        position: '팀원',
      };
      localMembers.push(newMember);
      return newMember;
    }
    return api.post<Member>('/members/invite', { email, role });
  },
  update: async (id: string, data: Partial<Member>): Promise<Member> => {
    if (USE_MOCK) {
      await delay(200);
      const index = localMembers.findIndex((m) => m.id === id);
      if (index === -1) throw new Error('팀원을 찾을 수 없습니다.');
      localMembers[index] = { ...localMembers[index], ...data };
      return localMembers[index];
    }
    return api.put<Member>(`/members/${id}`, data);
  },
  remove: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      await delay(200);
      const index = localMembers.findIndex((m) => m.id === id);
      if (index === -1) throw new Error('팀원을 찾을 수 없습니다.');
      localMembers.splice(index, 1);
      return;
    }
    return api.delete(`/members/${id}`);
  },
  getTasks: (id: string) => api.get<Task[]>(`/members/${id}/tasks`),
  getWorkload: (id: string) =>
    api.get<{ todo: number; inProgress: number; review: number; done: number }>(`/members/${id}/workload`),
};

// Dashboard
export const dashboardApi = {
  summary: async (): Promise<import('@/types').DashboardStats> => {
    if (USE_MOCK) {
      await delay(300);
      // localTasks를 기반으로 동적으로 통계 계산
      const now = new Date();
      const stats: import('@/types').DashboardStats = {
        total: localTasks.length,
        todo: localTasks.filter(t => t.status === 'TODO').length,
        inProgress: localTasks.filter(t => t.status === 'IN_PROGRESS').length,
        review: localTasks.filter(t => t.status === 'REVIEW').length,
        done: localTasks.filter(t => t.status === 'DONE').length,
        overdue: localTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE').length,
        projects: localProjects.length,
        members: localMembers.length,
      };
      return stats;
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
  teamProgress: async (): Promise<import('@/types').TeamProgress[]> => {
    if (USE_MOCK) {
      await delay(300);
      // localMembers와 localTasks를 기반으로 동적 계산
      return localMembers.map(member => {
        const memberTasks = localTasks.filter(t => t.assignee?.id === member.id);
        const taskStats = {
          todo: memberTasks.filter(t => t.status === 'TODO').length,
          inProgress: memberTasks.filter(t => t.status === 'IN_PROGRESS').length,
          review: memberTasks.filter(t => t.status === 'REVIEW').length,
          done: memberTasks.filter(t => t.status === 'DONE').length,
        };
        return {
          id: member.id,
          name: member.name,
          avatarUrl: member.avatarUrl,
          department: member.department,
          taskStats,
          total: memberTasks.length,
        };
      });
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
