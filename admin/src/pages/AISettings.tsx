import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button, inputCls, Field, Skeleton, ErrorState } from '../components/ui';
import { useToast } from '../store/toast';

export default function AISettings() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast((s) => s.show);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ systemPrompt: string }>('/ai-settings');
      setPrompt(data.systemPrompt || '');
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/ai-settings', { systemPrompt: prompt });
      toast('Промпт сохранён', 'success');
    } catch (e: any) {
      toast(e?.message || 'Ошибка', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">🤖 AI Settings</h1>
      <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
        Системный промпт для AI-консультанта. Используется при каждом обращении клиента.
      </p>

      {loading ? (
        <Skeleton className="h-64" />
      ) : error ? (
        <ErrorState message={`Ошибка загрузки настроек: ${error}`} onRetry={load} />
      ) : (
        <>
          <Field label="Системный промпт">
            <textarea
              className={`${inputCls} min-h-[220px] font-mono text-xs`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Введите инструкции для AI-консультанта..."
            />
          </Field>
          <div className="mt-4">
            <Button onClick={save} loading={saving}>💾 Сохранить промпт</Button>
          </div>
          <p className="text-hint mt-4 text-xs text-gray-400">
            Совет: укажите AI не называть точные цены и невозможные сроки, а собирать резюме заявки.
          </p>
        </>
      )}
    </div>
  );
}
