import { useState } from 'react';
import { PriceItem } from '../lib/types';
import { useApi } from '../lib/useApi';
import { api } from '../lib/api';
import { Button, Modal, inputCls, Field, Skeleton, ConfirmDialog } from '../components/ui';
import { useToast } from '../store/toast';

export default function Pricing() {
  const { data, loading, error, reload } = useApi<PriceItem[]>('/pricing');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ key: '', label: '', value: '', group: 'project' });
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<PriceItem | null>(null);
  const [confirming, setConfirming] = useState(false);
  const toast = useToast((s) => s.show);

  if (loading) return <Skeleton className="h-64" />;
  if (error) {
    return (
      <div className="animate-fade-in rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">Ошибка загрузки цен: {error}</p>
        <Button variant="secondary" className="mt-4" onClick={reload}>Повторить</Button>
      </div>
    );
  }

  const items = data ?? [];
  const projects = items.filter((i) => i.group === 'project');
  const features = items.filter((i) => i.group === 'feature');

  const update = async (id: number, value: string) => {
    setBusy(true);
    try {
      await api.put(`/pricing/${id}`, { value: Number(value) || 0 });
      toast('Цена обновлена', 'success');
      setEditingId(null);
      reload();
    } catch (e: any) {
      toast(e?.message || 'Ошибка', 'error');
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    if (!form.label.trim()) {
      toast('Введите название', 'error');
      return;
    }
    setBusy(true);
    try {
      await api.post('/pricing', {
        key: form.key.trim() || form.label.toLowerCase().replace(/\s+/g, '_'),
        label: form.label.trim(),
        value: Number(form.value) || 0,
        group: form.group,
      });
      toast('Пункт добавлен', 'success');
      setAddOpen(false);
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
      await api.del(`/pricing/${deleting.id}`);
      toast('Пункт удалён', 'success');
      setDeleting(null);
      reload();
    } catch (e: any) {
      toast(e?.message || 'Ошибка', 'error');
    } finally {
      setConfirming(false);
    }
  };

  const renderGroup = (list: PriceItem[], label: string) => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-800">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <div className="space-y-2">
        {list.map((it) => (
          <div key={it.id} className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">{it.label}</span>
            {editingId === it.id ? (
              <div className="flex items-center gap-2">
                <input
                  className={`${inputCls} !w-24 !py-1`}
                  type="number"
                  defaultValue={it.value}
                  id={`price-${it.id}`}
                />
                <Button variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => {
                  const el = document.getElementById(`price-${it.id}`) as HTMLInputElement;
                  update(it.id, el.value);
                }} loading={busy}>✓</Button>
                <Button variant="ghost" className="!px-2 !py-1" onClick={() => setEditingId(null)}>✕</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">${it.value}</span>
                <Button variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => setEditingId(it.id)}>✎</Button>
                <Button variant="danger" className="!px-2 !py-1 text-xs" onClick={() => setDeleting(it)}>🗑</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💰 Pricing</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Цены калькулятора. Изменения применяются без правки кода.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>+ Добавить</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {renderGroup(projects, 'Типы проектов')}
        {renderGroup(features, 'Функции')}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Добавить пункт цены">
        <div className="space-y-4">
          <Field label="Название">
            <input className={inputCls} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ключ (опционально)">
              <input className={inputCls} value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
            </Field>
            <Field label="Цена ($)">
              <input className={inputCls} type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </Field>
          </div>
          <Field label="Группа">
            <select className={inputCls} value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
              <option value="project">project (типы проектов)</option>
              <option value="feature">feature (функции)</option>
            </select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Отмена</Button>
            <Button onClick={add} loading={busy}>Добавить</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Удалить пункт?"
        message={`Удалить пункт «${deleting?.label}»?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
        loading={confirming}
      />
    </div>
  );
}
