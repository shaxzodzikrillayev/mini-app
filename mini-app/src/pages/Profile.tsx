import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Me, AppUser } from '../lib/types';
import { useApi } from '../lib/useApi';
import { Button, Field, Modal, PageSkeleton, ErrorState } from '../components/ui';
import { useAuth } from '../store/auth';
import { api } from '../lib/api';
import { toast } from '../store/toast';
import { haptic } from '../lib/telegram';

export default function Profile() {
  const nav = useNavigate();
  const { user, logout, setUser, isTelegram, linkEmail, setEmail } = useAuth();
  const { data, loading, error, reload } = useApi<Me>(user && user.authType === 'telegram' ? '/me' : null);

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [language, setLanguage] = useState(user?.language || 'ru');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkMode, setLinkMode] = useState<'link' | 'create'>('link');
  const [linkEmailVal, setLinkEmailVal] = useState('');
  const [linkPass, setLinkPass] = useState('');
  const [linkConfirm, setLinkConfirm] = useState('');

  const firstNameSafe = user?.firstName || 'Гость';
  const usernameSafe = user?.username || null;
  const initial = firstNameSafe.charAt(0).toUpperCase();
  const stats = data;
  const telegramId = stats?.user.telegramId || user?.telegramId || null;

  if (loading && user?.authType === 'telegram') return <PageSkeleton />;
  if (error && user?.authType === 'telegram') return <ErrorState message={error} onRetry={reload} />;

  const copyTelegramId = async () => {
    if (!telegramId) return;
    try {
      await navigator.clipboard.writeText(telegramId);
      toast.success('Telegram ID скопирован');
      haptic('success');
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const saveProfile = async () => {
    if (!firstName.trim()) {
      toast.error('Имя не может быть пустым');
      return;
    }
    setSaving(true);
    try {
      const body: any = {
        firstName: firstName.trim(),
        username: username.trim() || null,
        language,
      };
      if (newPassword) {
        body.newPassword = newPassword;
        body.currentPassword = currentPassword;
      }
      const updated = await api.put<AppUser>('/auth/update', body);
      setUser(updated);
      toast.success('Профиль обновлён');
      haptic('success');
      setCurrentPassword('');
      setNewPassword('');
      setEditing(false);
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    nav('/');
  };

  const handleLinkEmail = async () => {
    if (!linkEmailVal.trim() || !linkPass) {
      toast.error('Введите email и пароль');
      return;
    }
    setLinking(true);
    let ok = false;
    if (linkMode === 'link') {
      ok = await linkEmail(linkEmailVal.trim(), linkPass);
    } else {
      if (!linkConfirm || linkConfirm !== linkPass) {
        toast.error('Пароли не совпадают');
        setLinking(false);
        return;
      }
      ok = await setEmail({ email: linkEmailVal.trim(), password: linkPass, confirm: linkConfirm });
    }
    setLinking(false);
    if (ok) {
      setLinkEmailVal('');
      setLinkPass('');
      setLinkConfirm('');
      reload();
    }
  };

  return (
    <div className="animate-fade-in pb-4">
      <div className="px-4 py-2">
        <h1 className="text-main text-[22px] font-extrabold tracking-tight">Профиль</h1>
      </div>

      {/* Hero card */}
      <div className="px-4">
        <div className="card relative overflow-hidden p-6">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20"
            style={{ background: 'var(--brand-grad)', filter: 'blur(30px)' }}
          />
          <div className="relative flex items-center gap-4">
            <span className="btn-primary flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl text-3xl font-extrabold shadow-lg">
              {initial}
            </span>
            <div className="min-w-0">
              <h2 className="text-main text-xl font-extrabold">{firstNameSafe}</h2>
              <p className="text-hint text-sm">{usernameSafe ? `@${usernameSafe}` : user?.email || '—'}</p>
              <span className="btn-soft mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold">
                {isTelegram ? '⚡ Telegram аккаунт' : user?.authType === 'email' ? '✉️ Email аккаунт' : '👤 Аккаунт'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mt-4 grid grid-cols-2 gap-3 px-4">
          <div className="card p-4 text-center">
            <p className="text-[26px] font-extrabold accent-color">{stats.orderCount}</p>
            <p className="text-hint mt-1 text-xs font-semibold">Заказов</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-[26px] font-extrabold accent-color">{stats.activeProjects}</p>
            <p className="text-hint mt-1 text-xs font-semibold">Активных проектов</p>
          </div>
        </div>
      )}

      {/* Account details + actions */}
      <div className="mt-4 space-y-3 px-4">
        <div className="card space-y-3 p-4">
          <Row label="Имя" value={firstNameSafe} />
          <Row label="Username" value={usernameSafe ? `@${usernameSafe}` : '—'} />
          {telegramId && (
            <div className="flex items-center justify-between">
              <span className="text-hint text-sm">Telegram ID</span>
              <button
                onClick={copyTelegramId}
                className="btn-soft inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold"
              >
                <span className="text-main font-semibold tabular-nums">{telegramId}</span>
                <span className="text-hint">📋</span>
              </button>
            </div>
          )}
          {user?.email && <Row label="Email" value={user.email} />}
          <Row label="Язык" value={language} />
        </div>

        <Button variant="soft" block onClick={() => setEditing(true)}>✏️ Редактировать профиль</Button>
        {isTelegram && !user?.email && (
          <div className="card space-y-3 p-4">
            <div>
              <p className="text-main text-sm font-bold">🔗 Email для входа</p>
              <p className="text-hint mt-0.5 text-xs">Войдите с другого устройства. Привяжите существующий аккаунт или создайте email и пароль.</p>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => { setLinkMode('link'); setLinkConfirm(''); }}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                  linkMode === 'link' ? 'btn-primary' : 'btn-soft'
                }`}
              >
                Привязать аккаунт
              </button>
              <button
                onClick={() => { setLinkMode('create'); setLinkConfirm(''); }}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                  linkMode === 'create' ? 'btn-primary' : 'btn-soft'
                }`}
              >
                Создать email
              </button>
            </div>
            <input
              className="field"
              value={linkEmailVal}
              onChange={(e) => setLinkEmailVal(e.target.value)}
              placeholder="you@example.com"
              inputMode="email"
              autoComplete="email"
            />
            <input
              className="field"
              type="password"
              value={linkPass}
              onChange={(e) => setLinkPass(e.target.value)}
              placeholder={linkMode === 'create' ? 'Придумайте пароль' : 'Пароль'}
              autoComplete={linkMode === 'create' ? 'new-password' : 'current-password'}
            />
            {linkMode === 'create' && (
              <input
                className="field"
                type="password"
                value={linkConfirm}
                onChange={(e) => setLinkConfirm(e.target.value)}
                placeholder="Повторите пароль"
                autoComplete="new-password"
              />
            )}
            <Button variant="soft" block loading={linking} onClick={handleLinkEmail}>
              {linking ? 'Сохранение...' : linkMode === 'link' ? 'Привязать аккаунт' : 'Создать email и пароль'}
            </Button>
          </div>
        )}
        <Button variant="ghost" block onClick={handleLogout}>🚪 Выйти из аккаунта</Button>
      </div>

      {/* Edit modal */}
      <Modal open={editing} onClose={() => setEditing(false)} title="✏️ Редактировать профиль">
        <div className="space-y-4">
          <Field label="Имя">
            <input className="field" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Username">
            <input className="field" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@username" />
          </Field>
          <Field label="Язык">
            <select className="field" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="ru">🇷🇺 Русский</option>
              <option value="uz">🇺🇿 O‘zbek</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </Field>

          {user?.authType === 'email' && (
            <>
              <div className="my-2 border-t border-black/5 dark:border-white/10" />
              <p className="text-hint text-xs font-bold">Смена пароля (необязательно)</p>
              <Field label="Текущий пароль">
                <input className="field" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </Field>
              <Field label="Новый пароль">
                <input className="field" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Минимум 6 символов" />
              </Field>
            </>
          )}

          <Button block loading={saving} onClick={saveProfile}>Сохранить</Button>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-hint text-sm">{label}</span>
      <span className="text-main text-sm font-semibold">{value}</span>
    </div>
  );
}
