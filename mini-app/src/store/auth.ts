import { create } from 'zustand';
import { api } from '../lib/api';
import { getTelegramUser } from '../lib/telegram';
import { AppUser } from '../lib/types';
import { toast } from './toast';

interface AuthState {
  user: AppUser | null;
  token: string | null;
  hydrated: boolean;
  isTelegram: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { firstName: string; username?: string; email: string; password: string; confirm: string }) => Promise<boolean>;
  logout: () => void;
  setUser: (u: AppUser) => void;
}

const TOKEN_KEY = 'sws_token';

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  hydrated: false,
  isTelegram: false,

  init: async () => {
    const isTelegram = !!getTelegramUser()?.id;
    const token = get().token;

    // If we have a stored email session token, try to load the user.
    if (token && !isTelegram) {
      try {
        const user = await api.get<AppUser>('/auth/me', token);
        set({ user, isTelegram: false });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        set({ token: null });
      }
    } else if (isTelegram) {
      // Telegram session: fetch/create the linked profile.
      try {
        const me = await api.get<{ user: AppUser; orderCount: number; activeProjects: number }>('/me');
        set({ user: me.user, isTelegram: true });
      } catch {
        /* will re-create on first authed action */
      }
    } else {
      // Browser/development preview (no Telegram, no stored token): the
      // backend resolves the X-Dev-User development header, so the profile
      // and protected pages render in plain-browser screenshots too.
      try {
        const me = await api.get<{ user: AppUser; orderCount: number; activeProjects: number }>('/me');
        set({ user: me.user, isTelegram: false });
      } catch {
        /* unauthenticated browser visitor */
      }
    }

    set({ hydrated: true });
  },

  login: async (email, password) => {
    try {
      const res = await api.post<{ token: string; user: AppUser }>('/auth/login', { email, password });
      localStorage.setItem(TOKEN_KEY, res.token);
      set({ user: res.user, token: res.token, isTelegram: false });
      return true;
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось войти');
      return false;
    }
  },

  register: async (data) => {
    try {
      const res = await api.post<{ token: string; user: AppUser }>('/auth/register', data);
      localStorage.setItem(TOKEN_KEY, res.token);
      set({ user: res.user, token: res.token, isTelegram: false });
      return true;
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось зарегистрироваться');
      return false;
    }
  },

  logout: () => {
    api.post('/auth/logout', {}).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, token: null });
    toast.info('Вы вышли из аккаунта');
  },

  setUser: (u) => set({ user: u }),
}));
