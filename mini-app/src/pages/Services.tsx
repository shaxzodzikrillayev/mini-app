import { useNavigate } from 'react-router-dom';
import { Service } from '../lib/types';
import { useApi } from '../lib/useApi';
import { PageSkeleton, ErrorState, EmptyState, Button } from '../components/ui';
import { formatCurrency } from '../lib/utils';

const ICON_FOR: Record<string, string> = {
  'Landing Page': '🌐', 'Business Website': '🏢', 'E-commerce': '🛒', 'AI Website': '🤖',
  'Telegram Mini App': '📱', 'Telegram Bot': '🤖', 'Web App': '⚙️', 'Admin Panel': '📊', 'Custom Project': '🔥',
};

export default function Services() {
  const nav = useNavigate();
  const { data, loading, error, reload } = useApi<Service[]>('/services');

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data || data.length === 0)
    return (
      <>
        <div className="px-4 py-2"><h1 className="text-main text-[22px] font-extrabold tracking-tight">Услуги</h1></div>
        <EmptyState icon="🛠" title="Услуги скоро появятся" subtitle="Мы готовим новые услуги для вас" />
      </>
    );

  return (
    <div className="animate-fade-in pb-4">
      <div className="px-4 py-2">
        <h1 className="text-main text-[22px] font-extrabold tracking-tight">Услуги</h1>
        <p className="text-hint mt-1 text-sm">Выберите услугу и закажите проект</p>
      </div>
      <div className="flex flex-col gap-3 px-4">
        {data.map((s) => (
          <div key={s.id} className="card p-4 transition-transform active:scale-[0.99]">
            <div className="flex items-start gap-3">
              <span className="btn-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl">
                {ICON_FOR[s.title] || '🛠'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-main text-base font-bold">{s.title}</h3>
                </div>
                <p className="text-hint mt-1 text-sm leading-relaxed">{s.description}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {s.duration && (
                  <span className="btn-soft rounded-lg px-2.5 py-1 text-xs font-medium">⏱ {s.duration}</span>
                )}
                <span className="accent-color text-sm font-extrabold">
                  {s.price != null ? `от ${formatCurrency(s.price)}` : 'Цена по запросу'}
                </span>
              </div>
              <Button
                variant="soft"
                onClick={() => nav('/calc', { state: { presetService: s.title } })}
                className="!px-4 !py-2 text-xs"
              >
                Заказать
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
