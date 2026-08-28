import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Button, inputCls, Field } from '../components/ui';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      nav('/');
    } catch (err: any) {
      setError(err?.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f1f4f9] p-4 dark:bg-gray-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-2xl text-white">🚀</span>
          <h1 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">Shahzod Web Studio</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Вход в админ-панель</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Логин">
            <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          </Field>
          <Field label="Пароль">
            <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" loading={loading} className="w-full !py-2.5">{loading ? 'Вход...' : 'Войти'}</Button>
        </form>
      </div>
    </div>
  );
}
