import { create } from 'zustand';

export interface Toast {
  id: number;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}

interface ToastState {
  toasts: Toast[];
  show: (t: Omit<Toast, 'id'>) => number;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  show: (t) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, 3500);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (title: string, description?: string) =>
    useToast.getState().show({ title, description, type: 'success' }),
  error: (title: string, description?: string) =>
    useToast.getState().show({ title, description, type: 'error' }),
  info: (title: string, description?: string) =>
    useToast.getState().show({ title, description, type: 'info' }),
};
