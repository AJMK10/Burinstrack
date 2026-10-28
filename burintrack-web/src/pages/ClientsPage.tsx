import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Briefcase,
  Building2,
  ChevronRight,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Printer,
  User,
} from 'lucide-react';
import api from '../lib/api';
import type { Client, Copieur } from '../types';
import { useAuthStore } from '../store/authStore';
import { errorMessage, formatDate, MARQUE_TONE, TONE } from '../lib/format';
import {
  Avatar,
  Badge,
  DetailRow,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  Modal,
  PageHeader,
  SearchInput,
  Segmented,
  SelectBox,
  SituationBadge,
  Skeleton,
  Spinner,
} from '../components/ui';
import { toast } from '../store/toastStore';

const coord = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v.replace(',', '.'))), 'Nombre invalide');

const clientSchema = z.object({
  nomClient: z.string().trim().min(1, 'Requis'),
  raisonSociale: z.string().trim().optional(),
  numeroContrat: z.string().trim().min(1, 'Requis'),
  secteurActivite: z.string().trim().optional(),
  adresse: z.string().trim().min(1, 'Requis'),
  ville: z.string().trim().min(1, 'Requis'),
  commune: z.string().trim().optional(),
  pays: z.string().trim().min(1, 'Requis'),
  latitude: coord,
  longitude: coord,
  nomContact: z.string().trim().min(1, 'Requis'),
  fonctionContact: z.string().trim().optional(),
  telephone: z.string().trim().min(1, 'Requis'),
  email: z.string().trim().min(1, 'Requis').email('E-mail invalide'),
  estActif: z.boolean(),
});
type ClientForm = z.infer<typeof clientSchema>;

const EMPTY: ClientForm = {
  nomClient: '',
  raisonSociale: '',
  numeroContrat: '',
  secteurActivite: '',
  adresse: '',
  ville: '',
  commune: '',
  pays: "Côte d'Ivoire",
  latitude: '',
  longitude: '',
  nomContact: '',
  fonctionContact: '',
  telephone: '',
  email: '',
  estActif: true,
};

