import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Member } from '@/types';

interface AuthState {
  token: string | null;
  member: Member | null;
  isAuthenticated: boolean;
  login: (token: string, member: Member) => void;
  logout: () => void;
  setMember: (member: Member) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      member: null,
      isAuthenticated: false,
      login: (token, member) => {
        localStorage.setItem('token', token);
        set({ token, member, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, member: null, isAuthenticated: false });
      },
      setMember: (member) => set({ member }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, member: state.member, isAuthenticated: state.isAuthenticated }),
    }
  )
);
