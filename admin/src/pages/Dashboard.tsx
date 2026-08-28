import { DashboardStats } from '../lib/types';
import { useApi } from '../lib/useApi';
import { Skeleton } from '../components/ui';

export default function Dashboard() {
  const { data, loading, error, reload } = useApi<DashboardStats>('/dashboard');

  if (loading) return <StatsSkeleton />;
  if (error)
    return (
      <div className="animate-fade-in rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">Ошибка загрузки данных: {error}</p>
        <button onClick={reload} className="mt-4 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100">Повторить</button>
      </div>
    );

  const stats: Array<{ label: string; value: number; icon: string; tone: string }> = [
    { label: 'Новые заявки', value: data?.newOrders ?? 0, icon: '🆕', tone: 'text-blue-600' },
    { label: 'Активные проекты', value: data?.activeProjects ?? 0, icon: '⚙️', tone: 'text-amber-600' },
    { label: 'Завершено', value: data?.completedProjects ?? 0, icon: '✅', tone: 'text-emerald-600' },
    { label: 'Доход', value: data?.revenue ?? 0, icon: '💰', tone: 'text-green-600' },
    { label: 'Пользователей', value: data?.users ?? 0, icon: '👥', tone: 'text-purple-600' },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">📊 Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-800">
            <div className="text-2xl">{s.icon}</div>
            <p className={`mt-2 text-2xl font-extrabold ${s.tone}`}>
              {s.label === 'Доход' ? `$${s.value.toLocaleString()}` : s.value}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div>
      <Skeleton className="mb-5 h-8 w-48" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    </div>
  );
}
