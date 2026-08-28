import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Pricing, Order } from '../lib/types';
import { useApi } from '../lib/useApi';
import { api } from '../lib/api';
import { Button, PageSkeleton, ErrorState, Modal } from '../components/ui';
import { toast } from '../store/toast';
import { haptic } from '../lib/telegram';
import { formatCurrency } from '../lib/utils';

const EXCLUDE_FROM_FEATURES = new Set(['admin_crud', 'bot', 'ai', 'mini_app']);

const DESIGN_OPTIONS = [
  { key: 'base', label: 'Базовый', icon: '🧩', desc: 'Готовый стиль, адаптивная вёрстка', mult: 1 },
  { key: 'standard', label: 'Стандарт', icon: '🎨', desc: 'Уникальный дизайн под ваш бренд', mult: 1.15 },
  { key: 'premium', label: 'Премиум', icon: '💎', desc: 'Эксклюзивный дизайн + анимации', mult: 1.3 },
];

const EXTRAS = [
  { key: 'bot', label: 'Telegram-бот' },
  { key: 'ai', label: 'AI интеграция' },
  { key: 'mini_app', label: 'Telegram Mini App' },
];

const DEADLINES = [
  { key: 'fast', label: '⚡ Быстро', desc: 'Приоритетная очередь', factor: 1.1, time: '1–2 недели' },
  { key: 'normal', label: '⏱ Стандартно', desc: 'Оптимальный срок', factor: 1, time: '2–4 недели' },
  { key: 'relax', label: '🌿 Расширенный', desc: 'Комфортный темп', factor: 0.95, time: '4–6 недель' },
];

const PROJECT_ICONS: Record<string, string> = {
  landing: '🌐', business: '🏢', ecommerce: '🛒', ai_website: '🤖', mini_app: '📱',
  bot: '🤖', web_app: '⚙️', admin_panel: '📊', custom: '🔥',
};

interface StepDef {
  key: string;
  title: string;
  subtitle: string;
}

const STEPS: StepDef[] = [
  { key: 'project', title: 'Тип проекта', subtitle: 'Что мы будем создавать?' },
  { key: 'features', title: 'Функционал', subtitle: 'Какие функции нужны?' },
  { key: 'design', title: 'Дизайн', subtitle: 'Выберите уровень дизайна' },
  { key: 'extras', title: 'Доп. услуги', subtitle: 'Что ещё добавить?' },
  { key: 'deadline', title: 'Срок', subtitle: 'Насколько срочно?' },
  { key: 'summary', title: 'Итог', subtitle: 'Проверьте и создайте заказ' },
];

