import { create } from 'zustand';
import type { Project } from '@/types';
import { projectsApi } from '@/services/api';
import { toast } from '@/stores/toastStore';

export interface TeamAssignmentInput {
  teamId: string;
  assigneeIds: string[];
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  teamId?: string;  // 단일 팀 (하위 호환)
  teamIds?: string[];  // 다중 팀
  teamAssignments?: TeamAssignmentInput[];  // 팀별 담당자 매핑
}

export interface UpdateProjectInput extends Partial<Project> {
  teamAssignments?: TeamAssignmentInput[];
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  addProject: (data: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectInput) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;

  // Selectors
  getProjectById: (id: string) => Project | undefined;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await projectsApi.list();
      set({ projects, loading: false });
    } catch (error) {
      const message = (error as Error).message;
      set({ error: message, loading: false });
      toast.error('프로젝트 목록 로드 실패', message);
    }
  },

  addProject: async (data: CreateProjectInput) => {
    set({ loading: true, error: null });
    try {
      const newProject = await projectsApi.create(data);
      set((state) => ({
        projects: [...state.projects, newProject],
        loading: false,
      }));
      toast.success('프로젝트 생성 완료', `"${newProject.name}" 프로젝트가 생성되었습니다.`);
      return newProject;
    } catch (error) {
      const message = (error as Error).message;
      set({ error: message, loading: false });
      toast.error('프로젝트 생성 실패', message);
      throw error;
    }
  },

  updateProject: async (id: string, data: UpdateProjectInput) => {
    const previousProjects = get().projects;

    // Optimistic update
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id ? { ...project, ...data, updatedAt: new Date().toISOString() } : project
      ),
    }));

    try {
      console.log('[ProjectStore] updateProject called:', id, data);
      const updatedProject = await projectsApi.update(id, data);
      console.log('[ProjectStore] updateProject result:', updatedProject);

      // API에서 반환된 최신 데이터로 상태 업데이트
      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === id ? updatedProject : project
        ),
      }));
      toast.success('프로젝트 수정 완료', '프로젝트가 성공적으로 수정되었습니다.');
    } catch (error) {
      // Rollback on error
      const message = (error as Error).message;
      set({ projects: previousProjects, error: message });
      toast.error('프로젝트 수정 실패', message);
      throw error;
    }
  },

  deleteProject: async (id: string) => {
    const previousProjects = get().projects;

    // Optimistic update
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }));

    try {
      await projectsApi.delete(id);
      toast.success('프로젝트 삭제 완료', '프로젝트가 삭제되었습니다.');
    } catch (error) {
      // Rollback on error
      const message = (error as Error).message;
      set({ projects: previousProjects, error: message });
      toast.error('프로젝트 삭제 실패', message);
      throw error;
    }
  },

  setCurrentProject: (project: Project | null) => set({ currentProject: project }),

  getProjectById: (id: string) => {
    return get().projects.find((project) => project.id === id);
  },
}));
