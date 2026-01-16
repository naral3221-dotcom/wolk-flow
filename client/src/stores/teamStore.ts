import { create } from 'zustand';
import type { Team, TeamMember, TeamMemberRole, CreateTeamInput } from '@/types';
import { teamsApi } from '@/services/api';

interface TeamState {
  // State
  teams: Team[];
  teamMembers: Map<string, TeamMember[]>; // teamId -> members
  currentTeam: Team | null;
  loading: boolean;
  error: string | null;

  // Team CRUD Actions
  fetchTeams: () => Promise<void>;
  addTeam: (data: CreateTeamInput) => Promise<Team>;
  updateTeam: (id: string, data: Partial<Team>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  setCurrentTeam: (team: Team | null) => void;

  // Team Member Actions
  fetchTeamMembers: (teamId: string) => Promise<void>;
  addMemberToTeam: (teamId: string, memberId: string, role?: TeamMemberRole) => Promise<void>;
  removeMemberFromTeam: (teamId: string, memberId: string) => Promise<void>;
  updateMemberRole: (teamId: string, memberId: string, role: TeamMemberRole) => Promise<void>;

  // Selectors
  getTeamById: (id: string) => Team | undefined;
  getTeamMembers: (teamId: string) => TeamMember[];
  getMemberTeams: (memberId: string) => Team[];
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  teamMembers: new Map(),
  currentTeam: null,
  loading: false,
  error: null,

  // Team CRUD
  fetchTeams: async () => {
    set({ loading: true, error: null });
    try {
      const teams = await teamsApi.list();
      set({ teams, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addTeam: async (data: CreateTeamInput) => {
    set({ loading: true, error: null });
    try {
      const newTeam = await teamsApi.create(data);
      set((state) => ({
        teams: [...state.teams, newTeam],
        loading: false,
      }));
      return newTeam;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateTeam: async (id: string, data: Partial<Team>) => {
    const previousTeams = get().teams;

    // Optimistic update
    set((state) => ({
      teams: state.teams.map((team) =>
        team.id === id ? { ...team, ...data, updatedAt: new Date().toISOString() } : team
      ),
    }));

    try {
      await teamsApi.update(id, data);
    } catch (error) {
      // Rollback
      set({ teams: previousTeams, error: (error as Error).message });
      throw error;
    }
  },

  deleteTeam: async (id: string) => {
    const previousTeams = get().teams;
    const previousTeamMembers = new Map(get().teamMembers);

    // Optimistic update
    set((state) => {
      const newTeamMembers = new Map(state.teamMembers);
      newTeamMembers.delete(id);
      return {
        teams: state.teams.filter((team) => team.id !== id),
        teamMembers: newTeamMembers,
        currentTeam: state.currentTeam?.id === id ? null : state.currentTeam,
      };
    });

    try {
      await teamsApi.delete(id);
    } catch (error) {
      // Rollback
      set({ teams: previousTeams, teamMembers: previousTeamMembers, error: (error as Error).message });
      throw error;
    }
  },

  setCurrentTeam: (team: Team | null) => {
    set({ currentTeam: team });
  },

  // Team Member Actions
  fetchTeamMembers: async (teamId: string) => {
    set({ loading: true, error: null });
    try {
      const members = await teamsApi.getMembers(teamId);
      set((state) => {
        const newTeamMembers = new Map(state.teamMembers);
        newTeamMembers.set(teamId, members);
        return { teamMembers: newTeamMembers, loading: false };
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addMemberToTeam: async (teamId: string, memberId: string, role: TeamMemberRole = 'MEMBER') => {
    set({ loading: true, error: null });
    try {
      const newMember = await teamsApi.addMember(teamId, memberId, role);
      set((state) => {
        const newTeamMembers = new Map(state.teamMembers);
        const currentMembers = newTeamMembers.get(teamId) || [];
        newTeamMembers.set(teamId, [...currentMembers, newMember]);
        return { teamMembers: newTeamMembers, loading: false };
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  removeMemberFromTeam: async (teamId: string, memberId: string) => {
    const previousTeamMembers = new Map(get().teamMembers);

    // Optimistic update
    set((state) => {
      const newTeamMembers = new Map(state.teamMembers);
      const currentMembers = newTeamMembers.get(teamId) || [];
      newTeamMembers.set(
        teamId,
        currentMembers.filter((m) => m.memberId !== memberId)
      );
      return { teamMembers: newTeamMembers };
    });

    try {
      await teamsApi.removeMember(teamId, memberId);
    } catch (error) {
      // Rollback
      set({ teamMembers: previousTeamMembers, error: (error as Error).message });
      throw error;
    }
  },

  updateMemberRole: async (teamId: string, memberId: string, role: TeamMemberRole) => {
    const previousTeamMembers = new Map(get().teamMembers);

    // Optimistic update
    set((state) => {
      const newTeamMembers = new Map(state.teamMembers);
      const currentMembers = newTeamMembers.get(teamId) || [];
      newTeamMembers.set(
        teamId,
        currentMembers.map((m) => (m.memberId === memberId ? { ...m, role } : m))
      );
      return { teamMembers: newTeamMembers };
    });

    try {
      await teamsApi.updateMemberRole(teamId, memberId, role);
    } catch (error) {
      // Rollback
      set({ teamMembers: previousTeamMembers, error: (error as Error).message });
      throw error;
    }
  },

  // Selectors
  getTeamById: (id: string) => {
    return get().teams.find((team) => team.id === id);
  },

  getTeamMembers: (teamId: string) => {
    return get().teamMembers.get(teamId) || [];
  },

  getMemberTeams: (memberId: string) => {
    const { teams, teamMembers } = get();
    const memberTeamIds: string[] = [];

    teamMembers.forEach((members, teamId) => {
      if (members.some((m) => m.memberId === memberId)) {
        memberTeamIds.push(teamId);
      }
    });

    return teams.filter((team) => memberTeamIds.includes(team.id));
  },
}));
