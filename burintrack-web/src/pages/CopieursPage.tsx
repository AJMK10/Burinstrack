import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertTriangle,
  CalendarClock,
  Cpu,
  MapPin,
  Network,
  Pencil,
  Plus,
  Printer,
  StickyNote,
  Wrench,
} from 'lucide-react';
import api from '../lib/api';
import type { Client, Copieur, Intervention, StatutContrat, StatutCopieur } from '../types';
import { useAuthStore } from '../store/authStore';
import { errorMessage, formatDate, MARQUE_TONE, SITUATION_COPIEUR, STATUT_CONTRAT, TONE } from '../lib/format';
import {
  ContratBadge,
  DetailRow,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  InterventionBadge,
  Modal,
  NatureBadge,
  PageHeader,
  ProgressBar,
  SearchInput,
  SelectBox,
  SituationBadge,
  Skeleton,
  Spinner,
} from '../components/ui';
import { toast } from '../store/toastStore';

const MARQUES = ['Xerox', 'Canon', 'HP', 'Ricoh', 'Konica Minolta', 'Sharp', 'Kyocera', 'Brother', 'Epson'];

const schema = z
  .object({
    clientId: z.string().min(1, 'Sélectionnez un client'),
    marque: z.string().trim().min(1, 'Requis'),
    modele: z.string().trim().min(1, 'Requis'),
    designation: z.string().trim().optional(),
    numeroSerie: z.string().trim().min(1, 'Requis'),
    dateDebutContrat: z.string().min(1, 'Requis'),
    dateFinContrat: z.string().min(1, 'Requis'),
    statutContrat: z.enum(['Actif', 'Expire', 'Suspendu', 'Resilie']),
    situation: z.enum(['Actif', 'EnMaintenance', 'Remplace', 'HorsService']),
    adresseIP: z.string().trim().optional(),
    localisation: z.string().trim().optional(),
    notesTechniques: z.string().trim().optional(),
  })
  .refine((v) => !v.dateDebutContrat || !v.dateFinContrat || v.dateFinContrat >= v.dateDebutContrat, {
    path: ['dateFinContrat'],
    message: 'Doit être postérieure au début',
  });
type Form = z.infer<typeof schema>;

const today = () => new Date().toISOString().slice(0, 10);
const plusYears = (n: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + n);
  return d.toISOString().slice(0, 10);
};

const EMPTY: Form = {
  clientId: '',
  marque: '',
  modele: '',
  designation: '',
  numeroSerie: '',
  dateDebutContrat: today(),
  dateFinContrat: plusYears(3),
  statutContrat: 'Actif',
  situation: 'Actif',
  adresseIP: '',
  localisation: '',
  notesTechniques: '',
};

function contractInfo(c: Copieur) {
  const debut = new Date(c.dateDebutContrat).getTime();
  const fin = new Date(c.dateFinContrat).getTime();
  const pct = fin > debut ? ((Date.now() - debut) / (fin - debut)) * 100 : 100;
  const j = c.joursAvantExpiration;
  const tone = j < 0 ? 'rose' : j <= 30 ? 'rose' : j <= 60 ? 'amber' : 'emerald';
  const label = j < 0 ? `Expiré depuis ${Math.abs(j)} j` : j === 0 ? "Expire aujourd'hui" : `${j} j restants`;
  return { pct, tone: tone as 'rose' | 'amber' | 'emerald', label };
}

