import { useAuth } from '../store/auth';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:4000/api/admin';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return useAuth.getState().token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, 'Не удалось подключиться к серверу. Проверьте, что backend запущен.');
  }

  if (res.status === 401) {
    useAuth.getState().logout();
    throw new ApiError(401, 'Сессия истекла. Войдите снова.');
  }

  if (!res.ok) {
    let message = 'Произошла ошибка.';
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
  get<T>(path: string) {
    return request<T>(path, { method: 'GET' });
  },
  post<T>(path: string, body: unknown) {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  },
  put<T>(path: string, body: unknown) {
    return request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  },
  del<T>(path: string) {
    return request<T>(path, { method: 'DELETE' });
  },
  // For login (no auth token)
  login<T>(path: string, body: unknown) {
    return fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok || data.error) throw new ApiError(res.status, data.error || 'Ошибка входа');
      return data as T;
    });
  },
};
