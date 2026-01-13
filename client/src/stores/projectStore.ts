import { create } from 'zustand';
import type { Project } from '@/types';
import { projectsApi } from '@/services/api';

export interface CreateProjectInput {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  addProject: (data: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
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
      set({ error: (error as Error).message, loading: false });
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
      return newProject;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateProject: async (id: string, data: Partial<Project>) => {
    const previousProjects = get().projects;

    // Optimistic update
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id ? { ...project, ...data, updatedAt: new Date().toISOString() } : project
      ),
    }));

    try {
      await projectsApi.update(id, data);
    } catch (error) {
      // Rollback on error
      set({ projects: previousProjects, error: (error as Error).message });
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
    } catch (error) {
      // Rollback on error
      set({ projects: previousProjects, error: (error as Error).message });
      throw error;
    }
  },

  setCurrentProject: (project: Project | null) => set({ currentProject: project }),

  getProjectById: (id: string) => {
    return get().projects.find((project) => project.id === id);
  },
}));
