import { Link, useNavigate } from 'react-router-dom';
import { Service, Project } from '../lib/types';
import { useApi } from '../lib/useApi';
import { PageSkeleton, ErrorState, Button } from '../components/ui';
import { useAuth } from '../store/auth';

const ICON_FOR: Record<string, string> = {
  'Landing Page': '🌐', 'Business Website': '🏢', 'E-commerce': '🛒', 'AI Website': '🤖',
  'Telegram Mini App': '📱', 'Telegram Bot': '🤖', 'Web App': '⚙️', 'Admin Panel': '📊', 'Custom Project': '🔥',
};

export default function Home() {
  const { user } = useAuth();
  const nav = useNavigate();
  const services = useApi<Service[]>('/services');
  const projects = useApi<Project[]>('/projects');

  if (services.loading || projects.loading) return <PageSkeleton />;
  if (services.error && projects.error) {
    return (
      <ErrorState
        message="Не удалось подключиться к серверу."
        onRetry={() => { services.reload(); projects.reload(); }}
      />
    );
  }

  const firstName = user?.firstName || 'друг';
  const servicesList = services.data || [];
  const projectsList = projects.data || [];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Hero */}
      <section className="px-4 pt-2">
        <div className="card relative overflow-hidden p-6">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-25"
            style={{ background: 'var(--brand-grad)', filter: 'blur(36px)' }}
          />
          <div className="relative">
            <h2 className="text-main text-[22px] font-extrabold leading-tight">Привет, {firstName}! 👋</h2>
            <p className="text-hint mt-2 text-sm leading-relaxed">
              Мы превращаем идеи в работающий digital-продукт: современные сайты, Telegram-боты,
              Mini Apps и AI-решения под ключ.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <Button onClick={() => nav('/calc')}>💰 Рассчитать стоимость</Button>
              <Button variant="soft" onClick={() => nav('/calc')}>🚀 Заказать проект</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Popular projects */}
      {projectsList.length > 0 && (
        <section className="px-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-main text-base font-extrabold">Популярные проекты</h3>
            <Link to="/portfolio" className="accent-color text-xs font-bold">Все →</Link>
          </div>
          <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto">
            {projectsList.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                to="/portfolio"
                className="card w-52 shrink-0 snap-start overflow-hidden transition-transform active:scale-[0.98]"
              >
                {p.image ? (
                  <img src={p.image} alt={p.title} className="h-28 w-full object-cover" />
                ) : (
                  <div className="btn-soft flex h-28 items-center justify-center text-3xl">🖼</div>
                )}
                <div className="p-3">
                  <p className="text-main text-sm font-bold">{p.title}</p>
                  <p className="text-hint mt-1 line-clamp-2 text-xs">{p.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {servicesList.length > 0 && (
        <section className="px-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-main text-base font-extrabold">Наши услуги</h3>
            <Link to="/services" className="accent-color text-xs font-bold">Все →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {servicesList.slice(0, 6).map((s) => (
              <Link key={s.id} to="/services" className="card p-4 transition-transform active:scale-[0.98]">
                <span className="text-xl">{ICON_FOR[s.title] || '🛠'}</span>
                <p className="text-main mt-2 text-sm font-bold leading-tight">{s.title}</p>
                <p className="text-hint mt-1 text-xs">
                  {s.price != null ? `от $${s.price}` : 'по договорённости'}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* AI assistant CTA */}
      <section className="px-4 pb-2">
        <Link
          to="/ai"
          className="card relative flex w-full flex-col items-start gap-2 overflow-hidden p-5 text-left transition-transform active:scale-[0.98]"
        >
          <div
            className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full opacity-20"
            style={{ background: 'var(--brand-grad)', filter: 'blur(24px)' }}
          />
          <span className="text-2xl">🤖</span>
          <span className="text-main text-base font-bold">AI-консультант</span>
          <span className="text-hint text-xs">Поможем выбрать услугу под вашу задачу</span>
        </Link>
      </section>
    </div>
  );
}
