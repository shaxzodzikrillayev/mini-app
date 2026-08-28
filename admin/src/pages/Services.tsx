import { useState } from 'react';
import { Service } from '../lib/types';
import { useApi } from '../lib/useApi';
import { api } from '../lib/api';
import { Button, Badge, Modal, inputCls, Field, ConfirmDialog, Skeleton, ErrorState, EmptyState } from '../components/ui';
import { useToast } from '../store/toast';

interface FormState {
  title: string;
  description: string;
  price: string;
  duration: string;
  active: boolean;
}

const emptyForm: FormState = { title: '', description: '', price: '', duration: '', active: true };

export default function Services() {
  const { data, loading, error, reload } = useApi<Service[]>('/services');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [confirming, setConfirming] = useState(false);
  const toast = useToast((s) => s.show);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditingId(s.id);
    setForm({
      title: s.title,
      description: s.description,
      price: s.price != null ? String(s.price) : '',
      duration: s.duration || '',
      active: s.active,
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast('Заполните название и описание', 'error');
      return;
    }
    setBusy(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price ? Number(form.price) : null,
        duration: form.duration.trim() || null,
        active: form.active,
      };
      if (editingId) {
        await api.put(`/services/${editingId}`, body);
        toast('Услуга обновлена', 'success');
      } else {
        await api.post('/services', body);
        toast('Услуга добавлена', 'success');
      }
      setModalOpen(false);
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
      await api.del(`/services/${deleting.id}`);
      toast('Услуга удалена', 'success');
      setDeleting(null);
      reload();
    } catch (e: any) {
      toast(e?.message || 'Ошибка', 'error');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <ListSkeleton />;
  if (error) return <ErrorState message={`Ошибка загрузки услуг: ${error}`} onRetry={reload} />;

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🛠 Services</h1>
        <Button onClick={openAdd}>+ Добавить услугу</Button>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState icon="🛠" message="Услуг пока нет. Добавьте первую услугу." />
      ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((s) => (
          <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-800">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{s.title}</h3>
              {s.active ? <Badge tone="green">Активно</Badge> : <Badge tone="gray">Скрыта</Badge>}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{s.description}</p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {s.price != null ? `$${s.price}` : 'Бесплатно/по запросу'}
              </span>
              <span className="text-gray-500 dark:text-gray-400">{s.duration || '—'}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={() => openEdit(s)} className="flex-1">Изменить</Button>
              <Button variant="danger" onClick={() => setDeleting(s)}>Удалить</Button>
            </div>
          </div>
        ))}
      </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Изменить услугу' : 'Добавить услугу'}>
        <div className="space-y-4">
          <Field label="Название">
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Описание">
            <textarea className={inputCls} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Цена ($)">
              <input className={inputCls} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="Срок">
              <input className={inputCls} placeholder="3-5 дней" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Активна
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button onClick={save} loading={busy}>{editingId ? 'Сохранить' : 'Добавить'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Удалить услугу?"
        message={`Удалить услугу «${deleting?.title}»?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
        loading={confirming}
      />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div>
      <Skeleton className="mb-5 h-8 w-44" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
    </div>
  );
}