export default function Calculator() {
  const location = useLocation() as any;
  const nav = useNavigate();
  const presetService: string | undefined = location.state?.presetService;

  const { data: pricing, loading, error, reload } = useApi<Pricing>('/pricing');

  const [stepIndex, setStepIndex] = useState(0);
  const [projectKey, setProjectKey] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [design, setDesign] = useState('standard');
  const [extras, setExtras] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('normal');

  // Order form state
  const [showForm, setShowForm] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const projectTypes = useMemo(() => pricing?.projectTypes || [], [pricing]);
  const featureItems = useMemo(
    () => (pricing?.features || []).filter((f) => !EXCLUDE_FROM_FEATURES.has(f.key)),
    [pricing],
  );
  const featureMap = useMemo(() => {
    const m = new Map<string, { label: string; value: number }>();
    (pricing?.features || []).forEach((f) => m.set(f.key, f));
    return m;
  }, [pricing]);

  // Preselect project from a service click on the Services page.
  const effectiveProject = useMemo(() => {
    if (projectKey) return projectKey;
    if (presetService) {
      const match = projectTypes.find((p) => p.label.toLowerCase() === presetService.toLowerCase());
      return match?.key ?? null;
    }
    return null;
  }, [projectKey, presetService, projectTypes]);

  const projectName = useMemo(
    () => projectTypes.find((p) => p.key === effectiveProject)?.label || 'Проект',
    [projectTypes, effectiveProject],
  );

  const featuresTotal = useMemo(() => {
    let sum = 0;
    features.forEach((k) => {
      sum += featureMap.get(k)?.value ?? 0;
    });
    extras.forEach((k) => {
      sum += featureMap.get(k)?.value ?? 0;
    });
    return sum;
  }, [features, extras, featureMap]);

  const designMult = useMemo(() => (DESIGN_OPTIONS.find((d) => d.key === design)?.mult ?? 1), [design]);
  const deadlineFactor = useMemo(() => (DEADLINES.find((d) => d.key === deadline)?.factor ?? 1), [deadline]);

  const total = useMemo(() => {
    const proj = projectTypes.find((p) => p.key === effectiveProject)?.value ?? 0;
    const base = (proj + featuresTotal) * designMult;
    return Math.round((base + (proj + featuresTotal) * (deadlineFactor - 1)) * 10) / 10;
  }, [projectTypes, effectiveProject, featuresTotal, designMult, deadlineFactor]);

  const estimatedTime = useMemo(() => {
    const d = DEADLINES.find((x) => x.key === deadline);
    const weeks = Math.max(1, Math.ceil(total / 400));
    return d ? `${d.time}${total > 1800 ? ' (крупный проект)' : ''}` : `${weeks} недель`;
  }, [deadline, total]);

  const step = STEPS[stepIndex];

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const go = (i: number) => {
    setStepIndex(i);
    haptic();
  };

  const toggle = (arr: string[], key: string, set: (v: string[]) => void) => {
    set(arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key]);
  };

  const selectProject = (key: string) => {
    setProjectKey(key);
    go(1);
  };

  const canSubmit = serviceName.trim() && description.trim() && effectiveProject;

  const submitOrder = async () => {
    if (!canSubmit) {
      toast.error('Заполните название и описание');
      return;
    }
    setSubmitting(true);
    try {
      const extrasLabel = extras.map((k) => featureMap.get(k)?.label || k).join(', ');
      const detail = [
        description.trim(),
        extrasLabel ? `Доп. услуги: ${extrasLabel}` : '',
        `Дизайн: ${DESIGN_OPTIONS.find((d) => d.key === design)?.label}`,
        `Срок: ${DEADLINES.find((d) => d.key === deadline)?.label}`,
      ].filter(Boolean).join('\n');
      const order = await api.post<Order>('/orders', {
        service: serviceName.trim(),
        description: detail,
        budget: budget ? Number(budget) : null,
        price: total,
      });
      haptic('success');
      toast.success('Заказ создан! 🎉', `Заказ #${order.orderNumber} отправлен в работу`);
      setShowForm(false);
      nav('/orders');
    } catch (e: any) {
      toast.error(e?.message || 'Ошибка при создании заказа');
    } finally {
      setSubmitting(false);
    }
  };

  const openOrderForm = () => {
    setServiceName(serviceName || projectName);
    setShowForm(true);
  };

  return (
    <div className="animate-fade-in pb-4">
      <div className="px-4 py-2">
        <h1 className="text-main text-[22px] font-extrabold tracking-tight">Калькулятор</h1>
        <p className="text-hint mt-1 text-sm">Соберите проект и получите цену за 6 шагов</p>
      </div>

      {/* Step progress */}
      <div className="px-4">
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= stepIndex ? '' : 'opacity-25'
              }`}
              style={i <= stepIndex ? { background: 'var(--brand-grad)' } : { background: 'var(--tg-theme-secondary-bg-color, #d7dbe4)' }}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-hint text-[11px] font-bold uppercase tracking-wide">Шаг {stepIndex + 1} из {STEPS.length}</p>
            <p className="text-main text-base font-extrabold">{step.title}</p>
            <p className="text-hint text-xs">{step.subtitle}</p>
          </div>
          {total > 0 && (
            <div className="text-right">
              <p className="text-hint text-[10px] font-bold uppercase">Итого</p>
              <p className="text-lg font-extrabold accent-color">{formatCurrency(total)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 px-4">
        {/* Step 1: project type */}
        {step.key === 'project' && (
          <div className="grid grid-cols-2 gap-3">
            {projectTypes.map((p) => (
              <button
                key={p.key}
                onClick={() => selectProject(p.key)}
                className={`card flex flex-col items-start gap-2 p-4 text-left transition-all active:scale-[0.98] ${
                  effectiveProject === p.key ? 'ring-2 ring-[var(--brand)]' : ''
                }`}
              >
                <span className="text-2xl">{PROJECT_ICONS[p.key] || '🔥'}</span>
                <span className="text-main text-sm font-bold">{p.label}</span>
                <span className="text-hint text-xs font-semibold">{formatCurrency(p.value)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: features */}
        {step.key === 'features' && (
          <div className="flex flex-col gap-2.5">
            {featureItems.length === 0 && <p className="text-hint text-sm">Функции скоро появятся.</p>}
            {featureItems.map((f) => (
              <button
                key={f.key}
                onClick={() => toggle(features, f.key, setFeatures)}
                className={`card flex items-center justify-between p-4 text-left transition-all ${
                  features.includes(f.key) ? 'ring-2 ring-[var(--brand)]' : ''
                }`}
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs transition-colors ${
                      features.includes(f.key) ? 'border-transparent btn-primary' : 'border-current opacity-40'
                    }`}
                  >
                    {features.includes(f.key) ? '✓' : ''}
                  </span>
                  {f.label}
                </span>
                <span className="text-sm font-bold accent-color">+{formatCurrency(f.value)}</span>
              </button>
            ))}
            <Button variant="soft" onClick={() => go(2)} className="mt-1">Далее</Button>
          </div>
        )}

        {/* Step 3: design */}
        {step.key === 'design' && (
          <div className="flex flex-col gap-3">
            {DESIGN_OPTIONS.map((d) => (
              <button
                key={d.key}
                onClick={() => { setDesign(d.key); go(3); }}
                className={`card flex items-center gap-3 p-4 text-left transition-all ${design === d.key ? 'ring-2 ring-[var(--brand)]' : ''}`}
              >
                <span className="text-2xl">{d.icon}</span>
                <div className="flex-1">
                  <p className="text-main text-sm font-bold">{d.label}</p>
                  <p className="text-hint text-xs">{d.desc}</p>
                </div>
                <span className="text-sm font-bold accent-color">×{d.mult}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 4: extras */}
        {step.key === 'extras' && (
          <div className="flex flex-col gap-2.5">
            {EXTRAS.map((x) => {
              const item = featureMap.get(x.key);
              return (
                <button
                  key={x.key}
                  onClick={() => toggle(extras, x.key, setExtras)}
                  className={`card flex items-center justify-between p-4 text-left transition-all ${extras.includes(x.key) ? 'ring-2 ring-[var(--brand)]' : ''}`}
                >
                  <span className="flex items-center gap-3 text-sm font-medium">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs ${
                        extras.includes(x.key) ? 'border-transparent btn-primary' : 'border-current opacity-40'
                      }`}
                    >
                      {extras.includes(x.key) ? '✓' : ''}
                    </span>
                    {x.label}
                  </span>
                  <span className="text-sm font-bold accent-color">+{formatCurrency(item?.value ?? 0)}</span>
                </button>
              );
            })}
            <Button variant="soft" onClick={() => go(4)} className="mt-1">Далее</Button>
          </div>
        )}

        {/* Step 5: deadline */}
        {step.key === 'deadline' && (
          <div className="flex flex-col gap-3">
            {DEADLINES.map((d) => (
              <button
                key={d.key}
                onClick={() => { setDeadline(d.key); go(5); }}
                className={`card flex items-center gap-3 p-4 text-left transition-all ${deadline === d.key ? 'ring-2 ring-[var(--brand)]' : ''}`}
              >
                <div className="flex-1">
                  <p className="text-main text-sm font-bold">{d.label}</p>
                  <p className="text-hint text-xs">{d.desc}</p>
                </div>
                <span className="text-sm font-bold accent-color">{d.time}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 6: summary */}
        {step.key === 'summary' && (
          <div className="flex flex-col gap-3">
            <div className="card p-5">
              <p className="text-hint text-xs font-bold uppercase tracking-wide">Ваша конфигурация</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex justify-between"><span className="text-hint">Проект</span><span className="font-semibold text-main">{projectName}</span></li>
                {features.length > 0 && (
                  <li className="flex justify-between"><span className="text-hint">Функции</span><span className="font-semibold text-main">+{formatCurrency(features.filter((k) => !EXTRAS.map((e) => e.key).includes(k)).reduce((s, k) => s + (featureMap.get(k)?.value ?? 0), 0))}</span></li>
                )}
                {extras.length > 0 && (
                  <li className="flex justify-between"><span className="text-hint">Доп. услуги</span><span className="font-semibold text-main">+{formatCurrency(extras.reduce((s, k) => s + (featureMap.get(k)?.value ?? 0), 0))}</span></li>
                )}
                <li className="flex justify-between"><span className="text-hint">Дизайн</span><span className="font-semibold text-main">{DESIGN_OPTIONS.find((d) => d.key === design)?.label} ×{designMult}</span></li>
                <li className="flex justify-between"><span className="text-hint">Срок</span><span className="font-semibold text-main">{DEADLINES.find((d) => d.key === deadline)?.label}</span></li>
              </ul>
              <div className="mt-4 border-t border-black/5 pt-4 dark:border-white/10">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-hint text-xs font-bold uppercase">Итоговая стоимость</p>
                    <p className="accent-color text-3xl font-extrabold">{formatCurrency(total)}</p>
                  </div>
                  <p className="text-hint text-xs">⏱ {estimatedTime}</p>
                </div>
              </div>
              <Button onClick={openOrderForm} className="mt-5 w-full">🚀 Создать заказ</Button>
            </div>
          </div>
        )}

        {/* Step navigation */}
        {stepIndex > 0 && step.key !== 'summary' && step.key !== 'design' && step.key !== 'deadline' && (
          <Button variant="ghost" onClick={() => go(stepIndex - 1)} className="mt-3">← Назад</Button>
        )}
      </div>

      {/* Order form modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="🚀 Создать заказ">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-hint mb-1 block text-xs font-semibold">Услуга</label>
            <input className="field" value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Название услуги" />
          </div>
          <div>
            <label className="text-hint mb-1 block text-xs font-semibold">Описание проекта</label>
            <textarea className="field" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Опишите задачу..." />
          </div>
          <div>
            <label className="text-hint mb-1 block text-xs font-semibold">Ваш бюджет ($)</label>
            <input className="field" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="1000" />
          </div>
          <Button onClick={submitOrder} loading={submitting} block>
            {submitting ? 'Создание...' : `Создать заказ за ${formatCurrency(total)}`}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