const toNum = (v?: string) => (v && v.trim() !== '' ? Number(v.replace(',', '.')) : null);

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canManage = hasRole('Administrateur') || hasRole('ResponsableSAV');

  const [search, setSearch] = useState('');
  const [ville, setVille] = useState('');
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);

  const {
    data: clients = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Client[]>({
    queryKey: ['clients', search],
    queryFn: () => api.get('/clients', { params: { search: search || undefined } }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const villes = useMemo(() => [...new Set(clients.map((c) => c.ville))].sort(), [clients]);
  const filtered = useMemo(() => clients.filter((c) => !ville || c.ville === ville), [clients, ville]);
  const totalCopieurs = filtered.reduce((s, c) => s + c.nombreCopieurs, 0);

  const { data: copieursClient = [], isLoading: loadingCopieurs } = useQuery<Copieur[]>({
    queryKey: ['copieurs', { clientId: selected?.id }],
    queryFn: () => api.get('/copieurs', { params: { clientId: selected!.id } }).then((r) => r.data),
    enabled: !!selected,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientForm>({ resolver: zodResolver(clientSchema), defaultValues: EMPTY });

  const save = useMutation({
    mutationFn: (f: ClientForm) => {
      const base = {
        nomClient: f.nomClient,
        raisonSociale: f.raisonSociale || f.nomClient,
        secteurActivite: f.secteurActivite ?? '',
        adresse: f.adresse,
        ville: f.ville,
        commune: f.commune ?? '',
        pays: f.pays,
        latitude: toNum(f.latitude),
        longitude: toNum(f.longitude),
        nomContact: f.nomContact,
        fonctionContact: f.fonctionContact ?? '',
        telephone: f.telephone,
        email: f.email,
      };
      return editing
        ? api.put(`/clients/${editing.id}`, { ...base, estActif: f.estActif })
        : api.post('/clients', { ...base, numeroContrat: f.numeroContrat });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(editing ? 'Client mis à jour' : 'Client créé', 'Les modifications ont été enregistrées.');
      setModalOpen(false);
      setSelected(null);
    },
    onError: (err) => toast.error("Échec de l'enregistrement", errorMessage(err)),
  });

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY);
    setModalOpen(true);
  };
  const openEdit = (c: Client) => {
    setEditing(c);
    reset({
      nomClient: c.nomClient,
      raisonSociale: c.raisonSociale,
      numeroContrat: c.numeroContrat,
      secteurActivite: c.secteurActivite,
      adresse: c.adresse,
      ville: c.ville,
      commune: c.commune,
      pays: c.pays,
      latitude: c.latitude?.toString() ?? '',
      longitude: c.longitude?.toString() ?? '',
      nomContact: c.nomContact,
      fonctionContact: c.fonctionContact,
      telephone: c.telephone,
      email: c.email,
      estActif: c.estActif,
    });
    setModalOpen(true);
  };

  const err = (k: keyof ClientForm) => errors[k]?.message as string | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        subtitle={
          <>
            <strong className="text-ink-700">{filtered.length}</strong> client{filtered.length > 1 ? 's' : ''} ·{' '}
            <strong className="text-ink-700">{totalCopieurs}</strong> copieur{totalCopieurs > 1 ? 's' : ''} sous contrat
          </>
        }
        actions={
          canManage && (
            <button onClick={openCreate} className="btn-primary">
              <Plus size={16} /> Nouveau client
            </button>
          )
        }
      />

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-3 animate-slide-up" style={{ animationDelay: '60ms' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un client, un contrat, un e-mail…" className="min-w-64 flex-1" />
        <SelectBox className="w-48">
          <select className="input appearance-none pr-9" value={ville} onChange={(e) => setVille(e.target.value)} aria-label="Filtrer par ville">
            <option value="">Toutes les villes</option>
            {villes.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </SelectBox>
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'cards', label: <LayoutGrid size={14} />, title: 'Cartes' },
            { value: 'table', label: <List size={14} />, title: 'Tableau' },
          ]}
        />
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-52 !rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 size={26} />}
          title="Aucun client trouvé"
          text="Modifiez votre recherche ou ajoutez un nouveau client."
          action={canManage && <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Nouveau client</button>}
        />
      ) : view === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="card card-hover group text-left animate-slide-up"
              style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
            >
              <div className="flex items-start gap-3.5">
                <Avatar name={c.nomClient} size={48} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-ink-900">{c.nomClient}</h3>
                  <p className="truncate text-xs text-ink-500">{c.secteurActivite || 'Secteur non renseigné'}</p>
                </div>
                {!c.estActif && <Badge tone="slate">Inactif</Badge>}
              </div>

              <div className="mt-4 space-y-1.5 text-sm text-ink-600">
                <p className="flex items-center gap-2"><MapPin size={14} className="shrink-0 text-ink-400" /> <span className="truncate">{c.commune ? `${c.commune}, ` : ''}{c.ville}</span></p>
                <p className="flex items-center gap-2"><User size={14} className="shrink-0 text-ink-400" /> <span className="truncate">{c.nomContact}</span></p>
                <p className="flex items-center gap-2"><Phone size={14} className="shrink-0 text-ink-400" /> <span className="truncate">{c.telephone}</span></p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
                <span className="rounded-lg bg-ink-100 px-2 py-1 font-mono text-[11px] font-semibold text-ink-600">{c.numeroContrat}</span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                  <Printer size={15} /> {c.nombreCopieurs}
                  <ChevronRight size={16} className="text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden p-0 animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-3 py-3">Contrat</th>
                  <th className="px-3 py-3">Localisation</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3 text-center">Copieurs</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="table-row cursor-pointer" onClick={() => setSelected(c)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.nomClient} size={38} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink-900">{c.nomClient}</p>
                          <p className="truncate text-xs text-ink-500">{c.secteurActivite}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3"><span className="rounded-lg bg-ink-100 px-2 py-1 font-mono text-[11px] font-semibold text-ink-600">{c.numeroContrat}</span></td>
                    <td className="px-3 py-3 text-ink-600">{c.commune ? `${c.commune}, ` : ''}{c.ville}</td>
                    <td className="px-3 py-3">
                      <p className="text-ink-800">{c.nomContact}</p>
                      <p className="text-xs text-ink-500">{c.telephone}</p>
                    </td>
                    <td className="px-3 py-3 text-center"><Badge tone="brand">{c.nombreCopieurs}</Badge></td>
                    <td className="px-5 py-3 text-right">
                      {canManage && (
                        <button className="btn-icon" aria-label="Modifier" onClick={(e) => { e.stopPropagation(); openEdit(c); }}>
                          <Pencil size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- Tiroir de détail ---------------- */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.nomClient}
        subtitle={selected && <span className="font-mono text-xs">{selected.numeroContrat}</span>}
        footer={
          selected &&
          canManage && (
            <button className="btn-primary w-full" onClick={() => { const c = selected; setSelected(null); openEdit(c); }}>
              <Pencil size={16} /> Modifier ce client
            </button>
          )
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-brand-50 to-violet-50 p-4">
              <Avatar name={selected.nomClient} size={56} />
              <div>
                <p className="font-display text-lg font-bold text-ink-900">{selected.raisonSociale || selected.nomClient}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge tone={selected.estActif ? 'emerald' : 'slate'} dot>{selected.estActif ? 'Client actif' : 'Inactif'}</Badge>
                  {selected.secteurActivite && <Badge tone="brand">{selected.secteurActivite}</Badge>}
                </div>
              </div>
            </div>

            <div className="divide-y divide-ink-100">
              <DetailRow icon={<MapPin size={16} />} label="Adresse">
                {selected.adresse}<br />
                {selected.commune && `${selected.commune} · `}{selected.ville}, {selected.pays}
                {selected.latitude != null && selected.longitude != null && (
                  <span className="mt-1 block text-xs text-ink-400">GPS {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}</span>
                )}
              </DetailRow>
              <DetailRow icon={<User size={16} />} label="Contact principal">
                {selected.nomContact}
                {selected.fonctionContact && <span className="text-ink-500"> · {selected.fonctionContact}</span>}
              </DetailRow>
              <DetailRow icon={<Phone size={16} />} label="Téléphone">
                <a className="text-brand-700 hover:underline" href={`tel:${selected.telephone.replace(/\s/g, '')}`}>{selected.telephone}</a>
              </DetailRow>
              <DetailRow icon={<Mail size={16} />} label="E-mail">
                <a className="text-brand-700 hover:underline" href={`mailto:${selected.email}`}>{selected.email}</a>
              </DetailRow>
              <DetailRow icon={<Briefcase size={16} />} label="Client depuis">{formatDate(selected.createdAt)}</DetailRow>
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-900">
                <Printer size={16} className="text-brand-600" /> Parc de copieurs
                <Badge tone="brand">{selected.nombreCopieurs}</Badge>
              </h3>
              {loadingCopieurs ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : copieursClient.length === 0 ? (
                <p className="rounded-xl border border-dashed border-ink-200 py-6 text-center text-sm text-ink-400">Aucun copieur rattaché.</p>
              ) : (
                <ul className="space-y-2">
                  {copieursClient.map((co) => (
                    <li key={co.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${TONE[MARQUE_TONE[co.marque] ?? 'slate'].soft}`}>
                        {co.marque.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900">{co.designation}</p>
                        <p className="font-mono text-xs text-ink-400">{co.numeroSerie}</p>
                      </div>
                      <SituationBadge situation={co.situation} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* ---------------- Formulaire ---------------- */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le client' : 'Nouveau client'}
        subtitle={editing ? editing.numeroContrat : 'Renseignez les informations du client et de son contrat.'}
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Annuler</button>
            <button type="submit" form="client-form" className="btn-primary" disabled={save.isPending}>
              {save.isPending && <Spinner size={16} />} Enregistrer
            </button>
          </>
        }
      >
        <form id="client-form" onSubmit={handleSubmit((f) => save.mutate(f))} className="space-y-6" noValidate>
          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-bold text-ink-900">Identité</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom du client" required error={err('nomClient')}><input className="input" {...register('nomClient')} /></Field>
              <Field label="Raison sociale" error={err('raisonSociale')}><input className="input" {...register('raisonSociale')} /></Field>
              <Field label="N° de contrat" required error={err('numeroContrat')} hint={editing ? 'Non modifiable' : undefined}>
                <input className="input font-mono" disabled={!!editing} placeholder="CTR-2026-001" {...register('numeroContrat')} />
              </Field>
              <Field label="Secteur d'activité"><input className="input" {...register('secteurActivite')} /></Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-bold text-ink-900">Localisation</legend>
            <Field label="Adresse" required error={err('adresse')}><input className="input" {...register('adresse')} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Ville" required error={err('ville')}><input className="input" {...register('ville')} /></Field>
              <Field label="Commune"><input className="input" {...register('commune')} /></Field>
              <Field label="Pays" required error={err('pays')}><input className="input" {...register('pays')} /></Field>
              <Field label="Latitude" error={err('latitude')}><input className="input" inputMode="decimal" placeholder="5.3200" {...register('latitude')} /></Field>
              <Field label="Longitude" error={err('longitude')}><input className="input" inputMode="decimal" placeholder="-4.0200" {...register('longitude')} /></Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-bold text-ink-900">Contact principal</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom du contact" required error={err('nomContact')}><input className="input" {...register('nomContact')} /></Field>
              <Field label="Fonction"><input className="input" {...register('fonctionContact')} /></Field>
              <Field label="Téléphone" required error={err('telephone')}><input className="input" {...register('telephone')} /></Field>
              <Field label="E-mail" required error={err('email')}><input type="email" className="input" {...register('email')} /></Field>
            </div>
          </fieldset>

          {editing && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink-200 p-4">
              <input type="checkbox" className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" {...register('estActif')} />
              <span>
                <span className="block text-sm font-semibold text-ink-900">Client actif</span>
                <span className="block text-xs text-ink-500">Décochez pour archiver le client sans supprimer son historique.</span>
              </span>
            </label>
          )}
        </form>
      </Modal>
    </div>
  );
}
