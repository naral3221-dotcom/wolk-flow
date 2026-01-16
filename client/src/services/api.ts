import {
  mockProjects,
  mockTasks,
  mockMembers,
  mockActivities,
  mockCurrentUser,
  mockTeams,
  mockTeamMembers,
} from './mockData';
import type { Member, Project, Task, TaskStatus, TaskPriority, Team, TeamMember, TeamMemberRole, CreateTeamInput, AuthUser, CreateUserInput, UpdateUserInput, RoutineTask, CreateRoutineInput } from '@/types';

// 환경변수 기반 설정
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const USE_REAL_AUTH = !USE_MOCK; // Mock 모드가 아니면 실제 인증 사용
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || 'error';

// 로깅 유틸리티
const logger = {
  debug: (...args: unknown[]) => {
    if (LOG_LEVEL === 'debug') console.log('[API]', ...args);
  },
  info: (...args: unknown[]) => {
    if (['debug', 'info'].includes(LOG_LEVEL)) console.info('[API]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (['debug', 'info', 'warn'].includes(LOG_LEVEL)) console.warn('[API]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[API]', ...args);
  },
};

// 지연 시뮬레이션
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// localStorage 키
const STORAGE_KEYS = {
  TASKS: 'workflow_tasks',
  PROJECTS: 'workflow_projects',
  MEMBERS: 'workflow_members',
  TEAMS: 'workflow_teams',
  TEAM_MEMBERS: 'workflow_team_members',
  ACTIVITIES: 'workflow_activities',
} as const;

// localStorage 기반 데이터 저장소 관리자
const storageManager = {
  // localStorage에서 데이터 로드 (항상 최신 데이터 반환)
  load: <T>(key: string, fallback: T[]): T[] => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          console.log(`[Storage] Loaded ${key}:`, parsed.length, 'items');
          return parsed;
        }
      }
    } catch (e) {
      console.error(`[Storage] Failed to load ${key}:`, e);
    }
    console.log(`[Storage] Using fallback for ${key}:`, fallback.length, 'items');
    return [...fallback]; // fallback 복사본 반환
  },

  // localStorage에 데이터 저장
  save: <T>(key: string, data: T[]): void => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`[Storage] Saved ${key}:`, data.length, 'items', data);
    } catch (e) {
      console.error(`[Storage] Failed to save ${key}:`, e);
    }
  },

  // 데이터 getter - 항상 localStorage에서 최신 데이터 로드
  get tasks(): Task[] {
    return this.load<Task>(STORAGE_KEYS.TASKS, mockTasks);
  },
  set tasks(data: Task[]) {
    this.save(STORAGE_KEYS.TASKS, data);
  },

  get projects(): Project[] {
    return this.load<Project>(STORAGE_KEYS.PROJECTS, mockProjects);
  },
  set projects(data: Project[]) {
    this.save(STORAGE_KEYS.PROJECTS, data);
  },

  get members(): Member[] {
    return this.load<Member>(STORAGE_KEYS.MEMBERS, mockMembers);
  },
  set members(data: Member[]) {
    this.save(STORAGE_KEYS.MEMBERS, data);
  },

  get teams(): Team[] {
    return this.load<Team>(STORAGE_KEYS.TEAMS, mockTeams);
  },
  set teams(data: Team[]) {
    this.save(STORAGE_KEYS.TEAMS, data);
  },

  get teamMembers(): TeamMember[] {
    return this.load<TeamMember>(STORAGE_KEYS.TEAM_MEMBERS, mockTeamMembers);
  },
  set teamMembers(data: TeamMember[]) {
    this.save(STORAGE_KEYS.TEAM_MEMBERS, data);
  },

  get activities(): import('@/types').ActivityLog[] {
    return this.load<import('@/types').ActivityLog>(STORAGE_KEYS.ACTIVITIES, mockActivities);
  },
  set activities(data: import('@/types').ActivityLog[]) {
    this.save(STORAGE_KEYS.ACTIVITIES, data);
  },
};


// 활동 로그 생성 헬퍼 함수
const createActivityLog = (
  action: 'created' | 'updated' | 'moved' | 'deleted',
  task: Task,
  member: Member,
  details?: Record<string, unknown>
): import('@/types').ActivityLog => {
  const activity: import('@/types').ActivityLog = {
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    taskId: task.id,
    memberId: member.id,
    action,
    details,
    member: {
      id: member.id,
      email: member.email || '',
      name: member.name,
      avatarUrl: member.avatarUrl,
      department: member.department,
      position: member.position,
    },
    task: {
      id: task.id,
      title: task.title,
      project: task.project,
    },
    createdAt: new Date().toISOString(),
  };

  // 최근 활동을 맨 앞에 추가 (최신순) - 올바른 패턴 사용
  const activities = storageManager.activities;
  activities.unshift(activity);

  // 최대 100개까지만 유지
  if (activities.length > 100) {
    activities.splice(100);
  }

  storageManager.activities = activities;

  return activity;
};

