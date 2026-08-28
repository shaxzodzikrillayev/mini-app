import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { useTheme } from '../store/theme';
import { useAuth } from '../store/auth';
import { Logo } from './ui';

const TABS = [
  { to: '/', icon: '🏠', label: 'Главная', end: true },
  { to: '/services', icon: '🛠', label: 'Услуги' },
  { to: '/calc', icon: '💰', label: 'Калькулятор' },
  { to: '/orders', icon: '📦', label: 'Заказы' },
  { to: '/profile', icon: '👤', label: 'Профиль' },
];

export default function Layout() {
  const scheme = useTheme((s) => s.scheme);
  const { user, hydrated } = useAuth();
  const loc = useLocation();

  const showHeaderOn = ['/', '/services', '/portfolio', '/calc', '/orders', '/profile'];
  const withHeader = showHeaderOn.includes(loc.pathname) || loc.pathname.startsWith('/orders/');

  const firstName = user?.firstName || 'Гость';
  const initial = (firstName || 'G').charAt(0).toUpperCase();

  return (
    <div className={`app-bg min-h-screen ${scheme === 'dark' ? 'dark' : ''}`}>
      <div className="mx-auto min-h-screen w-full max-w-lg pb-24 pt-4">
        {/* Top bar (brand + profile access) */}
        {withHeader && (
          <header className="animate-fade-in mb-3 flex items-center justify-between gap-3 px-4">
            <Link to="/" className="flex items-center gap-3">
              <Logo />
              <div>
                <p className="text-main text-[17px] font-extrabold leading-tight tracking-tight">Shahzod Web Studio</p>
                <p className="text-hint text-[11px] font-medium">Premium Digital Studio</p>
              </div>
            </Link>
            <Link
              to="/profile"
              className="btn-soft flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3"
            >
              <span className="btn-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style={{ borderRadius: 999 }}>
                {initial}
              </span>
              <span className="text-main max-w-[80px] truncate text-xs font-bold">{hydrated ? firstName : ''}</span>
            </Link>
          </header>
        )}

        <main className="min-h-[70vh]">
          <Outlet />
        </main>
      </div>

      {/* Bottom navigation (glass) */}
      <nav
        className="glass fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-lg items-end justify-around border-t border-black/5 px-1 pb-safe dark:border-white/10"
        style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom))' }}
      >
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex min-w-[52px] flex-col items-center gap-0.5 rounded-2xl px-2 pt-2 pb-1 text-[10px] font-medium transition-all ${
                isActive ? 'accent-color -translate-y-0.5' : 'text-hint'
              }`
            }
          >
            <span className="text-[22px] leading-none drop-shadow-sm">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
