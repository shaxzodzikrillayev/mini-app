import { useToast } from '../store/toast';

const ICONS: Record<string, string> = {
  success: '✅',
  error: '⚠️',
  info: 'ℹ️',
};

export default function ToastContainer() {
  const toasts = useToast((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed left-1/2 top-3 z-[100] flex w-[92%] max-w-md -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="card animate-slide-up pointer-events-auto flex items-start gap-3 px-4 py-3 shadow-lg"
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
        >
          <span className="text-lg leading-none">{ICONS[t.type]}</span>
          <div className="min-w-0">
            <p className="text-main text-sm font-semibold">{t.title}</p>
            {t.description && <p className="text-hint mt-0.5 text-xs">{t.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