// 현재 로그인한 사용자 가져오기 (활동 로그용)
const getCurrentMember = (): Member => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return {
        id: user.id || '',
        email: user.email || '',
        name: user.name || '알 수 없음',
        avatarUrl: user.avatarUrl,
        department: user.department,
        position: user.position,
      };
    } catch {
      // 파싱 실패 시 기본값
    }
  }
  return mockCurrentUser;
};

// 환경 정보 로깅 (개발 모드에서만)
logger.info(`API Mode: ${USE_MOCK ? 'Mock' : 'Real'}, Base URL: ${API_BASE}`);

// API 에러 클래스
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static fromResponse(status: number, data: Record<string, unknown>): ApiError {
    return new ApiError(
      status,
      (data.code as string) || 'UNKNOWN_ERROR',
      (data.message as string) || (data.error as string) || '오류가 발생했습니다.',
      data.details as Record<string, unknown>
    );
  }
}

// 토큰 관리 유틸리티
const tokenManager = {
  getToken: () => localStorage.getItem('token'),

  setToken: (token: string) => {
    localStorage.setItem('token', token);
    // 토큰 만료 시간 저장 (JWT에서 파싱 또는 고정 시간)
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24시간
    localStorage.setItem('token_expires_at', expiresAt.toString());
  },

  removeToken: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('token_expires_at');
  },

  isExpired: () => {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;
    return Date.now() > parseInt(expiresAt, 10);
  },

  // 토큰 만료 임박 체크 (5분 이내)
  isExpiringSoon: () => {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() > parseInt(expiresAt, 10) - fiveMinutes;
  },
};

// 인증 만료 시 처리
const handleAuthExpired = () => {
  tokenManager.removeToken();
  // 페이지 리다이렉트는 authStore에서 처리
  window.dispatchEvent(new CustomEvent('auth:expired'));
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenManager.getToken();

  // 토큰이 만료된 경우 인증 만료 처리
  if (token && tokenManager.isExpired()) {
    handleAuthExpired();
    throw new ApiError(401, 'TOKEN_EXPIRED', '인증이 만료되었습니다. 다시 로그인해주세요.');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  logger.debug(`Request: ${options.method || 'GET'} ${endpoint}`);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '오류가 발생했습니다.' }));

      // 401 에러 처리
      if (response.status === 401) {
        handleAuthExpired();
        throw new ApiError(401, 'UNAUTHORIZED', '인증이 필요합니다.');
      }

      // 403 에러 처리
      if (response.status === 403) {
        throw new ApiError(403, 'FORBIDDEN', '접근 권한이 없습니다.');
      }

      // 기타 에러
      throw ApiError.fromResponse(response.status, errorData);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    logger.debug(`Response: ${endpoint}`, data);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      logger.error(`API Error: ${error.code} - ${error.message}`);
      throw error;
    }

    // 네트워크 에러 등
    logger.error('Network Error:', error);
    throw new ApiError(0, 'NETWORK_ERROR', '네트워크 연결을 확인해주세요.');
  }
}

export { tokenManager };

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

// Auth API (PHP 백엔드 연동)
export const authApi = {
  login: async (username: string, password: string): Promise<{ token: string; user: AuthUser; mustChangePassword: boolean }> => {
    console.log('[Auth] Login attempt:', { username, USE_REAL_AUTH, USE_MOCK });
    if (!USE_REAL_AUTH) {
      // 개발용 Mock 로그인
      console.log('[Auth] Using Mock login');
      await delay(500);

      // Mock 사용자 데이터
      const mockUsers: Record<string, { password: string; user: AuthUser }> = {
        admin: {
          password: 'admin123',
          user: {
            id: '1',
            username: 'admin',
            email: 'admin@hospital.com',
            name: '관리자',
            department: '운영팀',
            position: '원장',
            userRole: 'admin',
            mustChangePassword: false,
          },
        },
        '김철수': {
          password: '123456789',
          user: {
            id: '2',
            username: '김철수',
            email: '',
            name: '김철수',
            department: '물리치료실',
            position: '물리치료사',
            userRole: 'member',
            mustChangePassword: true,
          },
        },
      };

      const userData = mockUsers[username];
      if (userData && userData.password === password) {
        return {
          token: 'mock-jwt-token-' + Date.now(),
          user: userData.user,
          mustChangePassword: userData.user.mustChangePassword,
        };
      }
      throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    // 실제 PHP API 호출
    const response = await fetch(`${API_BASE}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '로그인에 실패했습니다.' }));
      throw new Error(error.error || '로그인에 실패했습니다.');
    }

    const data = await response.json();
    return {
      token: data.token,
      user: {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email || '',
        name: data.user.name,
        avatarUrl: data.user.avatarUrl,
        department: data.user.department,
        position: data.user.position,
        userRole: data.user.role,
        mustChangePassword: data.mustChangePassword,
      },
      mustChangePassword: data.mustChangePassword,
    };
  },

  logout: async (): Promise<void> => {
    if (!USE_REAL_AUTH) {
      await delay(200);
      return;
    }

    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/logout.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  },

  me: async (): Promise<AuthUser> => {
    if (!USE_REAL_AUTH) {
      await delay(200);
      return {
        ...mockCurrentUser,
        userRole: 'admin',
        mustChangePassword: false,
      };
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/me.php`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('인증이 만료되었습니다.');
    }

    const data = await response.json();
    return {
      id: data.id,
      username: data.username,
      email: data.email || '',
      name: data.name,
      avatarUrl: data.avatarUrl,
      department: data.department,
      position: data.position,
      userRole: data.role,
      mustChangePassword: data.mustChangePassword,
    };
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!USE_REAL_AUTH) {
      await delay(500);
      if (currentPassword === '123456789' || currentPassword === 'admin123') {
        return;
      }
      throw new Error('현재 비밀번호가 올바르지 않습니다.');
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/change-password.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '비밀번호 변경에 실패했습니다.' }));
      throw new Error(error.error || '비밀번호 변경에 실패했습니다.');
    }
  },
};

