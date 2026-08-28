import { Project } from '../lib/types';
import { useApi } from '../lib/useApi';
import { PageSkeleton, ErrorState, EmptyState, Button } from '../components/ui';
import { parseTechnologies } from '../lib/utils';
import { openLink } from '../lib/telegram';

const CAT_COLORS: Record<string, { bg: string; fg: string }> = {
  'Landing': { bg: 'rgba(59,130,246,0.15)', fg: '#3b82f6' },
  'E-commerce': { bg: 'rgba(16,185,129,0.15)', fg: '#10b981' },
  'Bot': { bg: 'rgba(245,158,11,0.15)', fg: '#f59e0b' },
  'AI': { bg: 'rgba(139,92,246,0.15)', fg: '#8b5cf6' },
  'Web App': { bg: 'rgba(236,72,153,0.15)', fg: '#ec4899' },
};

export default function Portfolio() {
  const { data, loading, error, reload } = useApi<Project[]>('/projects');

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data || data.length === 0)
    return (
      <>
        <div className="px-4 py-2"><h1 className="text-main text-[22px] font-extrabold tracking-tight">Портфолио</h1></div>
        <EmptyState icon="🎨" title="Проектов пока нет" subtitle="Скоро здесь появятся наши работы" />
      </>
    );

  return (
    <div className="animate-fade-in pb-4">
      <div className="px-4 py-2">
        <h1 className="text-main text-[22px] font-extrabold tracking-tight">Портфолио</h1>
        <p className="text-hint mt-1 text-sm">Наши проекты</p>
      </div>
      <div className="flex flex-col gap-4 px-4">
        {data.map((p) => {
          const cat = CAT_COLORS[p.category];
          return (
            <div key={p.id} className="card overflow-hidden transition-transform active:scale-[0.99]">
              {p.image ? (
                <img src={p.image} alt={p.title} className="h-44 w-full object-cover" />
              ) : (
                <div className="btn-soft flex h-44 items-center justify-center text-4xl">🖼</div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-main text-base font-bold">{p.title}</h3>
                  {p.category && (
                    <span
                      className="shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold"
                      style={cat ? { background: cat.bg, color: cat.fg } : undefined}
                    >
                      {p.category}
                    </span>
                  )}
                </div>
                <p className="text-hint mt-1.5 text-sm leading-relaxed">{p.description}</p>
                {parseTechnologies(p.technologies).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {parseTechnologies(p.technologies).map((t, i) => (
                      <span key={i} className="btn-soft rounded-md px-2 py-0.5 text-[10px] font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {p.demoUrl && (
                  <Button variant="soft" onClick={() => openLink(p.demoUrl!)} className="mt-4 w-full !py-2.5 text-sm">
                    👁 Посмотреть проект
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
