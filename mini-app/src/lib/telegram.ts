// Minimal typed wrapper around the Telegram Mini Apps WebApp SDK.
// Falls back gracefully when not running inside Telegram (browser preview).

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TgThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  section_separator_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: {
    user?: TelegramUser;
    start_param?: string;
  };
  colorScheme: 'light' | 'dark';
  themeParams: TgThemeParams;
  ready: () => void;
  expand: () => void;
  openLink?: (url: string) => void;
  openTelegramLink?: (url: string) => void;
  showAlert?: (msg: string, cb?: () => void) => void;
  HapticFeedback?: {
    notificationOccurred?: (type: 'error' | 'success' | 'warning') => void;
    impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  };
  close?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  version?: string;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getWebApp(): TelegramWebApp | undefined {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
}

export function isTelegram(): boolean {
  return !!getWebApp()?.initData;
}

export function getInitData(): string {
  return getWebApp()?.initData || '';
}

export function getTelegramUser(): TelegramUser | null {
  return getWebApp()?.initDataUnsafe?.user || null;
}

export function getColorScheme(): 'light' | 'dark' {
  return getWebApp()?.colorScheme || 'light';
}

const THEME_CSS_MAP: Record<string, string> = {
  bg_color: '--tg-theme-bg-color',
  text_color: '--tg-theme-text-color',
  hint_color: '--tg-theme-hint-color',
  link_color: '--tg-theme-link-color',
  button_color: '--tg-theme-button-color',
  button_text_color: '--tg-theme-button-text-color',
  secondary_bg_color: '--tg-theme-secondary-bg-color',
  section_bg_color: '--tg-theme-section-bg-color',
  section_header_text_color: '--tg-theme-section-header-text-color',
  section_separator_color: '--tg-theme-section-separator-color',
  subtitle_text_color: '--tg-theme-subtitle-text-color',
  destructive_text_color: '--tg-theme-destructive-text-color',
};

/** Apply Telegram themeParams to CSS custom properties on :root. */
export function applyThemeParams(params?: TgThemeParams): void {
  if (!params || typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(THEME_CSS_MAP)) {
    const value = params[key as keyof TgThemeParams];
    if (value) root.style.setProperty(cssVar, value);
  }
  const btnColor = params.button_color;
  if (btnColor) root.style.setProperty('--tg-theme-button-bg', btnColor);
}

/** Apply Telegram color scheme (light/dark) to the document root. */
export function applyColorScheme(scheme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.colorScheme = scheme;
  root.classList.toggle('dark', scheme === 'dark');
}

/** Subscribe to Telegram theme/color-scheme changes and re-apply them live. */
export function bindTelegramThemeEvents(onScheme?: (s: 'light' | 'dark') => void): () => void {
  const wa = getWebApp() as (TelegramWebApp & { onEvent?: (e: string, cb: (...a: any[]) => void) => void }) | undefined;
  if (!wa || typeof wa.onEvent !== 'function') return () => {};
  const themeH = () => applyThemeParams(wa.themeParams);
  const schemeH = (s?: string) => {
    const scheme = (s === 'dark' || s === 'light' ? s : wa.colorScheme) as 'light' | 'dark';
    applyColorScheme(scheme);
    applyThemeParams(wa.themeParams);
    onScheme?.(scheme);
  };
  wa.onEvent('themeChanged', themeH);
  wa.onEvent('colorSchemeChanged', schemeH);
  return () => {
    /* no unsubscribe API exposed by wrapper version */
  };
}

export function webAppReady(): void {
  const wa = getWebApp();
  wa?.ready();
  wa?.expand();
  try {
    wa?.setHeaderColor?.('#1a2d8f');
  } catch {
    /* ignore */
  }
}

export function haptic(type: 'success' | 'error' | 'warning' = 'success'): void {
  getWebApp()?.HapticFeedback?.notificationOccurred?.(type);
}

export function openLink(url: string): void {
  const wa = getWebApp();
  if (wa?.openLink) wa.openLink(url);
  else window.open(url, '_blank');
}

export function closeApp(): void {
  getWebApp()?.close?.();
}
