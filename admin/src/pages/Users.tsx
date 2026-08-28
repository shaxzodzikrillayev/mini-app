import { User } from '../lib/types';
import { useApi } from '../lib/useApi';
import { Badge, Skeleton, ErrorState, EmptyState } from '../components/ui';
import { formatDate } from '../lib/utils';

export default function Users() {
  const { data, loading, error, reload } = useApi<User[]>('/users');

  if (loading) return <UsersSkeleton />;
  if (error) return <ErrorState message={`Ошибка загрузки пользователей: ${error}`} onRetry={reload} />;

  const langLabel: Record<string, string> = { ru: '🇷🇺 RU', uz: '🇺🇿 UZ', en: '🇬🇧 EN' };

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">👥 Users</h1>
        <Badge tone="blue">Всего: {data?.length ?? 0}</Badge>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        {!data || data.length === 0 ? (
          <EmptyState message="Пользователей пока нет" />
        ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <th className="px-4 py-3">Имя</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Telegram ID</th>
              <th className="px-4 py-3">Язык</th>
              <th className="px-4 py-3">Регистрация</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700/50">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{u.firstName}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">@{u.username || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.telegramId}</td>
                <td className="px-4 py-3">{langLabel[u.language] || u.language}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div>
      <Skeleton className="mb-5 h-8 w-40" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    </div>
  );
}