// Admin API (관리자 전용)
export const adminApi = {
  // 사용자 목록 조회
  getUsers: async (): Promise<AuthUser[]> => {
    if (!USE_REAL_AUTH) {
      await delay(300);
      return [
        {
          id: '1',
          username: 'admin',
          email: 'admin@hospital.com',
          name: '관리자',
          department: '운영팀',
          position: '원장',
          userRole: 'admin',
          mustChangePassword: false,
          isActive: true,
        },
        {
          id: '2',
          username: '김철수',
          email: '',
          name: '김철수',
          department: '물리치료실',
          position: '물리치료사',
          userRole: 'member',
          mustChangePassword: true,
          isActive: true,
        },
        {
          id: '3',
          username: '이영희',
          email: '',
          name: '이영희',
          department: '진료실',
          position: '간호사',
          userRole: 'member',
          mustChangePassword: false,
          isActive: true,
        },
      ];
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/admin/users.php`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '사용자 목록을 불러올 수 없습니다.' }));
      throw new Error(error.error);
    }

    const users = await response.json();
    return users.map((u: Record<string, unknown>) => ({
      id: u.id,
      username: u.username,
      email: u.email || '',
      name: u.name,
      avatarUrl: u.avatarUrl,
      department: u.department,
      position: u.position,
      userRole: u.role,
      mustChangePassword: u.mustChangePassword,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    }));
  },

  // 사용자 생성
  createUser: async (data: CreateUserInput): Promise<{ user: AuthUser; tempPassword: string }> => {
    if (!USE_REAL_AUTH) {
      await delay(500);
      const newUser: AuthUser = {
        id: String(Date.now()),
        username: data.username,
        email: data.email || '',
        name: data.name,
        department: data.department,
        position: data.position,
        userRole: data.role || 'member',
        mustChangePassword: true,
        isActive: true,
      };
      return { user: newUser, tempPassword: data.password || '123456789' };
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/admin/users.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '사용자 생성에 실패했습니다.' }));
      throw new Error(error.error);
    }

    const result = await response.json();
    return {
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email || '',
        name: result.user.name,
        department: result.user.department,
        position: result.user.position,
        userRole: result.user.role,
        mustChangePassword: result.user.mustChangePassword,
        isActive: result.user.isActive,
      },
      tempPassword: result.tempPassword,
    };
  },

  // 사용자 수정
  updateUser: async (id: string, data: UpdateUserInput): Promise<AuthUser> => {
    if (!USE_REAL_AUTH) {
      await delay(300);
      return {
        id,
        username: 'user',
        email: data.email || '',
        name: data.name || '수정된 사용자',
        department: data.department,
        position: data.position,
        userRole: data.role || 'member',
        mustChangePassword: false,
        isActive: data.isActive ?? true,
      };
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/admin/users.php?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '사용자 수정에 실패했습니다.' }));
      throw new Error(error.error);
    }

    const result = await response.json();
    return {
      id: result.user.id,
      username: result.user.username,
      email: result.user.email || '',
      name: result.user.name,
      department: result.user.department,
      position: result.user.position,
      userRole: result.user.role,
      mustChangePassword: result.user.mustChangePassword,
      isActive: result.user.isActive,
    };
  },

  // 사용자 삭제
  deleteUser: async (id: string): Promise<void> => {
    if (!USE_REAL_AUTH) {
      await delay(300);
      return;
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/admin/users.php?id=${id}`, {
      method: 'DELETE',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '사용자 삭제에 실패했습니다.' }));
      throw new Error(error.error);
    }
  },

  // 비밀번호 초기화
  resetPassword: async (userId: string, newPassword?: string): Promise<string> => {
    if (!USE_REAL_AUTH) {
      await delay(500);
      return newPassword || '123456789';
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/admin/reset-password.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ userId, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '비밀번호 초기화에 실패했습니다.' }));
      throw new Error(error.error);
    }

    const result = await response.json();
    return result.tempPassword;
  },
};

