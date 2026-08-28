import { create } from 'zustand';
import { api } from '../lib/api';

interface AuthState {
  token: string | null;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  init: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  username: null,
  init: () => {
    const token = localStorage.getItem('sws_admin_token');
    const username = localStorage.getItem('sws_admin_user');
    if (token) set({ token, username });
  },
  login: async (username, password) => {
    const data = await api.login<{ token: string; username: string }>('/login', { username, password });
    localStorage.setItem('sws_admin_token', data.token);
    localStorage.setItem('sws_admin_user', data.username);
    set({ token: data.token, username: data.username });
  },
  logout: () => {
    localStorage.removeItem('sws_admin_token');
    localStorage.removeItem('sws_admin_user');
    set({ token: null, username: null });
  },
}));
