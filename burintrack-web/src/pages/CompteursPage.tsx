import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BookOpen, Calculator, ChevronDown, ChevronUp, Pencil, Plus, Printer, Trash2,
} from 'lucide-react';
import api from '../lib/api';
import type { Client, Copieur, FactureMensuelle, ReleveCompteur } from '../types';
import { errorMessage, formatNumber } from '../lib/format';
import { printFacture } from '../lib/printFacture';
import {
  Badge, EmptyState, ErrorState, Field, Modal, PageHeader, Spinner,
} from '../components/ui';
import { toast } from '../store/toastStore';

const MOIS_LABELS = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const releveSchema = z.object({
  copieurId:   z.string().min(1, 'Sélectionner un copieur'),
  annee:       z.number().min(2020).max(2100),
  mois:        z.number().min(1).max(12),
  a3MonoDebut: z.number().min(0),
  a4MonoDebut: z.number().min(0),
  a3CoulDebut: z.number().min(0),
  a4CoulDebut: z.number().min(0),
  a3MonoFin:   z.number().min(0),
  a4MonoFin:   z.number().min(0),
  a3CoulFin:   z.number().min(0),
  a4CoulFin:   z.number().min(0),
});
type ReleveForm = z.infer<typeof releveSchema>;

function calcMono(f: Partial<ReleveForm>) {
  return Math.max(0, ((f.a3MonoFin ?? 0) - (f.a3MonoDebut ?? 0)) * 2 + (f.a4MonoFin ?? 0) - (f.a4MonoDebut ?? 0));
}
function calcCoul(f: Partial<ReleveForm>) {
  return Math.max(0, ((f.a3CoulFin ?? 0) - (f.a3CoulDebut ?? 0)) * 2 + (f.a4CoulFin ?? 0) - (f.a4CoulDebut ?? 0));
}