// Projects
export const projectsApi = {
  list: async (): Promise<Project[]> => {
    if (USE_MOCK) {
      await delay(300);
      return storageManager.projects;
    }
    return api.get('/projects.php');
  },
  get: async (id: string): Promise<Project> => {
    if (USE_MOCK) {
      await delay(200);
      const project = storageManager.projects.find((p) => p.id === id);
      if (!project) throw new Error('프로젝트를 찾을 수 없습니다.');
      return project;
    }
    return api.get(`/projects.php?id=${id}`);
  },
  create: async (data: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    teamId?: string;
    teamIds?: string[];
    teamAssignments?: { teamId: string; assigneeIds: string[] }[];
  }): Promise<Project> => {
    if (USE_MOCK) {
      await delay(300);
      const membersData = storageManager.members;
      const teamMembersData = storageManager.teamMembers;

      // 다중 팀 정보 처리
      const teams = data.teamIds
        ? data.teamIds.map(id => storageManager.teams.find(t => t.id === id)).filter((t): t is Team => t !== undefined)
        : data.teamId
          ? [storageManager.teams.find(t => t.id === data.teamId)].filter((t): t is Team => t !== undefined)
          : [];

      // 팀별 담당자 정보 처리
      const teamAssignments = data.teamAssignments?.map(ta => {
        const assignees = ta.assigneeIds.map(mid => {
          // 1. members 저장소에서 찾기
          let member = membersData.find(m => m.id === mid);

          // 2. 없으면 teamMembers에서 찾기
          if (!member) {
            const teamMember = teamMembersData.find(tm => tm.memberId === mid || tm.member?.id === mid);
            if (teamMember?.member) {
              member = teamMember.member;
            }
          }

          return member;
        }).filter((m): m is Member => m !== undefined);

        return {
          teamId: ta.teamId,
          team: storageManager.teams.find(t => t.id === ta.teamId),
          assigneeIds: ta.assigneeIds,
          assignees,
        };
      });

      const newProject: Project = {
        id: `project-${Date.now()}`,
        name: data.name,
        description: data.description,
        status: 'ACTIVE',
        startDate: data.startDate,
        endDate: data.endDate,
        owner: mockCurrentUser,
        teamId: data.teamId || data.teamIds?.[0],
        team: teams[0] ? { id: teams[0].id, name: teams[0].name, color: teams[0].color } : undefined,
        teamIds: data.teamIds || (data.teamId ? [data.teamId] : undefined),
        teams: teams.length > 0 ? teams : undefined,
        teamAssignments: teamAssignments,
        members: [],
        _count: { tasks: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const projects = storageManager.projects;
      projects.push(newProject);
      storageManager.projects = projects;
      return newProject;
    }
    return api.post<Project>('/projects.php', data);
  },
  update: async (id: string, data: Partial<Project> & {
    teamAssignments?: { teamId: string; assigneeIds: string[] }[];
  }): Promise<Project> => {
    if (USE_MOCK) {
      await delay(200);
      const projects = storageManager.projects;
      const teamsData = storageManager.teams;
      const membersData = storageManager.members;
      const teamMembersData = storageManager.teamMembers;
      const index = projects.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('프로젝트를 찾을 수 없습니다.');

      console.log('[API] projectsApi.update - input data:', data);
      console.log('[API] projectsApi.update - membersData:', membersData);
      console.log('[API] projectsApi.update - teamMembersData:', teamMembersData);

      // 다중 팀 정보 처리
      let teams: Team[] | undefined;
      let teamAssignments: import('@/types').ProjectTeamAssignment[] | undefined;

      if (data.teamIds) {
        teams = data.teamIds
          .map(tid => teamsData.find(t => t.id === tid))
          .filter((t): t is Team => t !== undefined);
      }

      if (data.teamAssignments) {
        teamAssignments = data.teamAssignments.map(ta => {
          // 먼저 members에서 찾고, 없으면 teamMembers에서 찾기
          const assignees = ta.assigneeIds.map(mid => {
            // 1. members 저장소에서 찾기
            let member = membersData.find(m => m.id === mid);

            // 2. 없으면 teamMembers에서 찾기
            if (!member) {
              const teamMember = teamMembersData.find(tm => tm.memberId === mid || tm.member?.id === mid);
              if (teamMember?.member) {
                member = teamMember.member;
              }
            }

            return member;
          }).filter((m): m is Member => m !== undefined);

          console.log('[API] projectsApi.update - team:', ta.teamId, 'assigneeIds:', ta.assigneeIds, 'resolved assignees:', assignees);

          return {
            teamId: ta.teamId,
            team: teamsData.find(t => t.id === ta.teamId),
            assigneeIds: ta.assigneeIds,
            assignees,
          };
        });
      }

      projects[index] = {
        ...projects[index],
        ...data,
        ...(teams && { teams }),
        ...(teams && teams[0] && { team: { id: teams[0].id, name: teams[0].name, color: teams[0].color } }),
        ...(teamAssignments && { teamAssignments }),
        updatedAt: new Date().toISOString(),
      };
      console.log('[API] Project update - final result:', projects[index]);
      storageManager.projects = projects;
      return projects[index];
    }
    return api.put<Project>(`/projects.php?id=${id}`, data);
  },
  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      await delay(200);
      const projects = storageManager.projects;
      const index = projects.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('프로젝트를 찾을 수 없습니다.');
      projects.splice(index, 1);
      storageManager.projects = projects;
      // 관련 태스크도 삭제
      const tasks = storageManager.tasks.filter((t) => t.projectId !== id);
      storageManager.tasks = tasks;
      return;
    }
    return api.delete(`/projects.php?id=${id}`);
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
      let filtered = [...storageManager.tasks];
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
    return api.get(`/tasks.php${query ? `?${query}` : ''}`);
  },
  get: async (id: string): Promise<Task> => {
    if (USE_MOCK) {
      await delay(200);
      const task = storageManager.tasks.find((t) => t.id === id);
      if (!task) throw new Error('업무를 찾을 수 없습니다.');
      return task;
    }
    return api.get(`/tasks.php?id=${id}`);
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
    parentId?: string;  // 하위 업무 생성 시 상위 업무 ID
  }): Promise<Task> => {
    if (USE_MOCK) {
      await delay(300);
      const tasks = storageManager.tasks;
      const projectsData = storageManager.projects;
      const membersData = storageManager.members;
      const project = projectsData.find((p) => p.id === data.projectId);
      // 다중 담당자 처리 (assigneeIds 우선, 없으면 assigneeId 사용)
      const assigneeIds = data.assigneeIds || (data.assigneeId ? [data.assigneeId] : []);
      const assignees = assigneeIds
        .map(id => membersData.find((m) => m.id === id))
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
        order: tasks.filter((t) => t.status === (data.status || 'TODO')).length,
        folderUrl: data.folderUrl,
        labels: [],
        _count: { subtasks: 0, comments: 0 },
        project: project ? { id: project.id, name: project.name } : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 하위 업무인 경우 부모 업무의 subtasks에 추가
      if (data.parentId) {
        const parentTask = tasks.find((t) => t.id === data.parentId);
        if (!parentTask) throw new Error('상위 업무를 찾을 수 없습니다.');
        if (!parentTask.subtasks) {
          parentTask.subtasks = [];
        }
        parentTask.subtasks.push(newTask);
        parentTask._count = {
          subtasks: (parentTask._count?.subtasks || 0) + 1,
          comments: parentTask._count?.comments || 0,
        };
      } else {
        // 일반 업무는 최상위에 추가
        tasks.push(newTask);
      }

      // 활동 로그 생성
      const currentMember = getCurrentMember();
      createActivityLog('created', newTask, currentMember);

      storageManager.tasks = tasks;
      return newTask;
    }
    return api.post<Task>('/tasks.php', data);
  },
  update: async (id: string, data: Partial<Task> & { assigneeIds?: string[] }): Promise<Task> => {
    if (USE_MOCK) {
      await delay(200);
      const tasks = storageManager.tasks;
      const membersData = storageManager.members;

      // assigneeIds가 있으면 assignees로 변환
      let assignees: Member[] | undefined;
      let assignee: Member | undefined;
      if (data.assigneeIds) {
        assignees = data.assigneeIds
          .map(memberId => membersData.find((m) => m.id === memberId))
          .filter((m): m is Member => m !== undefined);
        assignee = assignees[0];
      }

      // 최상위 task에서 찾기
      const index = tasks.findIndex((t) => t.id === id);
      if (index !== -1) {
        tasks[index] = {
          ...tasks[index],
          ...data,
          ...(assignees !== undefined && { assignees, assignee }),
          updatedAt: new Date().toISOString(),
        };

        // 활동 로그 생성
        const currentMember = getCurrentMember();
        createActivityLog('created', tasks[index], currentMember);

        storageManager.tasks = tasks;
        return tasks[index];
      }

      // subtask에서 찾기
      for (const task of tasks) {
        if (task.subtasks) {
          const subtaskIndex = task.subtasks.findIndex((st) => st.id === id);
          if (subtaskIndex !== -1) {
            task.subtasks[subtaskIndex] = {
              ...task.subtasks[subtaskIndex],
              ...data,
              ...(assignees !== undefined && { assignees, assignee }),
              updatedAt: new Date().toISOString(),
            };

            // 활동 로그 생성
            const currentMember = getCurrentMember();
            createActivityLog('updated', task.subtasks[subtaskIndex], currentMember);

            storageManager.tasks = tasks;
            return task.subtasks[subtaskIndex];
          }
        }
      }

      throw new Error('업무를 찾을 수 없습니다.');
    }
    return api.put<Task>(`/tasks.php?id=${id}`, data);
  },
  updateStatus: async (id: string, status: string, order?: number): Promise<Task> => {
    if (USE_MOCK) {
      await delay(200);
      const tasks = storageManager.tasks;

      // 최상위 task에서 찾기
      const taskIndex = tasks.findIndex((t) => t.id === id);
      if (taskIndex !== -1) {
        const previousStatus = tasks[taskIndex].status;
        tasks[taskIndex] = {
          ...tasks[taskIndex],
          status: status as TaskStatus,
          order: order ?? tasks[taskIndex].order,
          updatedAt: new Date().toISOString(),
        };

        // 활동 로그 생성 (상태 변경)
        const currentMember = getCurrentMember();
        createActivityLog('moved', tasks[taskIndex], currentMember, {
          from: previousStatus,
          to: status,
        });

        storageManager.tasks = tasks;
        return tasks[taskIndex];
      }

      // subtask에서 찾기
      for (const task of tasks) {
        if (task.subtasks) {
          const subtaskIndex = task.subtasks.findIndex((st) => st.id === id);
          if (subtaskIndex !== -1) {
            const previousStatus = task.subtasks[subtaskIndex].status;
            task.subtasks[subtaskIndex] = {
              ...task.subtasks[subtaskIndex],
              status: status as TaskStatus,
              order: order ?? task.subtasks[subtaskIndex].order,
              updatedAt: new Date().toISOString(),
            };

            // 활동 로그 생성 (상태 변경)
            const currentMember = getCurrentMember();
            createActivityLog('moved', task.subtasks[subtaskIndex], currentMember, {
              from: previousStatus,
              to: status,
            });

            storageManager.tasks = tasks;
            return task.subtasks[subtaskIndex];
          }
        }
      }

      throw new Error('업무를 찾을 수 없습니다.');
    }
    return api.patch(`/tasks.php?id=${id}&action=status`, { status, order });
  },
  updateOrder: (id: string, order: number) =>
    api.patch<Task>(`/tasks.php?id=${id}`, { order }),
  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      await delay(200);
      const tasks = storageManager.tasks;
      const index = tasks.findIndex((t) => t.id === id);
      if (index === -1) throw new Error('업무를 찾을 수 없습니다.');
      tasks.splice(index, 1);
      storageManager.tasks = tasks;
      return;
    }
    return api.delete(`/tasks.php?id=${id}`);
  },
  getComments: (taskId: string) =>
    api.get<import('@/types').Comment[]>(`/tasks.php?id=${taskId}&comments=1`),
  addComment: (taskId: string, content: string) =>
    api.post<import('@/types').Comment>(`/tasks.php?id=${taskId}&comments=1`, { content }),
};

