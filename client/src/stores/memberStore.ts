import { create } from 'zustand';
import type { Member, Task } from '@/types';
import { membersApi } from '@/services/api';

export interface MemberWithStats extends Member {
  taskStats: {
    todo: number;
    inProgress: number;
    review: number;
    done: number;
    total: number;
  };
}

interface MemberState {
  members: Member[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchMembers: () => Promise<void>;
  inviteMember: (email: string, role?: string) => Promise<Member>;
  updateMember: (id: string, data: Partial<Member>) => Promise<void>;
  removeMember: (id: string) => Promise<void>;

  // Selectors
  getMemberById: (id: string) => Member | undefined;
  getMembersWithTaskStats: (tasks: Task[]) => MemberWithStats[];
}

export const useMemberStore = create<MemberState>((set, get) => ({
  members: [],
  loading: false,
  error: null,

  fetchMembers: async () => {
    set({ loading: true, error: null });
    try {
      const members = await membersApi.list();
      set({ members, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  inviteMember: async (email: string, role?: string) => {
    set({ loading: true, error: null });
    try {
      const newMember = await membersApi.invite(email, role);
      set((state) => ({
        members: [...state.members, newMember],
        loading: false,
      }));
      return newMember;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateMember: async (id: string, data: Partial<Member>) => {
    const previousMembers = get().members;

    // Optimistic update
    set((state) => ({
      members: state.members.map((member) =>
        member.id === id ? { ...member, ...data } : member
      ),
    }));

    try {
      await membersApi.update(id, data);
    } catch (error) {
      // Rollback on error
      set({ members: previousMembers, error: (error as Error).message });
      throw error;
    }
  },

  removeMember: async (id: string) => {
    const previousMembers = get().members;

    // Optimistic update
    set((state) => ({
      members: state.members.filter((member) => member.id !== id),
    }));

    try {
      await membersApi.remove(id);
    } catch (error) {
      // Rollback on error
      set({ members: previousMembers, error: (error as Error).message });
      throw error;
    }
  },

  getMemberById: (id: string) => {
    return get().members.find((member) => member.id === id);
  },

  getMembersWithTaskStats: (tasks: Task[]) => {
    const members = get().members;
    return members.map((member) => {
      const memberTasks = tasks.filter((task) => task.assignee?.id === member.id);
      return {
        ...member,
        taskStats: {
          todo: memberTasks.filter((t) => t.status === 'TODO').length,
          inProgress: memberTasks.filter((t) => t.status === 'IN_PROGRESS').length,
          review: memberTasks.filter((t) => t.status === 'REVIEW').length,
          done: memberTasks.filter((t) => t.status === 'DONE').length,
          total: memberTasks.length,
        },
      };
    });
  },
}));
