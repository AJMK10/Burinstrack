import { createPortal } from 'react-dom';
import { useEffect, type ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
  X,
} from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import {
  gradientIndexFor,
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
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="sidebar-logo-mark flex-shrink-0">
      <rect width="64" height="64" rx="12" fill="#CC1416" />
      {/* Point rouge signature BURINFORT — au-dessus du i */}
      <circle cx="40" cy="10" r="5" fill="#fff" opacity="0.95" />
      {/* Lettres BF bold */}
      <text x="8" y="46" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="28" fill="#fff" letterSpacing="-1">BF</text>
      {/* Barre rouge de soulignement */}
      <rect x="8" y="52" width="48" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
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
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
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
    <span className={`badge ${TONE[tone].badge} d-inline-flex align-items-center gap-1 ${className}`} style={{ fontWeight: 600, letterSpacing: '0.02em' }}>
      {dot && (
        <span
          className={`rounded-circle flex-shrink-0 ${TONE[tone].dot}`}
          style={{ width: 6, height: 6, display: 'inline-block' }}
        />
      )}
      {children}
    </span>
  );
}

export const InterventionBadge = ({ statut }: { statut: StatutIntervention }) => {
  const s = STATUT_INTERVENTION[statut];
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
};

export const SituationBadge = ({ situation }: { situation: StatutCopieur }) => {
  const s = SITUATION_COPIEUR[situation];
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
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
  rounded = 'rounded-2',
}: {
  name: string;
  size?: number;
  rounded?: string;
}) {
  const idx = gradientIndexFor(name);
  return (
    <div
      className={`bt-avatar av-${idx} ${rounded} flex-shrink-0`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading / empty states                                             */
/* ------------------------------------------------------------------ */
export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="spinner-border flex-shrink-0"
      style={{ width: size, height: size, borderWidth: 2 }}
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
    <div className="empty-state animate-fade-in">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {text && <p className="mt-1">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="error-state">
      <AlertCircle className="mb-3 text-danger" size={28} />
      <p className="fw-semibold text-danger mb-1" style={{ fontSize: '0.9rem' }}>
        {message ?? 'Impossible de charger les données.'}
      </p>
      <p className="text-muted" style={{ fontSize: '0.8rem' }}>
        Vérifiez que l'API est démarrée puis réessayez.
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-sm btn-outline-secondary mt-3">
          Réessayer
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Form helpers                                                       */
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
    <div className={`input-group ${className}`}>
      <span className="input-group-text bg-white border-end-0">
        <Search size={15} className="text-muted" />
      </span>
      <input
        type="search"
        className="form-control border-start-0 ps-0"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ boxShadow: 'none' }}
      />
      {value && (
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary border-start-0"
          onClick={() => onChange('')}
          aria-label="Effacer"
        >
          <X size={13} />
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
    <div className={`mb-3 ${className}`}>
      <label className="form-label">
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </label>
      {children}
      {error ? (
        <div className="invalid-feedback d-block">{error}</div>
      ) : (
        hint && <div className="form-text">{hint}</div>
      )}
    </div>
  );
}

export function FormSection({
  icon,
  title,
  children,
  className = '',
}: {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`form-section ${className}`}>
      <div className="form-section-title d-flex align-items-center gap-2">
        {icon && <span style={{ opacity: 0.7, display: 'flex' }}>{icon}</span>}
        {title}
      </div>
      {children}
    </div>
  );
}

export function SelectBox({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
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
    <div className="bt-segmented">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={value === o.value ? 'active' : ''}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, tone = 'brand' }: { value: number; tone?: Tone }) {
  const colors: Record<Tone, string> = {
    brand:   '#CC1416',
    emerald: '#10b981',
    amber:   '#f59e0b',
    rose:    '#ef4444',
    sky:     '#0ea5e9',
    violet:  '#8b5cf6',
    slate:   '#94a3b8',
  };
  return (
    <div className="bt-progress">
      <div
        className="bt-progress-bar animate-grow-x"
        style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: colors[tone] }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal & Drawer                                                     */
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
  const sizeClass = { md: 'bt-modal-md', lg: 'bt-modal-lg', xl: 'bt-modal-xl' }[size];
  return createPortal(
    <div className="bt-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bt-modal ${sizeClass}`}>
        <div className="bt-modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <div className="bt-modal-subtitle">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="bt-modal-body">{children}</div>
        {footer && <div className="bt-modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
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
  return createPortal(
    <>
      <div className="bt-drawer-backdrop" onClick={onClose} />
      <aside className="bt-drawer">
        <div className="bt-drawer-header">
          <div style={{ minWidth: 0 }}>
            <h2>{title}</h2>
            {subtitle && <div className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} className="btn-icon flex-shrink-0" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="bt-drawer-body">{children}</div>
        {footer && <div className="bt-drawer-footer">{footer}</div>}
      </aside>
    </>,
    document.body
  );
}

/** Ligne libellé / valeur dans les tiroirs de détail */
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
    <div className="detail-row">
      {icon && <div className="detail-icon">{icon}</div>}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="detail-label">{label}</div>
        <div className="detail-value">{children}</div>
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
    <div className="d-flex align-items-center justify-content-between px-3 py-2 border-top bg-light" style={{ fontSize: '0.8rem' }}>
      <span className="text-muted">
        {count} résultat{count > 1 ? 's' : ''} · page {page}
      </span>
      <div className="d-flex gap-2">
        <button
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft size={14} /> Précédent
        </button>
        <button
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          disabled={!hasNext}
          onClick={() => onPage(page + 1)}
        >
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
    success: <CheckCircle2 size={18} className="text-success flex-shrink-0" />,
    error:   <AlertCircle  size={18} className="text-danger flex-shrink-0"  />,
    info:    <Info         size={18} className="text-primary flex-shrink-0" />,
  };
  return (
    <div className="bt-toast-container">
      {toasts.map((t) => (
        <div key={t.id} className="bt-toast">
          <div className="mt-1">{icons[t.kind]}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="bt-toast-title">{t.title}</div>
            {t.description && <div className="bt-toast-desc">{t.description}</div>}
          </div>
          <button onClick={() => dismiss(t.id)} className="btn-icon" aria-label="Fermer" style={{ marginTop: '-2px' }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
