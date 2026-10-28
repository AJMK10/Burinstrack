import { format, formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';
import type {
  NatureIntervention,
  StatutContrat,
  StatutCopieur,
  StatutIntervention,
} from '../types';

export type Tone = 'brand' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate';

/** Classes Tailwind par ton (badges, pastilles). */
export const TONE: Record<Tone, { badge: string; dot: string; soft: string; solid: string; text: string }> = {
  brand: {
    badge: 'bg-brand-50 text-brand-700 ring-brand-200',
    dot: 'bg-brand-500',
    soft: 'bg-brand-50 text-brand-600',
    solid: 'bg-brand-600 text-white',
    text: 'text-brand-600',
  },
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
    soft: 'bg-emerald-50 text-emerald-600',
    solid: 'bg-emerald-600 text-white',
    text: 'text-emerald-600',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
    soft: 'bg-amber-50 text-amber-600',
    solid: 'bg-amber-500 text-white',
    text: 'text-amber-600',
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    dot: 'bg-rose-500',
    soft: 'bg-rose-50 text-rose-600',
    solid: 'bg-rose-600 text-white',
    text: 'text-rose-600',
  },
  sky: {
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    dot: 'bg-sky-500',
    soft: 'bg-sky-50 text-sky-600',
    solid: 'bg-sky-600 text-white',
    text: 'text-sky-600',
  },
  violet: {
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
    dot: 'bg-violet-500',
    soft: 'bg-violet-50 text-violet-600',
    solid: 'bg-violet-600 text-white',
    text: 'text-violet-600',
  },
  slate: {
    badge: 'bg-ink-100 text-ink-600 ring-ink-200',
    dot: 'bg-ink-400',
    soft: 'bg-ink-100 text-ink-600',
    solid: 'bg-ink-700 text-white',
    text: 'text-ink-500',
  },
};

export const STATUT_INTERVENTION: Record<StatutIntervention, { label: string; tone: Tone }> = {
  Ouverte: { label: 'Ouverte', tone: 'sky' },
  EnCours: { label: 'En cours', tone: 'amber' },
  Resolue: { label: 'Résolue', tone: 'emerald' },
  Fermee: { label: 'Fermée', tone: 'slate' },
};

export const SITUATION_COPIEUR: Record<StatutCopieur, { label: string; tone: Tone }> = {
  Actif: { label: 'Actif', tone: 'emerald' },
  EnMaintenance: { label: 'En maintenance', tone: 'amber' },
  Remplace: { label: 'Remplacé', tone: 'slate' },
  HorsService: { label: 'Hors service', tone: 'rose' },
};

export const STATUT_CONTRAT: Record<StatutContrat, { label: string; tone: Tone }> = {
  Actif: { label: 'Contrat actif', tone: 'emerald' },
  Expire: { label: 'Contrat expiré', tone: 'rose' },
  Suspendu: { label: 'Contrat suspendu', tone: 'amber' },
  Resilie: { label: 'Contrat résilié', tone: 'slate' },
};

export const NATURE: Record<NatureIntervention, { label: string; short: string; tone: Tone }> = {
  MaintenancePreventive: { label: 'Maintenance préventive', short: 'Préventive', tone: 'emerald' },
  MaintenanceCurative: { label: 'Maintenance curative', short: 'Curative', tone: 'amber' },
  Panne: { label: 'Panne', short: 'Panne', tone: 'rose' },
  Installation: { label: 'Installation', short: 'Installation', tone: 'brand' },
  FormationUtilisateur: { label: 'Formation utilisateur', short: 'Formation', tone: 'violet' },
  DeplacementTechnique: { label: 'Déplacement technique', short: 'Déplacement', tone: 'sky' },
  Autre: { label: 'Autre', short: 'Autre', tone: 'slate' },
};

/** Couleurs hex pour les graphiques (alignées sur les tons ci-dessus). */
export const TONE_HEX: Record<Tone, string> = {
  brand: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
  slate: '#94a3b8',
};

export const MARQUE_TONE: Record<string, Tone> = {
  Xerox: 'sky',
  Canon: 'rose',
  HP: 'brand',
  Ricoh: 'emerald',
  'Konica Minolta': 'amber',
  Sharp: 'violet',
};

export const nf = new Intl.NumberFormat('fr-FR');
export const formatNumber = (n: number | null | undefined) => nf.format(n ?? 0);

export const compact = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });
export const formatCompact = (n: number) => compact.format(n);

export const formatDate = (iso?: string | null, pattern = 'dd MMM yyyy') =>
  iso ? format(new Date(iso), pattern, { locale: fr }) : '—';

export const formatDateTime = (iso?: string | null) =>
  iso ? format(new Date(iso), "dd MMM yyyy 'à' HH:mm", { locale: fr }) : '—';

export const formatTime = (iso?: string | null) => (iso ? format(new Date(iso), 'HH:mm') : '—');

export const fromNow = (iso: string) =>
  formatDistanceToNowStrict(new Date(iso), { locale: fr, addSuffix: true });

export const initials = (name: string) =>
  name
    .split(/[\s&-]+/)
    .filter((w) => w.length > 1 || /[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '?';

/** Dégradé déterministe pour les avatars, selon le texte. */
const GRADIENTS = [
  'from-brand-400 to-brand-700',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-600',
  'from-rose-400 to-pink-600',
  'from-sky-400 to-blue-600',
  'from-violet-400 to-purple-700',
];
export const gradientFor = (text: string) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length]!;
};

/** Extrait un message lisible d'une erreur Axios. */
export const errorMessage = (err: unknown, fallback = 'Une erreur est survenue.'): string => {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === 'string' && data) return data;
  if (data && typeof data === 'object') {
    const d = data as { title?: string; errors?: Record<string, string[]> };
    if (d.errors) return Object.values(d.errors).flat().join(' ');
    if (d.title) return d.title;
  }
  return fallback;
};

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};
