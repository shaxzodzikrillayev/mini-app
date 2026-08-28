import { create } from 'zustand';
import {
  applyColorScheme,
  applyThemeParams,
  bindTelegramThemeEvents,
  getColorScheme,
  getWebApp,
} from '../lib/telegram';

interface ThemeState {
  scheme: 'light' | 'dark';
  setScheme: (s: 'light' | 'dark') => void;
}

export const useTheme = create<ThemeState>((set) => ({
  scheme: getColorScheme(),
  setScheme: (scheme) => set({ scheme }),
}));

/**
 * Apply the Telegram theme (colors + color scheme) to the document and stay
 * in sync when Telegram pushes themeChanged / colorSchemeChanged events.
 */
export function initThemeListener(): void {
  const wa = getWebApp();
  const scheme = wa?.colorScheme || 'light';

  applyColorScheme(scheme);
  applyThemeParams(wa?.themeParams);
  useTheme.getState().setScheme(scheme);

  bindTelegramThemeEvents((s) => useTheme.getState().setScheme(s));
}
