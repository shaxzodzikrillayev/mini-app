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
  linkEmail: (email: string, password: string) => Promise<boolean>;
  setEmail: (data: { email: string; password: string; confirm: string }) => Promise<boolean>;
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
    const hasTelegram = !!getTelegramUser()?.id;
    const token = get().token;

    // A stored email session token takes precedence. This also lets a linked
    // email account be used even when the Mini App runs inside Telegram.
    if (token) {
      try {
        const user = await api.get<AppUser>('/auth/me', token);
        set({ user, isTelegram: false });
        set({ hydrated: true });
        return;
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        set({ token: null });
      }
    }

    if (hasTelegram) {
      // Telegram session: fetch/create the linked profile.
      try {
        const me = await api.get<{ user: AppUser; orderCount: number; activeProjects: number }>('/me');
        set({ user: me.user, isTelegram: true });
      } catch {
        /* will re-create on first authed action */
      }
    } else {
      // Browser/development preview (no Telegram, no stored token):
      // Must register/login first. No auto-login.
      // The RequireAuth guard in App.tsx will redirect to /login.
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

  // Link an existing email account to the current Telegram user session.
  linkEmail: async (email, password) => {
    try {
      const res = await api.post<{ token: string; user: AppUser; ok: boolean }>('/auth/link-email', { email, password });
      // Store the email session token so future requests use the linked account.
      localStorage.setItem(TOKEN_KEY, res.token);
      set({ user: res.user, token: res.token, isTelegram: false });
      toast.success('Аккаунт успешно привязан');
      return true;
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось привязать аккаунт');
      return false;
    }
  },

  // Create a password + email for a Telegram-only account.
  setEmail: async (data) => {
    try {
      const res = await api.post<{ token: string; user: AppUser; ok: boolean }>('/auth/set-email', data);
      localStorage.setItem(TOKEN_KEY, res.token);
      set({ user: res.user, token: res.token, isTelegram: false });
      toast.success('Email и пароль созданы');
      return true;
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось создать email');
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