export default function CompteursPage() {
  const queryClient = useQueryClient();
  const now = new Date();
  const [clientId, setClientId] = useState('');
  const [annee, setAnnee]       = useState(now.getFullYear());
  const [mois, setMois]         = useState(now.getMonth() + 1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ReleveCompteur | null>(null);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
  });

  const { data: copieurs = [] } = useQuery<Copieur[]>({
    queryKey: ['copieurs', clientId],
    queryFn: () => api.get('/copieurs', { params: { clientId } }).then(r => r.data),
    enabled: !!clientId,
  });

  const { data: releves = [], isLoading, isError, refetch } = useQuery<ReleveCompteur[]>({
    queryKey: ['releves', clientId, annee, mois],
    queryFn: () => api.get('/compteurs', { params: { clientId, annee, mois } }).then(r => r.data),
    enabled: !!clientId,
  });

  const { data: facture, isLoading: loadingFacture } = useQuery<FactureMensuelle>({
    queryKey: ['facture', clientId, annee, mois],
    queryFn: () => api.get(`/compteurs/facture/${clientId}/${annee}/${mois}`).then(r => r.data),
    enabled: !!clientId && releves.length > 0,
  });

  const { data: vitrine } = useQuery<{ logoBase64: string; nomSociete: string }>({
    queryKey: ['vitrine'],
    queryFn: () => api.get('/parametres/vitrine').then(r => r.data),
    staleTime: 1000 * 60 * 10,
    retry: false,
  });

  const form = useForm<ReleveForm>({
    resolver: zodResolver(releveSchema),
    defaultValues: { copieurId: '', annee, mois, a3MonoDebut: 0, a4MonoDebut: 0, a3CoulDebut: 0, a4CoulDebut: 0, a3MonoFin: 0, a4MonoFin: 0, a3CoulFin: 0, a4CoulFin: 0 },
  });
  const watchedValues = form.watch();
  const previewMono = calcMono(watchedValues);
  const previewCoul = calcCoul(watchedValues);

  const openCreate = () => {
    setEditTarget(null);
    form.reset({ copieurId: '', annee, mois, a3MonoDebut: 0, a4MonoDebut: 0, a3CoulDebut: 0, a4CoulDebut: 0, a3MonoFin: 0, a4MonoFin: 0, a3CoulFin: 0, a4CoulFin: 0 });
    setModalOpen(true);
  };
  const openEdit = (r: ReleveCompteur) => {
    setEditTarget(r);
    form.reset({
      copieurId: r.copieurId, annee: r.annee, mois: r.mois,
      a3MonoDebut: r.a3MonoDebut, a4MonoDebut: r.a4MonoDebut,
      a3CoulDebut: r.a3CoulDebut, a4CoulDebut: r.a4CoulDebut,
      a3MonoFin:   r.a3MonoFin,   a4MonoFin:   r.a4MonoFin,
      a3CoulFin:   r.a3CoulFin,   a4CoulFin:   r.a4CoulFin,
    });
    setModalOpen(true);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['releves', clientId, annee, mois] });
    queryClient.invalidateQueries({ queryKey: ['facture', clientId, annee, mois] });
  };

  const createMut = useMutation({
    mutationFn: (f: ReleveForm) => api.post('/compteurs', f),
    onSuccess: () => { toast.success('Relevé enregistré'); setModalOpen(false); invalidate(); },
    onError: (e) => toast.error('Erreur', errorMessage(e)),
  });
  const updateMut = useMutation({
    mutationFn: (f: ReleveForm) => api.put(`/compteurs/${editTarget!.id}`, f),
    onSuccess: () => { toast.success('Relevé mis à jour'); setModalOpen(false); invalidate(); },
    onError: (e) => toast.error('Erreur', errorMessage(e)),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/compteurs/${id}`),
    onSuccess: () => { toast.success('Relevé supprimé'); invalidate(); },
    onError: (e) => toast.error('Erreur', errorMessage(e)),
  });

  const onSubmit = (f: ReleveForm) => editTarget ? updateMut.mutate(f) : createMut.mutate(f);
  const isPending = createMut.isPending || updateMut.isPending;
  const err = (k: keyof ReleveForm) => form.formState.errors[k]?.message;

  const numInput = (name: keyof ReleveForm) => (
    <input
      type="number"
      min={0}
      className="form-control form-control-sm"
      {...form.register(name, { valueAsNumber: true })}
    />
  );

  const selectedClient = clients.find(c => c.id === clientId);
  const [showCalc, setShowCalc] = useState(false);

  return (
    <div>
      <PageHeader
        title="Compteurs & Facturation"
        subtitle="Relevés mensuels des compteurs — calcul automatique selon le contrat"
        actions={
          clientId ? (
            <button onClick={openCreate} className="btn btn-primary d-flex align-items-center gap-2">
              <Plus size={15} /> Nouveau relevé
            </button>
          ) : undefined
        }
      />

      {/* ── Sélecteurs ── */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body d-flex flex-wrap gap-3 align-items-end">
          <div style={{ minWidth: 220 }}>
            <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6c757d' }}>
              CLIENT
            </label>
            <div className="position-relative">
              <select
                className="form-select"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
              >
                <option value="">Sélectionner un client…</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nomClient}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6c757d' }}>
              MOIS
            </label>
            <select className="form-select" value={mois} onChange={e => setMois(+e.target.value)} style={{ minWidth: 140 }}>
              {MOIS_LABELS.slice(1).map((l, i) => (
                <option key={i + 1} value={i + 1}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6c757d' }}>
              ANNÉE
            </label>
            <select className="form-select" value={annee} onChange={e => setAnnee(+e.target.value)} style={{ minWidth: 100 }}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!clientId && (
        <EmptyState
          icon={<BookOpen size={24} />}
          title="Sélectionnez un client"
          text="Choisissez un client et une période pour consulter ou saisir les relevés de compteurs."
        />
      )}

      {clientId && (
        <>
          {/* ── Tableau des relevés ── */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span className="fw-semibold" style={{ fontSize: '0.875rem' }}>
                Relevés — {MOIS_LABELS[mois]} {annee}
              </span>
              <Badge tone="brand">{releves.length} copieur{releves.length !== 1 ? 's' : ''}</Badge>
            </div>

            {isError ? (
              <div className="card-body"><ErrorState onRetry={() => refetch()} /></div>
            ) : isLoading ? (
              <div className="card-body text-center py-4"><Spinner size={24} /></div>
            ) : releves.length === 0 ? (
              <div className="card-body">
                <EmptyState
                  icon={<Printer size={20} />}
                  title="Aucun relevé pour cette période"
                  text="Cliquez sur « Nouveau relevé » pour saisir les compteurs."
                />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0" style={{ fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>Copieur</th>
                      <th>N° Série</th>
                      <th className="text-end" style={{ color: '#6c757d' }}>A3 Mono</th>
                      <th className="text-end" style={{ color: '#6c757d' }}>A4 Mono</th>
                      <th className="text-end" style={{ color: '#6c757d' }}>A3 Coul</th>
                      <th className="text-end" style={{ color: '#6c757d' }}>A4 Coul</th>
                      <th className="text-end fw-bold" style={{ color: '#343a40' }}>Mono A4éq</th>
                      <th className="text-end fw-bold" style={{ color: '#CC1416' }}>Coul A4éq</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {releves.map(r => (
                      <tr key={r.id}>
                        <td className="fw-medium">{r.nomCopieur}</td>
                        <td className="text-muted">{r.numeroSerie}</td>
                        <td className="text-end text-muted">
                          <span style={{ fontSize: '0.75rem' }}>{formatNumber(r.a3MonoDebut)} → {formatNumber(r.a3MonoFin)}</span>
                          <br /><strong>{formatNumber(r.a3MonoFin - r.a3MonoDebut)}</strong>
                        </td>
                        <td className="text-end text-muted">
                          <span style={{ fontSize: '0.75rem' }}>{formatNumber(r.a4MonoDebut)} → {formatNumber(r.a4MonoFin)}</span>
                          <br /><strong>{formatNumber(r.a4MonoFin - r.a4MonoDebut)}</strong>
                        </td>
                        <td className="text-end text-muted">
                          <span style={{ fontSize: '0.75rem' }}>{formatNumber(r.a3CoulDebut)} → {formatNumber(r.a3CoulFin)}</span>
                          <br /><strong>{formatNumber(r.a3CoulFin - r.a3CoulDebut)}</strong>
                        </td>
                        <td className="text-end text-muted">
                          <span style={{ fontSize: '0.75rem' }}>{formatNumber(r.a4CoulDebut)} → {formatNumber(r.a4CoulFin)}</span>
                          <br /><strong>{formatNumber(r.a4CoulFin - r.a4CoulDebut)}</strong>
                        </td>
                        <td className="text-end fw-bold" style={{ color: '#343a40' }}>{formatNumber(r.copiesMonoA4Eq)}</td>
                        <td className="text-end fw-bold" style={{ color: '#CC1416' }}>{formatNumber(r.copiesCoulA4Eq)}</td>
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            <button className="btn-icon" title="Modifier" onClick={() => openEdit(r)}><Pencil size={13} /></button>
                            <button className="btn-icon" title="Supprimer" style={{ color: '#ef4444' }} onClick={() => deleteMut.mutate(r.id)}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Récapitulatif facturation ── */}
          {releves.length > 0 && selectedClient?.typeFacturation === 'Forfait' && (
            <div className="card border-0 shadow-sm animate-slide-up">
              <div className="card-header d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <Calculator size={15} className="text-brand" />
                  <span className="fw-semibold" style={{ fontSize: '0.875rem' }}>
                    Facture estimée — {MOIS_LABELS[mois]} {annee}
                    {selectedClient && <span className="text-muted ms-2" style={{ fontWeight: 400 }}>· {selectedClient.nomClient}</span>}
                  </span>
                </div>
                {facture && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    onClick={() => printFacture(selectedClient!, releves, facture, copieurs, mois, annee, vitrine?.logoBase64, vitrine?.nomSociete)}
                    title="Imprimer la facture"
                  >
                    <Printer size={13} /> Imprimer
                  </button>
                )}
              </div>
              <div className="card-body">
                {loadingFacture ? (
                  <div className="text-center py-3"><Spinner size={20} /></div>
                ) : facture ? (
                  <div className="row g-4">
                    {/* Volumes */}
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.83rem' }}>
                          <span className="text-muted">Copies <strong>Monochrome</strong> effectuées</span>
                          <strong>{formatNumber(facture.totalMonoA4Eq)}</strong>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.78rem', color: '#6c757d' }}>
                          <span>Forfait inclus</span>
                          <span>{formatNumber(facture.forfaitCopieMono)}</span>
                        </div>
                        {facture.copiesSupMono > 0 && (
                          <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '0.78rem', color: '#f59e0b' }}>
                            <span>Copies supplémentaires</span>
                            <strong>+{formatNumber(facture.copiesSupMono)}</strong>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.83rem' }}>
                          <span className="text-muted">Copies <strong style={{ color: '#CC1416' }}>Couleur</strong> effectuées</span>
                          <strong style={{ color: '#CC1416' }}>{formatNumber(facture.totalCoulA4Eq)}</strong>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.78rem', color: '#6c757d' }}>
                          <span>Forfait inclus</span>
                          <span>{formatNumber(facture.forfaitCopieCouleur)}</span>
                        </div>
                        {facture.copiesSupCouleur > 0 && (
                          <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '0.78rem', color: '#f59e0b' }}>
                            <span>Copies supplémentaires</span>
                            <strong>+{formatNumber(facture.copiesSupCouleur)}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Montants */}
                    <div className="col-lg-6">
                      <div style={{ background: '#fafafa', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #e9ecef' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '0.83rem' }}>
                          <span className="text-muted">Forfait mensuel HT</span>
                          <span>{formatNumber(facture.forfaitMensuelHT)} FCFA</span>
                        </div>
                        {facture.coutCopiesSupHT > 0 && (
                          <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '0.83rem' }}>
                            <span className="text-muted">Copies supplémentaires HT</span>
                            <span style={{ color: '#f59e0b' }}>+{formatNumber(facture.coutCopiesSupHT)} FCFA</span>
                          </div>
                        )}
                        <hr className="my-2" />
                        <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                          <span>TOTAL HT</span>
                          <span>{formatNumber(facture.totalHT)} FCFA</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '0.83rem', color: '#6c757d' }}>
                          <span>TVA {facture.tauxTVA}%</span>
                          <span>{formatNumber(facture.montantTVA)} FCFA</span>
                        </div>
                        <div
                          className="d-flex justify-content-between align-items-center mt-2 pt-2"
                          style={{ borderTop: '2px solid #CC1416', fontSize: '1.05rem', fontWeight: 800, color: '#CC1416' }}
                        >
                          <span>TOTAL TTC</span>
                          <span>{formatNumber(facture.totalTTC)} FCFA</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* ── Méthode de calcul ── */}
          {facture && selectedClient?.typeFacturation === 'Forfait' && (
            <div className="card border-0 shadow-sm mt-3 animate-slide-up">
              <button
                className="card-header d-flex align-items-center justify-content-between w-100 text-start border-0 bg-transparent"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowCalc(v => !v)}
                type="button"
              >
                <div className="d-flex align-items-center gap-2">
                  <Calculator size={15} className="text-muted" />
                  <span className="fw-semibold" style={{ fontSize: '0.875rem' }}>Méthode de calcul</span>
                </div>
                {showCalc ? <ChevronUp size={15} className="text-muted" /> : <ChevronDown size={15} className="text-muted" />}
              </button>
              {showCalc && (
                <div className="card-body" style={{ fontSize: '0.82rem' }}>
                  {/* Étape 1 */}
                  <div className="mb-4">
                    <div className="fw-bold mb-2" style={{ color: '#495057', fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                      ÉTAPE 1 — CONVERSION EN ÉQUIVALENT A4
                    </div>
                    <div className="row g-2">
                      <div className="col-sm-6">
                        <div className="p-3 rounded-2" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                          <div className="text-muted mb-1">Monochrome</div>
                          <code style={{ fontSize: '0.8rem' }}>
                            (A3 mono × 2) + A4 mono
                          </code>
                          <div className="mt-2 fw-bold">
                            ({formatNumber(releves.reduce((s,r) => s + (r.a3MonoFin - r.a3MonoDebut), 0))} × 2) + {formatNumber(releves.reduce((s,r) => s + (r.a4MonoFin - r.a4MonoDebut), 0))} = <span style={{ color: '#343a40' }}>{formatNumber(facture.totalMonoA4Eq)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="p-3 rounded-2" style={{ background: '#fff8f8', border: '1px solid #fde8e8' }}>
                          <div style={{ color: '#CC1416' }} className="mb-1">Couleur</div>
                          <code style={{ fontSize: '0.8rem' }}>
                            (A3 coul × 2) + A4 coul
                          </code>
                          <div className="mt-2 fw-bold">
                            ({formatNumber(releves.reduce((s,r) => s + (r.a3CoulFin - r.a3CoulDebut), 0))} × 2) + {formatNumber(releves.reduce((s,r) => s + (r.a4CoulFin - r.a4CoulDebut), 0))} = <span style={{ color: '#CC1416' }}>{formatNumber(facture.totalCoulA4Eq)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>1 copie A3 = 2 copies A4 (format double surface)</div>
                  </div>

                  {/* Étape 2 */}
                  <div className="mb-4">
                    <div className="fw-bold mb-2" style={{ color: '#495057', fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                      ÉTAPE 2 — COPIES SUPPLÉMENTAIRES
                    </div>
                    <div className="row g-2">
                      <div className="col-sm-6">
                        <div className="p-3 rounded-2" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                          <code style={{ fontSize: '0.8rem' }}>max(0, Total − Forfait inclus)</code>
                          <div className="mt-2">
                            Mono : max(0, {formatNumber(facture.totalMonoA4Eq)} − {formatNumber(facture.forfaitCopieMono)}) = <strong style={{ color: facture.copiesSupMono > 0 ? '#f59e0b' : '#198754' }}>{formatNumber(facture.copiesSupMono)}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="p-3 rounded-2" style={{ background: '#fff8f8', border: '1px solid #fde8e8' }}>
                          <code style={{ fontSize: '0.8rem' }}>max(0, Total − Forfait inclus)</code>
                          <div className="mt-2">
                            Couleur : max(0, {formatNumber(facture.totalCoulA4Eq)} − {formatNumber(facture.forfaitCopieCouleur)}) = <strong style={{ color: facture.copiesSupCouleur > 0 ? '#f59e0b' : '#198754' }}>{formatNumber(facture.copiesSupCouleur)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Étape 3 */}
                  <div>
                    <div className="fw-bold mb-2" style={{ color: '#495057', fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                      ÉTAPE 3 — CALCUL DU MONTANT
                    </div>
                    <div className="p-3 rounded-2" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Forfait mensuel HT</span>
                        <strong>{formatNumber(facture.forfaitMensuelHT)} FCFA</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2" style={{ color: '#6c757d', fontSize: '0.78rem' }}>
                        <span>
                          Copies sup Mono ({formatNumber(facture.copiesSupMono)} × {formatNumber(selectedClient.prixCopieSupMono)} FCFA)
                        </span>
                        <span>{formatNumber(facture.copiesSupMono * selectedClient.prixCopieSupMono)} FCFA</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2" style={{ color: '#6c757d', fontSize: '0.78rem' }}>
                        <span>
                          Copies sup Couleur ({formatNumber(facture.copiesSupCouleur)} × {formatNumber(selectedClient.prixCopieSupCouleur)} FCFA)
                        </span>
                        <span>{formatNumber(facture.copiesSupCouleur * selectedClient.prixCopieSupCouleur)} FCFA</span>
                      </div>
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between fw-semibold mb-1">
                        <span>Total HT</span>
                        <span>{formatNumber(facture.totalHT)} FCFA</span>
                      </div>
                      <div className="d-flex justify-content-between" style={{ color: '#6c757d', fontSize: '0.78rem' }}>
                        <span>TVA {facture.tauxTVA}% × {formatNumber(facture.totalHT)}</span>
                        <span>{formatNumber(facture.montantTVA)} FCFA</span>
                      </div>
                      <div className="d-flex justify-content-between fw-bold mt-2 pt-2" style={{ borderTop: '2px solid #CC1416', color: '#CC1416', fontSize: '0.95rem' }}>
                        <span>Total TTC</span>
                        <span>{formatNumber(facture.totalTTC)} FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Modal saisie relevé ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Modifier le relevé' : 'Nouveau relevé'}
        subtitle="Saisissez les compteurs de début et de fin de période"
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Annuler</button>
            <button type="submit" form="releve-form" className="btn btn-primary d-flex align-items-center gap-2" disabled={isPending}>
              {isPending && <Spinner size={14} />} Enregistrer
            </button>
          </>
        }
      >
        <form id="releve-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="row g-3">
            {!editTarget && (
              <>
                <div className="col-sm-6">
                  <Field label="Copieur" required error={err('copieurId')}>
                    <select className="form-select" {...form.register('copieurId')}>
                      <option value="">Sélectionner…</option>
                      {copieurs.map(c => (
                        <option key={c.id} value={c.id}>{c.designation} — {c.numeroSerie}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="col-sm-3">
                  <Field label="Mois" required>
                    <select className="form-select" {...form.register('mois', { valueAsNumber: true })}>
                      {MOIS_LABELS.slice(1).map((l, i) => <option key={i + 1} value={i + 1}>{l}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="col-sm-3">
                  <Field label="Année" required>
                    <select className="form-select" {...form.register('annee', { valueAsNumber: true })}>
                      {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </Field>
                </div>
              </>
            )}

            {/* A3 Mono */}
            <div className="col-12">
              <div className="p-2 rounded-2 mb-1" style={{ background: '#f8f9fa', fontSize: '0.78rem', fontWeight: 700, color: '#6c757d', letterSpacing: '0.04em' }}>
                COMPTEURS A3 MONOCHROME
              </div>
              <div className="row g-2">
                <div className="col-sm-6"><Field label="Début">{numInput('a3MonoDebut')}</Field></div>
                <div className="col-sm-6"><Field label="Fin">{numInput('a3MonoFin')}</Field></div>
              </div>
            </div>

            {/* A4 Mono */}
            <div className="col-12">
              <div className="p-2 rounded-2 mb-1" style={{ background: '#f8f9fa', fontSize: '0.78rem', fontWeight: 700, color: '#6c757d', letterSpacing: '0.04em' }}>
                COMPTEURS A4 MONOCHROME
              </div>
              <div className="row g-2">
                <div className="col-sm-6"><Field label="Début">{numInput('a4MonoDebut')}</Field></div>
                <div className="col-sm-6"><Field label="Fin">{numInput('a4MonoFin')}</Field></div>
              </div>
            </div>

            {/* A3 Couleur */}
            <div className="col-12">
              <div className="p-2 rounded-2 mb-1" style={{ background: '#fff0f0', fontSize: '0.78rem', fontWeight: 700, color: '#CC1416', letterSpacing: '0.04em' }}>
                COMPTEURS A3 COULEUR
              </div>
              <div className="row g-2">
                <div className="col-sm-6"><Field label="Début">{numInput('a3CoulDebut')}</Field></div>
                <div className="col-sm-6"><Field label="Fin">{numInput('a3CoulFin')}</Field></div>
              </div>
            </div>

            {/* A4 Couleur */}
            <div className="col-12">
              <div className="p-2 rounded-2 mb-1" style={{ background: '#fff0f0', fontSize: '0.78rem', fontWeight: 700, color: '#CC1416', letterSpacing: '0.04em' }}>
                COMPTEURS A4 COULEUR
              </div>
              <div className="row g-2">
                <div className="col-sm-6"><Field label="Début">{numInput('a4CoulDebut')}</Field></div>
                <div className="col-sm-6"><Field label="Fin">{numInput('a4CoulFin')}</Field></div>
              </div>
            </div>

            {/* Preview calcul */}
            <div className="col-12">
              <div className="d-flex gap-3 p-3 rounded-2" style={{ background: '#f1f3f5', fontSize: '0.82rem' }}>
                <div>
                  <span className="text-muted">Copies mono A4éq : </span>
                  <strong>{formatNumber(previewMono)}</strong>
                  <span className="text-muted ms-1" style={{ fontSize: '0.72rem' }}>= A3×2 + A4</span>
                </div>
                <div>
                  <span className="text-muted">Copies coul A4éq : </span>
                  <strong style={{ color: '#CC1416' }}>{formatNumber(previewCoul)}</strong>
                  <span className="text-muted ms-1" style={{ fontSize: '0.72rem' }}>= A3×2 + A4</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