// Members
export const membersApi = {
  list: async (): Promise<Member[]> => {
    if (USE_MOCK) {
      await delay(200);
      return storageManager.members;
    }
    return api.get('/members.php');
  },
  get: async (id: string): Promise<Member> => {
    if (USE_MOCK) {
      await delay(200);
      const member = storageManager.members.find((m) => m.id === id);
      if (!member) throw new Error('팀원을 찾을 수 없습니다.');
      return member;
    }
    return api.get(`/members.php?id=${id}`);
  },
  invite: async (email: string, role?: string): Promise<Member> => {
    if (USE_MOCK) {
      await delay(500);
      const members = storageManager.members;
      // 이미 존재하는 멤버인지 확인
      const existing = members.find((m) => m.email === email);
      if (existing) throw new Error('이미 등록된 이메일입니다.');

      const newMember: Member = {
        id: `member-${Date.now()}`,
        email,
        name: email.split('@')[0],
        department: '미지정',
        position: '팀원',
      };
      members.push(newMember);
      storageManager.members = members;
      return newMember;
    }
    return api.post<Member>('/members.php', { email, role });
  },
  update: async (id: string, data: Partial<Member>): Promise<Member> => {
    if (USE_MOCK) {
      await delay(200);
      const members = storageManager.members;
      const index = members.findIndex((m) => m.id === id);
      if (index === -1) throw new Error('팀원을 찾을 수 없습니다.');
      members[index] = { ...members[index], ...data };
      storageManager.members = members;
      return members[index];
    }
    return api.put<Member>(`/members.php?id=${id}`, data);
  },
  remove: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      await delay(200);
      const members = storageManager.members;
      const index = members.findIndex((m) => m.id === id);
      if (index === -1) throw new Error('팀원을 찾을 수 없습니다.');
      members.splice(index, 1);
      storageManager.members = members;
      return;
    }
    return api.delete(`/members.php?id=${id}`);
  },
  getTasks: (id: string) => api.get<Task[]>(`/tasks.php?assigneeId=${id}`),
  getWorkload: (id: string) =>
    api.get<{ todo: number; inProgress: number; review: number; done: number }>(`/dashboard.php?action=workload&memberId=${id}`),
};

