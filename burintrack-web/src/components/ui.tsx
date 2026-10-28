import { useEffect, type ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
  X,
} from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import {
  gradientFor,
  initials,
  NATURE,
  SITUATION_COPIEUR,
  STATUT_CONTRAT,
  STATUT_INTERVENTION,
  TONE,
  type Tone,
} from '../lib/format';
import type {
  NatureIntervention,
  StatutContrat,
  StatutCopieur,
  StatutIntervention,
} from '../types';

/* ------------------------------------------------------------------ */
/*  Logo                                                               */
/* ------------------------------------------------------------------ */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="bt-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a5b4fc" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#bt-logo)" />
      <path
        d="M20 17h17a9 9 0 0 1 3.4 17.3A9.5 9.5 0 0 1 38 52H20z"
        fill="none"
        stroke="#fff"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path d="M20 34h18" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  En-tête de page                                                    */
/* ------------------------------------------------------------------ */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Badges                                                             */
/* ------------------------------------------------------------------ */
export function Badge({
  tone = 'slate',
  dot,
  children,
  className = '',
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`badge ${TONE[tone].badge} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${TONE[tone].dot}`} />}
      {children}
    </span>
  );
}

export const InterventionBadge = ({ statut }: { statut: StatutIntervention }) => {
  const s = STATUT_INTERVENTION[statut];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
};

export const SituationBadge = ({ situation }: { situation: StatutCopieur }) => {
  const s = SITUATION_COPIEUR[situation];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
};

export const ContratBadge = ({ statut }: { statut: StatutContrat }) => {
  const s = STATUT_CONTRAT[statut];
  return <Badge tone={s.tone}>{s.label}</Badge>;
};

export const NatureBadge = ({ nature }: { nature: NatureIntervention }) => {
  const n = NATURE[nature];
  return <Badge tone={n.tone}>{n.short}</Badge>;
};

/* ------------------------------------------------------------------ */
/*  Avatar                                                             */
/* ------------------------------------------------------------------ */
export function Avatar({
  name,
  size = 40,
  rounded = 'rounded-xl',
}: {
  name: string;
  size?: number;
  rounded?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br font-display font-bold text-white shadow-soft ${gradientFor(name)} ${rounded}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chargement / états vides                                           */
/* ------------------------------------------------------------------ */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Chargement"
    />
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-16 text-center animate-fade-in">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/60 px-6 py-12 text-center">
      <AlertCircle className="mb-3 text-rose-500" size={28} />
      <p className="text-sm font-semibold text-rose-700">{message ?? 'Impossible de charger les données.'}</p>
      <p className="mt-1 text-xs text-rose-600/80">Vérifiez que l'API est démarrée puis réessayez.</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm mt-4">
          Réessayer
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Champs                                                             */
/* ------------------------------------------------------------------ */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
      <input
        type="search"
        className="input pl-10 pr-9"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          aria-label="Effacer la recherche"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function Field({
  label,
  error,
  hint,
  required,
  className = '',
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label className="label">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>
      )}
    </div>
  );
}

/** Conteneur de <select> natif avec chevron. */
export function SelectBox({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; title?: string }[];
}) {
  return (
    <div className="inline-flex rounded-xl border border-ink-200 bg-white p-1 shadow-soft">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            value === o.value ? 'bg-brand-600 text-white shadow-soft' : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, tone = 'brand' }: { value: number; tone?: Tone }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
      <div
        className={`h-full origin-left rounded-full animate-grow-x ${TONE[tone].dot}`}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modale & tiroir                                                    */
/* ------------------------------------------------------------------ */
function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = 'lg',
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  const width = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={`relative flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-pop-in sm:rounded-3xl ${width}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-ink-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="btn-icon -mr-2 -mt-1" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-ink-100 bg-ink-50/60 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl animate-slide-in-right">
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-5">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-ink-900">{title}</h2>
            {subtitle && <div className="mt-0.5 text-sm text-ink-500">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="btn-icon -mr-2 -mt-1 shrink-0" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-ink-100 bg-ink-50/60 px-6 py-4">{footer}</div>}
      </aside>
    </div>
  );
}

/** Ligne "libellé / valeur" pour les panneaux de détail. */
export function DetailRow({
  icon,
  label,
  children,
}: {
  icon?: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      {icon && <div className="mt-0.5 text-ink-400">{icon}</div>}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
        <div className="mt-0.5 break-words text-sm text-ink-800">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */
export function Pagination({
  page,
  onPage,
  hasNext,
  count,
}: {
  page: number;
  onPage: (p: number) => void;
  hasNext: boolean;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50/50 px-5 py-3">
      <p className="text-xs font-medium text-ink-500">
        {count} résultat{count > 1 ? 's' : ''} · page {page}
      </p>
      <div className="flex gap-2">
        <button className="btn-secondary btn-sm" disabled={page === 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft size={14} /> Précédent
        </button>
        <button className="btn-secondary btn-sm" disabled={!hasNext} onClick={() => onPage(page + 1)}>
          Suivant <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toasts                                                             */
/* ------------------------------------------------------------------ */
export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald-500" />,
    error: <AlertCircle size={18} className="text-rose-500" />,
    info: <Info size={18} className="text-brand-500" />,
  };
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[2000] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-lift animate-pop-in"
        >
          <div className="mt-0.5">{icons[t.kind]}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-900">{t.title}</p>
            {t.description && <p className="mt-0.5 text-xs text-ink-500">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-ink-700" aria-label="Fermer">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
