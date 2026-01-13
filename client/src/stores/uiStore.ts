import { create } from 'zustand';
import type { Task, Project } from '@/types';

interface UIState {
  // Task Modal
  isTaskModalOpen: boolean;
  editingTask: Task | null;
  taskModalProjectId: string | null;

  // Project Modal
  isProjectModalOpen: boolean;
  editingProject: Project | null;

  // Invite Member Modal
  isInviteMemberModalOpen: boolean;

  // Confirm Modal
  isConfirmModalOpen: boolean;
  confirmModalConfig: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null;

  // Actions
  openCreateTaskModal: (projectId?: string) => void;
  openEditTaskModal: (task: Task) => void;
  closeTaskModal: () => void;

  openCreateProjectModal: () => void;
  openEditProjectModal: (project: Project) => void;
  closeProjectModal: () => void;

  openInviteMemberModal: () => void;
  closeInviteMemberModal: () => void;

  openConfirmModal: (config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }) => void;
  closeConfirmModal: () => void;

  closeAllModals: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isTaskModalOpen: false,
  editingTask: null,
  taskModalProjectId: null,

  isProjectModalOpen: false,
  editingProject: null,

  isInviteMemberModalOpen: false,

  isConfirmModalOpen: false,
  confirmModalConfig: null,

  // Task Modal Actions
  openCreateTaskModal: (projectId?: string) =>
    set({
      isTaskModalOpen: true,
      editingTask: null,
      taskModalProjectId: projectId || null,
    }),

  openEditTaskModal: (task: Task) =>
    set({
      isTaskModalOpen: true,
      editingTask: task,
      taskModalProjectId: task.projectId,
    }),

  closeTaskModal: () =>
    set({
      isTaskModalOpen: false,
      editingTask: null,
      taskModalProjectId: null,
    }),

  // Project Modal Actions
  openCreateProjectModal: () =>
    set({
      isProjectModalOpen: true,
      editingProject: null,
    }),

  openEditProjectModal: (project: Project) =>
    set({
      isProjectModalOpen: true,
      editingProject: project,
    }),

  closeProjectModal: () =>
    set({
      isProjectModalOpen: false,
      editingProject: null,
    }),

  // Invite Member Modal Actions
  openInviteMemberModal: () =>
    set({
      isInviteMemberModalOpen: true,
    }),

  closeInviteMemberModal: () =>
    set({
      isInviteMemberModalOpen: false,
    }),

  // Confirm Modal Actions
  openConfirmModal: (config) =>
    set({
      isConfirmModalOpen: true,
      confirmModalConfig: config,
    }),

  closeConfirmModal: () =>
    set({
      isConfirmModalOpen: false,
      confirmModalConfig: null,
    }),

  // Close All Modals
  closeAllModals: () =>
    set({
      isTaskModalOpen: false,
      editingTask: null,
      taskModalProjectId: null,
      isProjectModalOpen: false,
      editingProject: null,
      isInviteMemberModalOpen: false,
      isConfirmModalOpen: false,
      confirmModalConfig: null,
    }),
}));
