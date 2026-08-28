import { getInitData } from './telegram';

// Base URL for the backend API.
// Configure via VITE_API_URL. The fallback only applies in local development.
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:4000/api';

const TOKEN_KEY = 'sws_token';

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// In browser preview (outside Telegram) allow calling the local backend
// for development. In production the initData check protects the API.
function devHeaders(): Record<string, string> {
  const user = localStorage.getItem('sws_dev_user');
  if (getInitData()) return {};
  let devUser: any = { id: 12345, first_name: 'Guest', username: 'guest' };
  try {
    const u = user ? JSON.parse(user) : null;
    if (u && u.id) devUser = { id: u.id, first_name: u.first_name, username: u.username };
  } catch {
    /* ignore */
  }
  // base64-encode to keep the header ASCII-safe (headers reject non-Latin-1)
  return { 'X-Dev-User': btoa(unescape(encodeURIComponent(JSON.stringify(devUser)))) };
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, explicitAuth?: string): Promise<T> {
  const token = explicitAuth ?? getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : getInitData()
        ? { 'X-Init-Data': getInitData() }
        : devHeaders()),
    ...((options.headers as Record<string, string>) || {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, 'Не удалось подключиться к серверу. Попробуйте ещё раз.');
  }

  if (!res.ok) {
    let message = 'Произошла ошибка. Попробуйте ещё раз.';
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }

  return (await res.json()) as T;
}

export const api = {
  base: API_BASE,
  get<T>(path: string, auth?: string) {
    return request<T>(path, { method: 'GET' }, auth);
  },
  post<T>(path: string, body: unknown, auth?: string) {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) }, auth);
  },
  put<T>(path: string, body: unknown, auth?: string) {
    return request<T>(path, { method: 'PUT', body: JSON.stringify(body) }, auth);
  },
  del<T>(path: string, auth?: string) {
    return request<T>(path, { method: 'DELETE' }, auth);
  },
};
