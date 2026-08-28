import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Order, OrderStatus, ORDER_STATUSES, ORDER_TONES, Message } from '../lib/types';
import { api } from '../lib/api';
import { Button, Badge, inputCls, Skeleton } from '../components/ui';
import { useToast } from '../store/toast';
import { formatDateTime } from '../lib/utils';

export default function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [price, setPrice] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);
  const toast = useToast((s) => s.show);
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, m] = await Promise.all([
        api.get<Order>(`/orders/${id}`),
        api.get<Message[]>(`/orders/${id}/messages`),
      ]);
      setOrder(o);
      setMessages(m);
      setPrice(o.price != null ? String(o.price) : '');
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const changeStatus = async (status: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      await api.put<Order>(`/orders/${order.id}`, { status });
      setOrder({ ...order, status });
      toast('Статус обновлён (клиент уведомлён)', 'success');
    } catch (e: any) {
      toast(e?.message || 'Ошибка', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const savePrice = async () => {
    if (!order) return;
    const v = price.trim() === '' ? null : Number(price);
    if (v !== null && (Number.isNaN(v) || v < 0)) {
      toast('Введите корректную цену', 'error');
      return;
    }
    setSavingPrice(true);
    try {
      const updated = await api.put<Order>(`/orders/${order.id}`, { price: v });
      setOrder({ ...order, price: updated.price });
      setEditingPrice(false);
      toast('Цена сохранена', 'success');
    } catch (e: any) {
      toast(e?.message || 'Ошибка', 'error');
    } finally {
      setSavingPrice(false);
    }
  };

  const remove = async () => {
    if (!order) return;
    setDeleting(true);
    try {
      await api.del(`/orders/${order.id}`);
      toast('Заявка удалена', 'success');
      nav('/orders');
    } catch (e: any) {
      setDeleting(false);
      toast(e?.message || 'Ошибка удаления', 'error');
    }
  };

  const send = async () => {
    if (!order || !composer.trim()) return;
    setSending(true);
    try {
      await api.post(`/orders/${order.id}/messages`, { message: composer.trim() });
      setComposer('');
      const m = await api.get<Message[]>(`/orders/${order.id}/messages`);
      setMessages(m);
      toast('Сообщение отправлено клиенту', 'success');
    } catch (e: any) {
      toast(e?.message || 'Ошибка', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (error || !order) {
    return (
      <div className="animate-fade-in rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">{error || 'Заявка не найдена'}</p>
        <Button variant="secondary" className="mt-4" onClick={load}>Повторить</Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Link to="/orders" className="mb-3 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400">← Все заявки</Link>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Order info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Заявка #{order.orderNumber}
            </h1>
            <div className="flex items-center gap-2">
              <Badge tone={ORDER_TONES[order.status] || 'gray'}>{order.status}</Badge>
              {confirmDelete ? (
                <span className="flex items-center gap-1">
                  <Button loading={deleting} onClick={remove} className="!px-2 !py-1 text-xs !bg-red-600">Удалить</Button>
                  <Button variant="ghost" onClick={() => setConfirmDelete(false)} className="!px-2 !py-1 text-xs">✕</Button>
                </span>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="text-xs text-red-500 hover:underline">удалить</button>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <Row label="Клиент" value={order.user ? `${order.user.firstName} (@${order.user.username || '—'})` : '—'} />
            <Row label="Услуга" value={order.service} />
            <Row label="Бюджет" value={order.budget != null ? `$${order.budget}` : '—'} />
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Цена</span>
              {editingPrice ? (
                <span className="flex items-center gap-1.5">
                  <input
                    className={`${inputCls} w-28 !py-1 text-right`}
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="—"
                  />
                  <Button onClick={savePrice} loading={savingPrice} className="!px-2 !py-1 text-xs">OK</Button>
                  <Button variant="ghost" onClick={() => setEditingPrice(false)} className="!px-2 !py-1 text-xs">✕</Button>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {order.price != null ? `$${order.price}` : '—'}
                  </span>
                  <button onClick={() => { setPrice(order.price != null ? String(order.price) : ''); setEditingPrice(true); }} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">изменить</button>
                </span>
              )}
            </div>
            <Row label="Создано" value={formatDateTime(order.createdAt)} />
          </div>

          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Описание</p>
            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300">
              {order.description}
            </p>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Изменить статус</p>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map((s) => (
                <Button
                  key={s}
                  variant={s === order.status ? 'primary' : 'secondary'}
                  onClick={() => changeStatus(s)}
                  disabled={updating}
                  className="!px-3 !py-1.5 text-xs"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">💬 Общение с клиентом</h2>
          </div>
          <div className="max-h-80 flex-1 space-y-2 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">Сообщений пока нет</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    m.sender === 'admin'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.message}</p>
                  <p className={`mt-1 text-[10px] ${m.sender === 'admin' ? 'text-white/70' : 'text-gray-400'}`}>
                    {formatDateTime(m.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="flex gap-2 border-t border-gray-200 p-3 dark:border-gray-700">
            <input
              className={inputCls}
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ответить клиенту..."
            />
            <Button onClick={send} loading={sending} className="shrink-0">➤</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-64" />
      <Skeleton className="h-72" />
    </div>
  );
}
