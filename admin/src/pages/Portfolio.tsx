import { useState } from 'react';
import { Project } from '../lib/types';
import { useApi } from '../lib/useApi';
import { api } from '../lib/api';
import { Button, Badge, Modal, inputCls, Field, ConfirmDialog, Skeleton, ErrorState, EmptyState } from '../components/ui';
import { useToast } from '../store/toast';
import { parseTechnologies } from '../lib/utils';

interface FormState {
  title: string;
  description: string;
  image: string;
  category: string;
  technologies: string;
  demoUrl: string;
  published: boolean;
}

const emptyForm: FormState = {
  title: '',
  description: '',
  image: '',
  category: 'Landing',
  technologies: '',
  demoUrl: '',
  published: true,
};

export default function Portfolio() {
  const { data, loading, error, reload } = useApi<Project[]>('/projects');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [confirming, setConfirming] = useState(false);
  const toast = useToast((s) => s.show);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description,
      image: p.image || '',
      category: p.category,
      technologies: parseTechnologies(p.technologies).join(', '),
      demoUrl: p.demoUrl || '',
      published: p.published,
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
        image: form.image.trim() || null,
        category: form.category.trim() || 'Other',
        technologies: form.technologies,
        demoUrl: form.demoUrl.trim() || null,
        published: form.published,
      };
      if (editingId) {
        await api.put(`/projects/${editingId}`, body);
        toast('Проект обновлён', 'success');
      } else {
        await api.post('/projects', body);
        toast('Проект добавлен', 'success');
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
      await api.del(`/projects/${deleting.id}`);
      toast('Проект удалён', 'success');
      setDeleting(null);
      reload();
    } catch (e: any) {
      toast(e?.message || 'Ошибка', 'error');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <ListSkeleton />;
  if (error) return <ErrorState message={`Ошибка загрузки проектов: ${error}`} onRetry={reload} />;

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🎨 Portfolio</h1>
        <Button onClick={openAdd}>+ Добавить проект</Button>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState icon="🎨" message="Проектов пока нет. Добавьте первый проект." />
      ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((p) => (
          <div key={p.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
            {p.image ? (
              <img src={p.image} alt={p.title} className="h-36 w-full object-cover" />
            ) : (
              <div className="flex h-36 items-center justify-center bg-gray-100 text-3xl dark:bg-gray-700">🖼</div>
            )}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{p.title}</h3>
                {p.published ? <Badge tone="green">Опубликован</Badge> : <Badge tone="gray">Черновик</Badge>}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{p.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {parseTechnologies(p.technologies).slice(0, 4).map((t, i) => (
                  <span key={i} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-300">{t}</span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => openEdit(p)} className="flex-1">Изменить</Button>
                <Button variant="danger" onClick={() => setDeleting(p)}>Удалить</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Form modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Изменить проект' : 'Добавить проект'}>
        <div className="space-y-4">
          <Field label="Название">
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Описание">
            <textarea className={inputCls} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Изображение (URL)">
            <input className={inputCls} placeholder="https://..." value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Категория">
              <input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </Field>
            <Field label="Технологии (через запятую)">
              <input className={inputCls} value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} />
            </Field>
          </div>
          <Field label="Ссылка на demo">
            <input className={inputCls} placeholder="https://..." value={form.demoUrl} onChange={(e) => setForm({ ...form, demoUrl: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Опубликован
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button onClick={save} loading={busy}>{editingId ? 'Сохранить' : 'Добавить'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Удалить проект?"
        message={`Удалить проект «${deleting?.title}»?`}
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
      <Skeleton className="mb-5 h-8 w-40" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52" />
        ))}
      </div>
    </div>
  );
}