// Dashboard
export const dashboardApi = {
  summary: async (): Promise<import('@/types').DashboardStats> => {
    if (USE_MOCK) {
      await delay(300);
      // storageManager.tasks를 기반으로 동적으로 통계 계산
      const now = new Date();
      const stats: import('@/types').DashboardStats = {
        total: storageManager.tasks.length,
        todo: storageManager.tasks.filter(t => t.status === 'TODO').length,
        inProgress: storageManager.tasks.filter(t => t.status === 'IN_PROGRESS').length,
        review: storageManager.tasks.filter(t => t.status === 'REVIEW').length,
        done: storageManager.tasks.filter(t => t.status === 'DONE').length,
        overdue: storageManager.tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE').length,
        projects: storageManager.projects.length,
        members: storageManager.members.length,
      };
      return stats;
    }
    return api.get<import('@/types').DashboardStats>('/dashboard.php?action=summary');
  },
  myTasks: async () => {
    if (USE_MOCK) {
      await delay(300);
      return storageManager.tasks.filter((t) => t.status !== 'DONE').slice(0, 5);
    }
    return api.get<Task[]>('/dashboard.php?action=my-tasks');
  },
  teamProgress: async (): Promise<import('@/types').TeamProgress[]> => {
    if (USE_MOCK) {
      await delay(300);
      // storageManager.members와 storageManager.tasks를 기반으로 동적 계산
      return storageManager.members.map(member => {
        const memberTasks = storageManager.tasks.filter(t => t.assignee?.id === member.id);
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
    return api.get<import('@/types').TeamProgress[]>('/dashboard.php?action=team-progress');
  },
  recentActivities: async () => {
    if (USE_MOCK) {
      await delay(300);
      // 최근 7일 이내 활동만 필터링
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return storageManager.activities.filter(
        (activity) => new Date(activity.createdAt) >= sevenDaysAgo
      );
    }
    return api.get<import('@/types').ActivityLog[]>('/dashboard.php?action=activities');
  },
};

// Teams
export const teamsApi = {
  list: async (): Promise<Team[]> => {
    if (USE_MOCK) {
      await delay(300);
      return storageManager.teams;
    }
    return api.get('/teams.php');
  },

  get: async (id: string): Promise<Team> => {
    if (USE_MOCK) {
      await delay(200);
      const team = storageManager.teams.find((t) => t.id === id);
      if (!team) throw new Error('팀을 찾을 수 없습니다.');
      return team;
    }
    return api.get(`/teams.php?id=${id}`);
  },

  create: async (data: CreateTeamInput): Promise<Team> => {
    if (USE_MOCK) {
      await delay(300);
      const teams = storageManager.teams;
      const membersData = storageManager.members;
      const teamMembersData = storageManager.teamMembers;
      const leader = data.leaderId ? membersData.find((m) => m.id === data.leaderId) : undefined;
      const newTeam: Team = {
        id: `team-${Date.now()}`,
        name: data.name,
        description: data.description,
        color: data.color,
        leaderId: data.leaderId,
        leader,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      teams.push(newTeam);

      // 리더가 있으면 자동으로 팀 멤버로 추가
      if (data.leaderId && leader) {
        const newTeamMember: TeamMember = {
          id: `tm-${Date.now()}`,
          teamId: newTeam.id,
          memberId: data.leaderId,
          role: 'LEADER',
          member: leader,
          joinedAt: new Date().toISOString(),
        };
        teamMembersData.push(newTeamMember);
        storageManager.teamMembers = teamMembersData;
      }

      storageManager.teams = teams;
      return newTeam;
    }
    return api.post<Team>('/teams.php', data);
  },

  update: async (id: string, data: Partial<Team>): Promise<Team> => {
    if (USE_MOCK) {
      await delay(200);
      const teams = storageManager.teams;
      const index = teams.findIndex((t) => t.id === id);
      if (index === -1) throw new Error('팀을 찾을 수 없습니다.');
      teams[index] = {
        ...teams[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      storageManager.teams = teams;
      return teams[index];
    }
    return api.put<Team>(`/teams.php?id=${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      await delay(200);
      const teams = storageManager.teams;
      const index = teams.findIndex((t) => t.id === id);
      if (index === -1) throw new Error('팀을 찾을 수 없습니다.');
      teams.splice(index, 1);
      storageManager.teams = teams;
      // 관련 팀 멤버도 삭제
      const teamMembers = storageManager.teamMembers.filter((tm) => tm.teamId !== id);
      storageManager.teamMembers = teamMembers;
      return;
    }
    return api.delete(`/teams.php?id=${id}`);
  },

  // Team Member 관리
  getMembers: async (teamId: string): Promise<TeamMember[]> => {
    if (USE_MOCK) {
      await delay(200);
      return storageManager.teamMembers.filter((tm) => tm.teamId === teamId);
    }
    return api.get(`/teams.php?id=${teamId}&members=1`);
  },

  addMember: async (teamId: string, memberId: string, role: TeamMemberRole = 'MEMBER'): Promise<TeamMember> => {
    if (USE_MOCK) {
      await delay(300);
      const teamMembers = storageManager.teamMembers;
      const membersData = storageManager.members;
      // 이미 멤버인지 확인
      const existing = teamMembers.find((tm) => tm.teamId === teamId && tm.memberId === memberId);
      if (existing) throw new Error('이미 팀에 속한 멤버입니다.');

      const member = membersData.find((m) => m.id === memberId);
      if (!member) throw new Error('멤버를 찾을 수 없습니다.');

      const newTeamMember: TeamMember = {
        id: `tm-${Date.now()}`,
        teamId,
        memberId,
        role,
        member,
        joinedAt: new Date().toISOString(),
      };
      teamMembers.push(newTeamMember);
      storageManager.teamMembers = teamMembers;
      return newTeamMember;
    }
    return api.post<TeamMember>(`/teams.php?id=${teamId}&members=1`, { memberId, role });
  },

  removeMember: async (teamId: string, memberId: string): Promise<void> => {
    if (USE_MOCK) {
      await delay(200);
      const teamMembers = storageManager.teamMembers;
      const index = teamMembers.findIndex((tm) => tm.teamId === teamId && tm.memberId === memberId);
      if (index === -1) throw new Error('팀 멤버를 찾을 수 없습니다.');
      teamMembers.splice(index, 1);
      storageManager.teamMembers = teamMembers;
      return;
    }
    return api.delete(`/teams.php?id=${teamId}&memberId=${memberId}`);
  },

  updateMemberRole: async (teamId: string, memberId: string, role: TeamMemberRole): Promise<TeamMember> => {
    if (USE_MOCK) {
      await delay(200);
      const teamMembers = storageManager.teamMembers;
      const index = teamMembers.findIndex((tm) => tm.teamId === teamId && tm.memberId === memberId);
      if (index === -1) throw new Error('팀 멤버를 찾을 수 없습니다.');
      teamMembers[index] = {
        ...teamMembers[index],
        role,
      };
      storageManager.teamMembers = teamMembers;
      return teamMembers[index];
    }
    return api.patch<TeamMember>(`/teams.php?id=${teamId}&memberId=${memberId}`, { role });
  },

  // 팀원의 업무 조회
  getMemberTasks: async (teamId: string, memberId: string): Promise<Task[]> => {
    if (USE_MOCK) {
      await delay(200);
      // 해당 팀 멤버인지 확인
      const teamMember = storageManager.teamMembers.find((tm) => tm.teamId === teamId && tm.memberId === memberId);
      if (!teamMember) throw new Error('팀 멤버를 찾을 수 없습니다.');

      // 해당 멤버에게 할당된 모든 업무 반환
      return storageManager.tasks.filter((t) => t.assignee?.id === memberId);
    }
    return api.get(`/tasks.php?assigneeId=${memberId}`);
  },
};

// Routine Tasks (루틴 업무)
export const routineTasksApi = {
  // 요일별 루틴 목록 (dayOfWeek: 0=일, 1=월, ..., 6=토, 없으면 오늘)
  listByDay: async (params?: { personal?: boolean; dayOfWeek?: number }): Promise<RoutineTask[]> => {
    if (USE_MOCK) {
      await delay(300);
      return [];
    }
    const searchParams = new URLSearchParams();
    if (params?.personal) searchParams.set('personal', '1');
    if (params?.dayOfWeek !== undefined) searchParams.set('dayOfWeek', params.dayOfWeek.toString());
    const query = searchParams.toString();
    return api.get(`/routine_tasks.php${query ? `?${query}` : ''}`);
  },

  // 오늘의 루틴 목록 (오늘 요일에 해당하는 루틴)
  listToday: async (params?: { personal?: boolean }): Promise<RoutineTask[]> => {
    if (USE_MOCK) {
      await delay(300);
      // Mock 데이터는 빈 배열 반환 (실제 서버 사용)
      return [];
    }
    const searchParams = new URLSearchParams();
    if (params?.personal) searchParams.set('personal', '1');
    const query = searchParams.toString();
    return api.get(`/routine_tasks.php${query ? `?${query}` : ''}`);
  },

  // 전체 루틴 목록
  listAll: async (params?: { projectId?: string; personal?: boolean }): Promise<RoutineTask[]> => {
    if (USE_MOCK) {
      await delay(300);
      return [];
    }
    const searchParams = new URLSearchParams({ all: '1' });
    if (params?.projectId) searchParams.set('projectId', params.projectId);
    if (params?.personal) searchParams.set('personal', '1');
    return api.get(`/routine_tasks.php?${searchParams.toString()}`);
  },

  // 프로젝트 루틴 목록
  listByProject: async (projectId: string): Promise<RoutineTask[]> => {
    if (USE_MOCK) {
      await delay(300);
      return [];
    }
    return api.get(`/routine_tasks.php?projectId=${projectId}`);
  },

  // 루틴 상세 조회
  get: async (id: string): Promise<RoutineTask> => {
    if (USE_MOCK) {
      await delay(200);
      throw new Error('루틴을 찾을 수 없습니다.');
    }
    return api.get(`/routine_tasks.php?id=${id}`);
  },

  // 루틴 생성
  create: async (data: CreateRoutineInput): Promise<RoutineTask> => {
    if (USE_MOCK) {
      await delay(300);
      throw new Error('Mock 모드에서는 루틴 생성이 지원되지 않습니다.');
    }
    return api.post<RoutineTask>('/routine_tasks.php', data);
  },

  // 루틴 수정
  update: async (id: string, data: Partial<CreateRoutineInput> & { isActive?: boolean }): Promise<RoutineTask> => {
    if (USE_MOCK) {
      await delay(200);
      throw new Error('Mock 모드에서는 루틴 수정이 지원되지 않습니다.');
    }
    return api.put<RoutineTask>(`/routine_tasks.php?id=${id}`, data);
  },

  // 루틴 삭제
  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      await delay(200);
      return;
    }
    return api.delete(`/routine_tasks.php?id=${id}`);
  },

  // 루틴 완료 체크
  complete: async (id: string): Promise<{ success: boolean; completed: boolean; date: string }> => {
    if (USE_MOCK) {
      await delay(200);
      return { success: true, completed: true, date: new Date().toISOString().split('T')[0] };
    }
    return api.patch(`/routine_tasks.php?id=${id}&action=complete`, {});
  },

  // 루틴 완료 취소
  uncomplete: async (id: string): Promise<{ success: boolean; completed: boolean; date: string }> => {
    if (USE_MOCK) {
      await delay(200);
      return { success: true, completed: false, date: new Date().toISOString().split('T')[0] };
    }
    return api.patch(`/routine_tasks.php?id=${id}&action=uncomplete`, {});
  },
};
