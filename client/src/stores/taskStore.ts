import { create } from 'zustand';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { tasksApi } from '@/services/api';

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;  // 단일 담당자 (하위 호환)
  assigneeIds?: string[];  // 다중 담당자
  startDate?: string;
  dueDate?: string;
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchTasks: (projectId?: string) => Promise<void>;
  addTask: (data: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task> & { assigneeIds?: string[] }) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setTasks: (tasks: Task[]) => void;

  // Selectors
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByProject: (projectId: string) => Task[];
  getTasksByAssignee: (assigneeId: string) => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async (projectId?: string) => {
    set({ loading: true, error: null });
    try {
      const tasks = await tasksApi.list(projectId ? { projectId } : undefined);
      set({ tasks, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addTask: async (data: CreateTaskInput) => {
    set({ loading: true, error: null });
    try {
      const newTask = await tasksApi.create(data);
      set((state) => ({
        tasks: [...state.tasks, newTask],
        loading: false,
      }));
      return newTask;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateTask: async (id: string, data: Partial<Task> & { assigneeIds?: string[] }) => {
    const previousTasks = get().tasks;

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...data, updatedAt: new Date().toISOString() } : task
      ),
    }));

    try {
      await tasksApi.update(id, data);
    } catch (error) {
      // Rollback on error
      set({ tasks: previousTasks, error: (error as Error).message });
      throw error;
    }
  },

  updateTaskStatus: async (id: string, status: TaskStatus) => {
    const previousTasks = get().tasks;

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, status, updatedAt: new Date().toISOString() } : task
      ),
    }));

    try {
      await tasksApi.updateStatus(id, status);
    } catch (error) {
      // Rollback on error
      set({ tasks: previousTasks, error: (error as Error).message });
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    const previousTasks = get().tasks;

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));

    try {
      await tasksApi.delete(id);
    } catch (error) {
      // Rollback on error
      set({ tasks: previousTasks, error: (error as Error).message });
      throw error;
    }
  },

  setTasks: (tasks: Task[]) => set({ tasks }),

  getTasksByStatus: (status: TaskStatus) => {
    return get().tasks.filter((task) => task.status === status);
  },

  getTasksByProject: (projectId: string) => {
    return get().tasks.filter((task) => task.projectId === projectId);
  },

  getTasksByAssignee: (assigneeId: string) => {
    return get().tasks.filter((task) => task.assignee?.id === assigneeId);
  },
}));
