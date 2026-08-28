import { OrderStatus, ORDER_FLOW } from '../lib/types';

const STATUS_ICONS: Record<OrderStatus, string> = {
  'Новый': '🆕',
  'На рассмотрении': '💬',
  'В работе': '⚙️',
  'Проверка': '🔍',
  'Завершён': '🎉',
  'Отменён': '✖️',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  'Новый': 'var(--brand)',
  'На рассмотрении': '#f59e0b',
  'В работе': '#3b82f6',
  'Проверка': '#8b5cf6',
  'Завершён': '#10b981',
  'Отменён': '#ef4444',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const color = STATUS_COLORS[status] || 'var(--brand)';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
      style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      <span>{STATUS_ICONS[status]}</span>
      {status}
    </span>
  );
}

export function OrderStatusProgress({ status }: { status: OrderStatus }) {
  const isCancelled = status === 'Отменён';
  const currentIdx = ORDER_FLOW.indexOf(status as any);
  const idx = currentIdx === -1 ? 0 : currentIdx;
  const pct = Math.round((idx / (ORDER_FLOW.length - 1)) * 100);

  return (
    <div className="mt-3">
      {isCancelled ? (
        <div className="flex items-center gap-2">
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div className="absolute inset-y-0 left-0 rounded-full bg-red-500/80" style={{ width: '100%' }} />
          </div>
          <span className="text-xs font-bold text-red-500">Отменён</span>
        </div>
      ) : (
        <>
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{ width: `${Math.max(pct, idx > 0 ? 10 : 5)}%`, background: STATUS_COLORS[status] || 'var(--brand)' }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            {ORDER_FLOW.map((s, i) => (
              <span
                key={s}
                className="text-[10px]"
                style={{ color: i <= idx ? STATUS_COLORS[s as OrderStatus] : 'var(--tg-theme-hint-color, #9ca3af)', opacity: i <= idx ? 1 : 0.5 }}
              >
                {STATUS_ICONS[s]}
              </span>
            ))}
          </div>
        </>
      )}
      <div className="mt-1 flex items-center justify-between">
        <OrderStatusBadge status={status} />
        {!isCancelled && <span className="text-hint text-xs font-bold">{pct}%</span>}
      </div>
    </div>
  );
}
