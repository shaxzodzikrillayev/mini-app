import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Button, Field, Logo } from '../components/ui';
import { useTheme } from '../store/theme';
import { haptic } from '../lib/telegram';

interface Props {
  mode: 'login' | 'register';
}

export default function AuthPage({ mode }: Props) {
  const scheme = useTheme((s) => s.scheme);
  const { login, register } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as any)?.from;

  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!isLogin && !firstName.trim()) e.firstName = 'Введите имя';
    if (!email.trim()) e.email = 'Введите email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Некорректный email';
    if (!password) e.password = 'Введите пароль';
    else if (!isLogin && password.length < 6) e.password = 'Минимум 6 символов';
    if (!isLogin && password !== confirm) e.confirm = 'Пароли не совпадают';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    let ok = false;
    if (isLogin) ok = await login(email.trim(), password);
    else ok = await register({ firstName: firstName.trim(), username: username.trim() || undefined, email: email.trim(), password, confirm });
    setLoading(false);
    if (ok) {
      haptic('success');
      nav(from && from !== '/login' && from !== '/register' ? from : '/', { replace: true });
    }
  };

  return (
    <div className={`app-bg ${scheme === 'dark' ? 'dark' : ''} flex min-h-screen flex-col`}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="animate-slide-up">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo size="lg" />
            <h1 className="text-main mt-4 text-2xl font-extrabold tracking-tight">Shahzod Web Studio</h1>
            <p className="text-hint mt-1 text-sm">{isLogin ? 'С возвращением! Войдите в аккаунт' : 'Создайте аккаунт, чтобы отслеживать заказы'}</p>
          </div>

          <div className="card space-y-4 p-5">
            {!isLogin && (
              <Field label="Имя" error={fieldErrors.firstName} icon="👤">
                <input
                  className="field"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ваше имя"
                  autoComplete="name"
                />
              </Field>
            )}
            {!isLogin && (
              <Field label="Username (необязательно)" icon="💬">
                <input
                  className="field"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username"
                  autoComplete="username"
                />
              </Field>
            )}
            <Field label="Email" error={fieldErrors.email} icon="✉️">
              <input
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
              />
            </Field>
            <Field label="Пароль" error={fieldErrors.password} icon="🔒">
              <div className="relative">
                <input
                  className="field pr-12"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="text-hint absolute right-3 top-1/2 -translate-y-1/2 text-lg"
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </Field>
            {!isLogin && (
              <Field label="Подтверждение пароля" error={fieldErrors.confirm} icon="🔒">
                <input
                  className="field"
                  type={showPass ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
              </Field>
            )}

            <Button block loading={loading} onClick={submit} className="mt-1">
              {loading ? 'Пожалуйста, подождите...' : isLogin ? 'Войти' : 'Создать аккаунт'}
            </Button>
          </div>

          <p className="text-hint mt-5 text-center text-sm">
            {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
            <Link to={isLogin ? '/register' : '/login'} className="accent-color font-bold">
              {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </Link>
          </p>
          <div className="mt-3 text-center">
            <Link to="/" className="text-hint text-xs font-medium hover:text-main">← На главную</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
