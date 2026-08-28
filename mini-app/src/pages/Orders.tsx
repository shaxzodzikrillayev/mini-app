import { Link, useNavigate } from 'react-router-dom';
import { Order } from '../lib/types';
import { useApi } from '../lib/useApi';
import { PageSkeleton, ErrorState, EmptyState, Button } from '../components/ui';
import { OrderStatusBadge } from '../components/OrderStatus';
import { formatCurrency, formatDate } from '../lib/utils';

export default function Orders() {
  const nav = useNavigate();
  const { data, loading, error, reload } = useApi<Order[]>('/orders');

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data || data.length === 0)
    return (
      <>
        <div className="px-4 py-2">
          <h1 className="text-main text-[22px] font-extrabold tracking-tight">Мои заказы</h1>
        </div>
        <EmptyState
          icon="📦"
          title="У вас пока нет заказов"
          subtitle="Оформите первый проект через калькулятор"
          action={<Button onClick={() => nav('/calc')}>💰 Рассчитать проект</Button>}
        />
      </>
    );

  return (
    <div className="animate-fade-in pb-4">
      <div className="px-4 py-2">
        <h1 className="text-main text-[22px] font-extrabold tracking-tight">Мои заказы</h1>
        <p className="text-hint mt-1 text-sm">Всего заявок: {data.length}</p>
      </div>
      <div className="flex flex-col gap-3 px-4">
        {data.map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`} className="card block p-4 transition-transform active:scale-[0.98]">
            <div className="flex items-center justify-between gap-2">
              <span className="accent-color text-sm font-extrabold">#{o.orderNumber}</span>
              <span className="text-hint text-xs">{formatDate(o.createdAt)}</span>
            </div>
            <p className="text-main mt-2 text-[15px] font-bold">{o.service}</p>
            <p className="text-hint mt-0.5 text-sm">
              {o.price != null ? formatCurrency(o.price) : o.budget != null ? `Бюджет: ${formatCurrency(o.budget)}` : 'Цена по договорённости'}
            </p>
            <div className="mt-3">
              <OrderStatusBadge status={o.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
