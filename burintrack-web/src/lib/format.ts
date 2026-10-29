import { format, formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';
import type {
  NatureIntervention,
  StatutContrat,
  StatutCopieur,
  StatutIntervention,
} from '../types';

export type Tone = 'brand' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate';

/** Custom CSS classes par ton (définis dans adminkit.scss) */
export const TONE: Record<Tone, { badge: string; dot: string; soft: string; solid: string; text: string }> = {
  brand:   { badge: 'badge-brand',   dot: 'dot-brand',   soft: 'soft-brand',   solid: 'solid-brand',   text: 'text-brand'   },
  emerald: { badge: 'badge-emerald', dot: 'dot-emerald', soft: 'soft-emerald', solid: 'solid-emerald', text: 'text-emerald' },
  amber:   { badge: 'badge-amber',   dot: 'dot-amber',   soft: 'soft-amber',   solid: 'solid-amber',   text: 'text-amber'   },
  rose:    { badge: 'badge-rose',    dot: 'dot-rose',    soft: 'soft-rose',    solid: 'solid-rose',    text: 'text-rose'    },
  sky:     { badge: 'badge-sky',     dot: 'dot-sky',     soft: 'soft-sky',     solid: 'solid-sky',     text: 'text-sky'     },
  violet:  { badge: 'badge-violet',  dot: 'dot-violet',  soft: 'soft-violet',  solid: 'solid-violet',  text: 'text-violet'  },
  slate:   { badge: 'badge-slate',   dot: 'dot-slate',   soft: 'soft-slate',   solid: 'solid-slate',   text: 'text-slate'   },
};

export const STATUT_INTERVENTION: Record<StatutIntervention, { label: string; tone: Tone }> = {
  Ouverte: { label: 'Ouverte',  tone: 'sky'     },
  EnCours: { label: 'En cours', tone: 'amber'   },
  Resolue: { label: 'Résolue',  tone: 'emerald' },
  Fermee:  { label: 'Fermée',   tone: 'slate'   },
};

export const SITUATION_COPIEUR: Record<StatutCopieur, { label: string; tone: Tone }> = {
  Actif:         { label: 'Actif',          tone: 'emerald' },
  EnMaintenance: { label: 'En maintenance', tone: 'amber'   },
  Remplace:      { label: 'Remplacé',       tone: 'slate'   },
  HorsService:   { label: 'Hors service',   tone: 'rose'    },
};

export const STATUT_CONTRAT: Record<StatutContrat, { label: string; tone: Tone }> = {
  Actif:    { label: 'Contrat actif',    tone: 'emerald' },
  Expire:   { label: 'Contrat expiré',   tone: 'rose'    },
  Suspendu: { label: 'Contrat suspendu', tone: 'amber'   },
  Resilie:  { label: 'Contrat résilié',  tone: 'slate'   },
};

export const NATURE: Record<NatureIntervention, { label: string; short: string; tone: Tone }> = {
  MaintenancePreventive: { label: 'Maintenance préventive', short: 'Préventive',  tone: 'emerald' },
  MaintenanceCurative:   { label: 'Maintenance curative',   short: 'Curative',    tone: 'amber'   },
  Panne:                 { label: 'Panne',                  short: 'Panne',       tone: 'rose'    },
  Installation:          { label: 'Installation',           short: 'Installation',tone: 'brand'   },
  FormationUtilisateur:  { label: 'Formation utilisateur',  short: 'Formation',   tone: 'violet'  },
  DeplacementTechnique:  { label: 'Déplacement technique',  short: 'Déplacement', tone: 'sky'     },
  Autre:                 { label: 'Autre',                  short: 'Autre',       tone: 'slate'   },
};

/** Couleurs hex pour les graphiques SVG */
export const TONE_HEX: Record<Tone, string> = {
  brand:   '#CC1416',  // Rouge BURINFORT
  emerald: '#10b981',
  amber:   '#f59e0b',
  rose:    '#f43f5e',
  sky:     '#0ea5e9',
  violet:  '#8b5cf6',
  slate:   '#94a3b8',
};

export const MARQUE_TONE: Record<string, Tone> = {
  Xerox:          'sky',
  Canon:          'rose',
  HP:             'brand',
  Ricoh:          'emerald',
  'Konica Minolta': 'amber',
  Sharp:          'violet',
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

/** Palette de gradients pour les avatars (6 = nb classes av-0..av-5) */
export const gradientIndexFor = (text: string): number => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h % 6;
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
