import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Order, ORDER_STATUSES, ORDER_TONES } from '../lib/types';
import { useApi } from '../lib/useApi';
import { api } from '../lib/api';
import { Button, Badge, Skeleton, Modal, inputCls, Field, ConfirmDialog } from '../components/ui';
import { useToast } from '../store/toast';
import { formatDate } from '../lib/utils';

export default function Orders() {
  const { data, loading, error, reload } = useApi<Order[]>('/orders');
  const [editing, setEditing] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState<Order | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [clientMessage, setClientMessage] = useState('');
  const toast = useToast((s) => s.show);

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await api.put<Order>(`/orders/${editing.id}`, {
        status: editing.status,
        price: editing.price,
        service: editing.service,
        description: editing.description,
        ...(clientMessage.trim() ? { message: clientMessage.trim() } : {}),
      });
      toast('Заявка обновлена', 'success');
      setEditing(null);
      reload();
    } catch (e: any) {
      toast(e?.message || 'Ошибка', 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setConfirming(true);
    try {
      await api.del(`/orders/${deleting.id}`);
      toast('Заявка удалена', 'success');
      setDeleting(null);
      reload();
    } catch (e: any) {
      toast(e?.message || 'Ошибка', 'error');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <OrdersSkeleton />;
  if (error) {
    return (
      <div className="animate-fade-in rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">Ошибка загрузки заявок: {error}</p>
        <Button variant="secondary" className="mt-4" onClick={reload}>Повторить</Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📦 Orders</h1>
        <Badge tone="blue">Всего: {data?.length ?? 0}</Badge>
      </div>

      {!data || data.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">Заявок пока нет</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Клиент</th>
                <th className="px-4 py-3">Проект</th>
                <th className="px-4 py-3">Цена</th>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.id} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400">#{o.orderNumber}</td>
                  <td className="px-4 py-3">
                    {o.user ? (
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{o.user.firstName}</p>
                        <p className="text-xs text-gray-400">@{o.user.username || '—'}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{o.service}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                    {o.price != null ? `$${o.price}` : o.budget != null ? `~$${o.budget}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3"><Badge tone={ORDER_TONES[o.status] || 'gray'}>{o.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/orders/${o.id}`}>
                        <Button variant="secondary">Открыть</Button>
                      </Link>
                      <Button variant="secondary" onClick={() => { setEditing(o); setClientMessage(''); }}>Изменить</Button>
                      <Button variant="danger" onClick={() => setDeleting(o)}>Удалить</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Заявка #${editing?.orderNumber}`}>
        {editing && (
          <div className="space-y-4">
            <Field label="Услуга">
              <input className={inputCls} value={editing.service} onChange={(e) => setEditing({ ...editing, service: e.target.value })} />
            </Field>
            <Field label="Описание">
              <textarea className={inputCls} rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Цена ($)">
                <input className={inputCls} type="number" value={editing.price ?? ''} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) || null })} />
              </Field>
              <Field label="Статус">
                <select className={inputCls} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as Order['status'] })}>
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Сообщение клиенту (необязательно)">
              <textarea className={inputCls} rows={2} placeholder="Напишите клиенту сообщение..." value={clientMessage} onChange={(e) => setClientMessage(e.target.value)} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>Отмена</Button>
              <Button onClick={save} loading={busy}>Сохранить</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Удалить заявку?"
        message={`Вы действительно хотите удалить заявку #${deleting?.orderNumber}? Это действие нельзя отменить.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
        loading={confirming}
      />
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div>
      <Skeleton className="mb-5 h-8 w-40" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    </div>
  );
}
