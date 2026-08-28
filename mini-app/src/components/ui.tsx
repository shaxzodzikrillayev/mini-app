import { ReactNode } from 'react';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'h-14 w-14 text-2xl' : size === 'sm' ? 'h-9 w-9 text-sm' : 'h-12 w-12 text-xl';
  return (
    <div
      className={`btn-primary flex shrink-0 ${sz} items-center justify-center rounded-2xl`}
      style={{ borderRadius: 14 }}
    >
      🚀
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  block = false,
}: {
  children: ReactNode;
  variant?: 'primary' | 'soft' | 'outline' | 'ghost';
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  block?: boolean;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none hover:brightness-[1.04]';
  const variants = {
    primary: 'btn-primary',
    soft: 'btn-soft',
    outline: 'border border-[var(--brand)] text-[var(--brand)] dark:text-[#a5b4fc]',
    ghost: 'text-hint hover:text-main',
  };
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${block ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div className="animate-fade-in space-y-4 px-4 py-6">
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton className="h-28 w-full rounded-3xl" />
      </div>
      <Skeleton className="h-32 w-full rounded-3xl" />
      <Skeleton className="h-32 w-full rounded-3xl" />
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  title = 'Ой! Что-то пошло не так',
}: {
  message: string;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="animate-pop flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl dark:bg-red-500/10">
        ⚠️
      </div>
      <p className="text-main text-base font-bold">{title}</p>
      <p className="text-hint max-w-xs text-sm">{message}</p>
      {onRetry && (
        <Button variant="soft" onClick={onRetry} className="mt-2">
          🔄 Попробовать снова
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, subtitle, action }: { icon: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="animate-pop flex h-16 w-16 items-center justify-center rounded-2xl bg-black/5 text-3xl dark:bg-white/10">
        {icon}
      </div>
      <p className="text-main mt-1 text-base font-bold">{title}</p>
      {subtitle && <p className="text-hint max-w-xs text-sm">{subtitle}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 px-4 pt-2">
      <h1 className="text-main text-[22px] font-extrabold tracking-tight" style={{ fontVariationSettings: '' }}>{title}</h1>
      {subtitle && <p className="text-hint mt-1 text-sm">{subtitle}</p>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="glass text-main animate-slide-up max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">{title}</h3>
            <button onClick={onClose} className="text-hint flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-xl leading-none dark:bg-white/10">
              ×
            </button>
          </div>
        )}
        {children}
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  );
}

export interface FieldProps {
  label?: string;
  error?: string;
  icon?: string;
  children: ReactNode;
}

export function Field({ label, error, icon, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-hint text-xs font-semibold">{label}</label>}
      <div className="relative">
        {icon && <span className="text-hint absolute left-3.5 top-1/2 -translate-y-1/2 text-sm">{icon}</span>}
        <div className={icon ? '[&>input]:pl-10 [&>textarea]:pl-10' : ''}>{children}</div>
      </div>
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
