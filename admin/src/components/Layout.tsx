import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

const NAV = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/orders', icon: '📦', label: 'Orders' },
  { to: '/users', icon: '👥', label: 'Users' },
  { to: '/portfolio', icon: '🎨', label: 'Portfolio' },
  { to: '/services', icon: '🛠', label: 'Services' },
  { to: '/pricing', icon: '💰', label: 'Pricing' },
  { to: '/ai', icon: '🤖', label: 'AI Settings' },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`
          }
        >
          <span>{n.icon}</span> {n.label}
        </NavLink>
      ))}
    </>
  );
}

export default function Layout() {
  const [dark, setDark] = useState(() => localStorage.getItem('sws_dark') === '1');
  const [menuOpen, setMenuOpen] = useState(false);
  const { username, logout } = useAuth();
  const nav = useNavigate();

  const toggleDark = () => {
    setDark((d) => {
      const next = !d;
      localStorage.setItem('sws_dark', next ? '1' : '0');
      return next;
    });
  };

  const onLogout = () => {
    setMenuOpen(false);
    logout();
    nav('/login');
  };

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:flex">
          <div className="flex items-center gap-2 px-5 py-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg text-white shadow-lg">🚀</span>
            <div>
              <p className="text-sm font-extrabold text-gray-900 dark:text-white">Shahzod Studio</p>
              <p className="text-[10px] font-medium text-gray-400">Admin Panel</p>
            </div>
          </div>
          <nav className="mt-2 flex-1 space-y-1 px-3"><NavLinks /></nav>
          <div className="border-t border-gray-200 p-3 dark:border-gray-800">
            <button
              onClick={toggleDark}
              className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <span>{dark ? '☀️' : '🌙'}</span> {dark ? 'Светлая тема' : 'Тёмная тема'}
            </button>
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">👤 {username || 'admin'}</span>
              <button onClick={onLogout} className="text-sm text-red-500 hover:underline">Выйти</button>
            </div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-white px-4 py-3 shadow-sm dark:bg-gray-900 md:hidden">
          <button onClick={() => setMenuOpen(true)} className="flex items-center gap-2 text-lg text-gray-700 dark:text-gray-200">
            <span>☰</span>
            <span className="text-sm font-extrabold">Shahzod Studio</span>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={toggleDark} className="text-lg">{dark ? '☀️' : '🌙'}</button>
          </div>
        </header>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMenuOpen(false)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
              className="absolute inset-y-0 left-0 z-10 flex w-72 flex-col bg-white p-4 shadow-2xl dark:bg-gray-900"
              style={{ animation: 'drawerIn 0.22s cubic-bezier(0.16,1,0.3,1)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between px-2">
                <span className="text-sm font-extrabold text-gray-900 dark:text-white">🚀 Shahzod Studio</span>
                <button onClick={() => setMenuOpen(false)} className="text-2xl text-gray-400">×</button>
              </div>
              <p className="mb-2 px-3 text-xs text-gray-500">👤 {username || 'admin'}</p>
              <nav className="flex-1 space-y-1"><NavLinks onNavigate={() => setMenuOpen(false)} /></nav>
              <div className="border-t border-gray-200 pt-3 dark:border-gray-800">
                <button
                  onClick={toggleDark}
                  className="mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <span>{dark ? '☀️' : '🌙'}</span> {dark ? 'Светлая тема' : 'Тёмная тема'}
                </button>
                <button
                  onClick={onLogout}
                  className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                >
                  🚪 Выйти
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 px-4 pb-10 pt-16 md:ml-60 md:px-8 md:pt-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
