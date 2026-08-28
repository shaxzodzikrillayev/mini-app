import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OrderDetailData } from '../lib/types';
import { useApi } from '../lib/useApi';
import { PageSkeleton, ErrorState, Button, Spinner } from '../components/ui';
import { OrderStatusProgress } from '../components/OrderStatus';
import { formatCurrency, formatDate } from '../lib/utils';
import { api } from '../lib/api';
import { toast } from '../store/toast';
import { haptic } from '../lib/telegram';

export default function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, loading, error, reload } = useApi<OrderDetailData>(`/orders/${id}`);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data || !data.order) return <ErrorState message="Заказ не найден" onRetry={() => nav('/orders')} />;

  const order = data.order;

  const sendMessage = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      await api.post(`/orders/${id}/messages`, { message: value });
      toast.success('Сообщение отправлено');
      haptic('success');
      setText('');
      reload();
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fade-in pb-4">
      <div className="px-4 py-2">
        <Button variant="soft" onClick={() => nav(-1)} className="mb-3 !px-3 !py-2 text-xs">← Назад</Button>
        <h1 className="text-main text-[22px] font-extrabold tracking-tight">Заказ #{order.orderNumber}</h1>
        <p className="text-hint mt-0.5 text-sm">{order.service}</p>
      </div>

      <div className="flex flex-col gap-3 px-4">
        <div className="card p-4">
          <p className="text-hint text-xs font-bold uppercase tracking-wide">Текущий статус</p>
          <OrderStatusProgress status={order.status} />
        </div>

        <div className="card space-y-3 p-4">
          <Row label="Номер заказа" value={`#${order.orderNumber}`} />
          <Row label="Услуга" value={order.service} />
          <Row label="Дата" value={formatDate(order.createdAt)} />
          <Row
            label="Стоимость"
            value={order.price != null ? formatCurrency(order.price) : order.budget != null ? `Бюджет: ${formatCurrency(order.budget)}` : 'по договорённости'}
          />
        </div>

        <div className="card p-4">
          <p className="text-hint text-xs font-bold uppercase tracking-wide">Описание</p>
          <p className="text-main mt-1.5 text-sm leading-relaxed">{order.description}</p>
        </div>

        {/* Client <-> admin chat */}
        <section className="card p-4">
          <p className="text-hint text-xs font-bold uppercase tracking-wide">Переписка с менеджером</p>
          {data.messages.length === 0 ? (
            <p className="text-hint mt-3 text-sm">Пока нет сообщений. Напишите нам — мы на связи.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2.5">
              {data.messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[82%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.sender === 'client' ? 'btn-primary' : 'btn-soft text-main'
                    }`}
                  >
                    {m.message}
                    <p className="mt-1 text-[10px] opacity-70">{formatDate(m.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Написать менеджеру..."
              className="field flex-1"
            />
            <Button onClick={sendMessage} loading={sending} className="!px-4" disabled={!text.trim()}>
              {sending ? <Spinner className="h-4 w-4" /> : '➤'}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-hint text-sm">{label}</span>
      <span className="text-main text-sm font-semibold">{value}</span>
    </div>
  );
}