function BrandChip({ marque }: { marque: string }) {
  const tone = MARQUE_TONE[marque] ?? 'slate';
  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${TONE[tone].soft}`}>
      {marque.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function CopieursPage() {
  const queryClient = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canManage = hasRole('Administrateur') || hasRole('ResponsableSAV');

  const [search, setSearch] = useState('');
  const [situation, setSituation] = useState<StatutCopieur | ''>('');
  const [marque, setMarque] = useState('');
  const [echeance, setEcheance] = useState<'' | 'bientot' | 'expire'>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Copieur | null>(null);
  const [selected, setSelected] = useState<Copieur | null>(null);

  const { data: copieurs = [], isLoading, isError, refetch } = useQuery<Copieur[]>({
    queryKey: ['copieurs', 'all'],
    queryFn: () => api.get('/copieurs').then((r) => r.data),
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients', ''],
    queryFn: () => api.get('/clients').then((r) => r.data),
    enabled: modalOpen,
  });

  const { data: historique = [], isLoading: loadingHisto } = useQuery<Intervention[]>({
    queryKey: ['interventions', { copieurId: selected?.id }],
    queryFn: () => api.get('/interventions', { params: { copieurId: selected!.id, taille: 5 } }).then((r) => r.data),
    enabled: !!selected,
  });

  const marquesPresentes = useMemo(() => [...new Set(copieurs.map((c) => c.marque))].sort(), [copieurs]);

  const stats = useMemo(
    () => ({
      total: copieurs.length,
      actifs: copieurs.filter((c) => c.situation === 'Actif').length,
      maintenance: copieurs.filter((c) => c.situation === 'EnMaintenance').length,
      horsService: copieurs.filter((c) => c.situation === 'HorsService').length,
      bientot: copieurs.filter((c) => c.statutContrat === 'Actif' && c.joursAvantExpiration >= 0 && c.joursAvantExpiration <= 30).length,
      expires: copieurs.filter((c) => c.joursAvantExpiration < 0).length,
    }),
    [copieurs],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return copieurs.filter((c) => {
      if (situation && c.situation !== situation) return false;
      if (marque && c.marque !== marque) return false;
      if (echeance === 'bientot' && !(c.joursAvantExpiration >= 0 && c.joursAvantExpiration <= 60)) return false;
      if (echeance === 'expire' && !(c.joursAvantExpiration < 0)) return false;
      if (!q) return true;
      return [c.designation, c.nomClient, c.numeroSerie, c.marque, c.modele, c.adresseIP ?? ''].some((v) => v.toLowerCase().includes(q));
    });
  }, [copieurs, search, situation, marque, echeance]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  const save = useMutation({
    mutationFn: (f: Form) => {
      const dates = {
        dateDebutContrat: `${f.dateDebutContrat}T00:00:00Z`,
        dateFinContrat: `${f.dateFinContrat}T00:00:00Z`,
      };
      const designation = f.designation || `${f.marque} ${f.modele}`;
      const common = {
        marque: f.marque,
        modele: f.modele,
        designation,
        ...dates,
        adresseIP: f.adresseIP || null,
        localisation: f.localisation || null,
        notesTechniques: f.notesTechniques || null,
      };
      return editing
        ? api.put(`/copieurs/${editing.id}`, { ...common, statutContrat: f.statutContrat, situation: f.situation })
        : api.post('/copieurs', { ...common, clientId: f.clientId, numeroSerie: f.numeroSerie });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['copieurs'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(editing ? 'Copieur mis à jour' : 'Copieur ajouté au parc');
      setModalOpen(false);
      setSelected(null);
    },
    onError: (err) => toast.error("Échec de l'enregistrement", errorMessage(err)),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ ...EMPTY, dateDebutContrat: today(), dateFinContrat: plusYears(3) });
    setModalOpen(true);
  };
  const openEdit = (c: Copieur) => {
    setEditing(c);
    reset({
      clientId: c.clientId,
      marque: c.marque,
      modele: c.modele,
      designation: c.designation,
      numeroSerie: c.numeroSerie,
      dateDebutContrat: c.dateDebutContrat.slice(0, 10),
      dateFinContrat: c.dateFinContrat.slice(0, 10),
      statutContrat: c.statutContrat,
      situation: c.situation,
      adresseIP: c.adresseIP ?? '',
      localisation: c.localisation ?? '',
      notesTechniques: c.notesTechniques ?? '',
    });
    setModalOpen(true);
  };

  const err = (k: keyof Form) => errors[k]?.message as string | undefined;

  const chips: { key: string; label: string; value: number; active: boolean; onClick: () => void; tone: string }[] = [
    { key: 'all', label: 'Tous', value: stats.total, active: !situation && !echeance, onClick: () => { setSituation(''); setEcheance(''); }, tone: 'brand' },
    { key: 'Actif', label: 'Actifs', value: stats.actifs, active: situation === 'Actif', onClick: () => { setSituation(situation === 'Actif' ? '' : 'Actif'); setEcheance(''); }, tone: 'emerald' },
    { key: 'EnMaintenance', label: 'En maintenance', value: stats.maintenance, active: situation === 'EnMaintenance', onClick: () => { setSituation(situation === 'EnMaintenance' ? '' : 'EnMaintenance'); setEcheance(''); }, tone: 'amber' },
    { key: 'HorsService', label: 'Hors service', value: stats.horsService, active: situation === 'HorsService', onClick: () => { setSituation(situation === 'HorsService' ? '' : 'HorsService'); setEcheance(''); }, tone: 'rose' },
    { key: 'bientot', label: 'Échéance < 60 j', value: stats.bientot, active: echeance === 'bientot', onClick: () => { setEcheance(echeance === 'bientot' ? '' : 'bientot'); setSituation(''); }, tone: 'amber' },
    { key: 'expire', label: 'Contrats expirés', value: stats.expires, active: echeance === 'expire', onClick: () => { setEcheance(echeance === 'expire' ? '' : 'expire'); setSituation(''); }, tone: 'rose' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parc copieurs"
        subtitle={<><strong className="text-ink-700">{stats.total}</strong> machine{stats.total > 1 ? 's' : ''} sous contrat de maintenance</>}
        actions={
          canManage && (
            <button onClick={openCreate} className="btn-primary">
              <Plus size={16} /> Nouveau copieur
            </button>
          )
        }
      />

      {/* Pastilles de filtre rapide */}
      <div className="flex flex-wrap gap-2 animate-slide-up" style={{ animationDelay: '50ms' }}>
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={c.onClick}
            className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              c.active
                ? 'border-brand-600 bg-brand-600 text-white shadow-glow'
                : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700'
            }`}
          >
            {c.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${c.active ? 'bg-white/20' : 'bg-ink-100'}`}>{c.value}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 animate-slide-up" style={{ animationDelay: '90ms' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Client, marque, modèle, n° de série, adresse IP…" className="min-w-64 flex-1" />
        <SelectBox className="w-48">
          <select className="input appearance-none pr-9" value={marque} onChange={(e) => setMarque(e.target.value)} aria-label="Filtrer par marque">
            <option value="">Toutes les marques</option>
            {marquesPresentes.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </SelectBox>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full !rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Printer size={26} />} title="Aucun copieur trouvé" text="Essayez d'élargir vos filtres ou ajoutez une machine au parc." />
      ) : (
        <div className="card overflow-hidden p-0 animate-slide-up" style={{ animationDelay: '120ms' }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[60rem] text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-5 py-3">Machine</th>
                  <th className="px-3 py-3">Client</th>
                  <th className="px-3 py-3">N° de série</th>
                  <th className="px-3 py-3">Situation</th>
                  <th className="w-56 px-3 py-3">Contrat</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const info = contractInfo(c);
                  return (
                    <tr key={c.id} className="table-row cursor-pointer" onClick={() => setSelected(c)}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <BrandChip marque={c.marque} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink-900">{c.designation}</p>
                            <p className="truncate text-xs text-ink-500">{c.marque} · {c.modele}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-48 truncate px-3 py-3 text-ink-700">{c.nomClient}</td>
                      <td className="px-3 py-3 font-mono text-xs text-ink-600">{c.numeroSerie}</td>
                      <td className="px-3 py-3"><SituationBadge situation={c.situation} /></td>
                      <td className="px-3 py-3">
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className={`flex items-center gap-1 font-semibold ${TONE[info.tone].text}`}>
                            {info.tone === 'rose' && <AlertTriangle size={12} />}
                            {info.label}
                          </span>
                          <span className="text-ink-400">{formatDate(c.dateFinContrat, 'dd/MM/yy')}</span>
                        </div>
                        <ProgressBar value={info.pct} tone={info.tone} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        {canManage && (
                          <button className="btn-icon" aria-label="Modifier" onClick={(e) => { e.stopPropagation(); openEdit(c); }}>
                            <Pencil size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-ink-100 bg-ink-50/50 px-5 py-3 text-xs font-medium text-ink-500">
            {filtered.length} machine{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''} sur {copieurs.length}
          </div>
        </div>
      )}

      {/* ---------------- Détail ---------------- */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.designation}
        subtitle={selected && <span className="font-mono text-xs">{selected.numeroSerie}</span>}
        footer={
          selected &&
          canManage && (
            <button className="btn-primary w-full" onClick={() => { const c = selected; setSelected(null); openEdit(c); }}>
              <Pencil size={16} /> Modifier cette machine
            </button>
          )
        }
      >
        {selected && (() => {
          const info = contractInfo(selected);
          return (
            <div className="space-y-6">
              <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-violet-50 p-5">
                <div className="flex items-center gap-4">
                  <BrandChip marque={selected.marque} />
                  <div>
                    <p className="font-display text-lg font-bold text-ink-900">{selected.marque} {selected.modele}</p>
                    <p className="text-sm text-ink-500">{selected.nomClient}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <SituationBadge situation={selected.situation} />
                  <ContratBadge statut={selected.statutContrat} />
                </div>
              </div>

              <div className="rounded-2xl border border-ink-100 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold text-ink-800"><CalendarClock size={16} className="text-ink-400" /> Contrat de maintenance</span>
                  <span className={`font-semibold ${TONE[info.tone].text}`}>{info.label}</span>
                </div>
                <ProgressBar value={info.pct} tone={info.tone} />
                <div className="mt-2 flex justify-between text-xs text-ink-500">
                  <span>{formatDate(selected.dateDebutContrat)}</span>
                  <span>{formatDate(selected.dateFinContrat)}</span>
                </div>
              </div>

              <div className="divide-y divide-ink-100">
                <DetailRow icon={<Network size={16} />} label="Adresse IP">{selected.adresseIP ? <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">{selected.adresseIP}</code> : '—'}</DetailRow>
                <DetailRow icon={<MapPin size={16} />} label="Emplacement">{selected.localisation || '—'}</DetailRow>
                <DetailRow icon={<StickyNote size={16} />} label="Notes techniques">{selected.notesTechniques || '—'}</DetailRow>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-900">
                  <Wrench size={16} className="text-brand-600" /> Dernières interventions
                </h3>
                {loadingHisto ? (
                  <Skeleton className="h-20 w-full" />
                ) : historique.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-ink-200 py-6 text-center text-sm text-ink-400">Aucune intervention enregistrée.</p>
                ) : (
                  <ol className="relative space-y-4 border-l-2 border-ink-100 pl-5">
                    {historique.map((i) => (
                      <li key={i.id} className="relative">
                        <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500 ring-2 ring-brand-100" />
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-brand-700">{i.numeroIntervention}</span>
                          <NatureBadge nature={i.nature} />
                          <InterventionBadge statut={i.statut} />
                        </div>
                        <p className="mt-1 text-sm text-ink-700">{i.descriptionProbleme}</p>
                        <p className="mt-0.5 text-xs text-ink-400">{formatDate(i.dateIntervention)} · {i.nomTechnicien}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          );
        })()}
      </Drawer>

      {/* ---------------- Formulaire ---------------- */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le copieur' : 'Nouveau copieur'}
        subtitle={editing ? editing.numeroSerie : 'Ajoutez une machine au parc sous contrat.'}
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Annuler</button>
            <button type="submit" form="copieur-form" className="btn-primary" disabled={save.isPending}>
              {save.isPending && <Spinner size={16} />} Enregistrer
            </button>
          </>
        }
      >
        <form id="copieur-form" onSubmit={handleSubmit((f) => save.mutate(f))} className="space-y-6" noValidate>
          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-bold text-ink-900">Identification</legend>
            <Field label="Client" required error={err('clientId')}>
              <SelectBox>
                <select className="input appearance-none pr-9" disabled={!!editing} {...register('clientId')}>
                  <option value="">Sélectionner un client…</option>
                  {(editing && !clients.length ? [{ id: editing.clientId, nomClient: editing.nomClient } as Client] : clients).map((c) => (
                    <option key={c.id} value={c.id}>{c.nomClient}</option>
                  ))}
                </select>
              </SelectBox>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Marque" required error={err('marque')}>
                <input className="input" list="marques" {...register('marque')} />
                <datalist id="marques">{MARQUES.map((m) => <option key={m} value={m} />)}</datalist>
              </Field>
              <Field label="Modèle" required error={err('modele')}><input className="input" {...register('modele')} /></Field>
              <Field label="Désignation" hint="Laissez vide pour « Marque Modèle »"><input className="input" {...register('designation')} /></Field>
              <Field label="N° de série" required error={err('numeroSerie')} hint={editing ? 'Non modifiable' : undefined}>
                <input className="input font-mono" disabled={!!editing} {...register('numeroSerie')} />
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-bold text-ink-900">Contrat</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Début du contrat" required error={err('dateDebutContrat')}><input type="date" className="input" {...register('dateDebutContrat')} /></Field>
              <Field label="Fin du contrat" required error={err('dateFinContrat')}><input type="date" className="input" {...register('dateFinContrat')} /></Field>
              {editing && (
                <>
                  <Field label="Statut du contrat">
                    <SelectBox>
                      <select className="input appearance-none pr-9" {...register('statutContrat')}>
                        {(Object.keys(STATUT_CONTRAT) as StatutContrat[]).map((k) => (
                          <option key={k} value={k}>{STATUT_CONTRAT[k].label.replace('Contrat ', '')}</option>
                        ))}
                      </select>
                    </SelectBox>
                  </Field>
                  <Field label="Situation de la machine">
                    <SelectBox>
                      <select className="input appearance-none pr-9" {...register('situation')}>
                        {(Object.keys(SITUATION_COPIEUR) as StatutCopieur[]).map((k) => (
                          <option key={k} value={k}>{SITUATION_COPIEUR[k].label}</option>
                        ))}
                      </select>
                    </SelectBox>
                  </Field>
                </>
              )}
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-900"><Cpu size={15} /> Informations techniques</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Adresse IP"><input className="input font-mono" placeholder="192.168.1.20" {...register('adresseIP')} /></Field>
              <Field label="Emplacement"><input className="input" placeholder="Open space, 2e étage…" {...register('localisation')} /></Field>
            </div>
            <Field label="Notes techniques"><textarea rows={3} className="input resize-none" {...register('notesTechniques')} /></Field>
          </fieldset>
        </form>
      </Modal>
    </div>
  );
}
