import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserInfo {
  id: string;
  email: string;
  nomComplet: string;
  roles: string[];
}

interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: UserInfo, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null });
      },
      hasRole: (role) => get().user?.roles.includes(role) ?? false,
    }),
    {
      name: 'auth',
      // Ne persister que les infos utilisateur, jamais les tokens (XSS risk)
      partialize: (state) => ({ user: state.user }),
    }
  )
);
