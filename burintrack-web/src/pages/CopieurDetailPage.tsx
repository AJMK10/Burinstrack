import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Cpu,
  MapPin,
  Network,
  Pencil,
  StickyNote,
  Wrench,
} from 'lucide-react';
import api from '../lib/api';
import type { Copieur, Intervention } from '../types';
import { useAuthStore } from '../store/authStore';
import { formatDate, MARQUE_TONE, TONE } from '../lib/format';
import {
  ContratBadge,
  DetailRow,
  ErrorState,
  FormSection,
  InterventionBadge,
  NatureBadge,
  PageHeader,
  ProgressBar,
  Skeleton,
  SituationBadge,
} from '../components/ui';

function contractInfo(c: Copieur) {
  const debut = new Date(c.dateDebutContrat).getTime();
  const fin   = new Date(c.dateFinContrat).getTime();
  const pct   = fin > debut ? ((Date.now() - debut) / (fin - debut)) * 100 : 100;
  const j     = c.joursAvantExpiration;
  const tone  = j < 0 ? 'rose' : j <= 30 ? 'rose' : j <= 60 ? 'amber' : 'emerald';
  const label = j < 0 ? `Expiré depuis ${Math.abs(j)} j` : j === 0 ? "Expire aujourd'hui" : `${j} j restants`;
  return { pct, tone: tone as 'rose' | 'amber' | 'emerald', label };
}

export default function CopieurDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canManage = hasRole('Administrateur') || hasRole('ResponsableSAV');

  const { data: copieurs = [], isLoading, isError } = useQuery<Copieur[]>({
    queryKey: ['copieurs', 'all'],
    queryFn: () => api.get('/copieurs').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const copieur = copieurs.find((c) => c.id === id);

  const { data: interventions = [], isLoading: loadingHisto } = useQuery<Intervention[]>({
    queryKey: ['interventions', { copieurId: id }],
    queryFn: () => api.get('/interventions', { params: { copieurId: id, taille: 8 } }).then((r) => r.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  if (isError) return <ErrorState onRetry={() => window.location.reload()} />;

  if (isLoading || !copieur) {
    return (
      <div>
        <PageHeader title="Chargement…" actions={
          <button onClick={() => navigate('/copieurs')} className="btn btn-outline-secondary d-flex align-items-center gap-2">
            <ArrowLeft size={15} /> Retour
          </button>
        } />
        <div className="row g-3">
          {[0, 1].map((i) => <div key={i} className="col-12"><Skeleton style={{ height: 160 }} /></div>)}
        </div>
      </div>
    );
  }

  const info = contractInfo(copieur);
  const brandTone = MARQUE_TONE[copieur.marque] ?? 'slate';

  return (
    <div>
      <PageHeader
        title={copieur.designation}
        subtitle={
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>{copieur.numeroSerie}</span>
            <SituationBadge situation={copieur.situation} />
            <ContratBadge statut={copieur.statutContrat} />
          </div>
        }
        actions={
          <div className="d-flex gap-2">
            <button onClick={() => navigate('/copieurs')} className="btn btn-outline-secondary d-flex align-items-center gap-2">
              <ArrowLeft size={15} /> Retour
            </button>
            {canManage && (
              <button onClick={() => navigate(`/copieurs/${id}/modifier`)} className="btn btn-primary d-flex align-items-center gap-2">
                <Pencil size={15} /> Modifier
              </button>
            )}
          </div>
        }
      />

      <div className="row g-3">
        <div className="col-lg-6">
          <FormSection title="Identification" icon={<span className={`d-inline-flex align-items-center justify-content-center rounded-2 ${TONE[brandTone].soft}`} style={{ width: 20, height: 20, fontSize: '0.6rem', fontWeight: 800 }}>{copieur.marque.slice(0, 2).toUpperCase()}</span>}>
            <DetailRow label="Client">{copieur.nomClient}</DetailRow>
            <DetailRow label="Marque / Modèle">{copieur.marque} · {copieur.modele}</DetailRow>
            <DetailRow label="N° de série">
              <code className="bg-light px-1 rounded" style={{ fontSize: '0.82rem' }}>{copieur.numeroSerie}</code>
            </DetailRow>
          </FormSection>
        </div>

        <div className="col-lg-6">
          <FormSection title="Contrat de maintenance" icon={<CalendarClock size={13} />}>
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.82rem' }}>
                <span className="text-muted">{formatDate(copieur.dateDebutContrat)}</span>
                <span className={`fw-semibold d-flex align-items-center gap-1 ${TONE[info.tone].text}`}>
                  {info.tone === 'rose' && <AlertTriangle size={12} />} {info.label}
                </span>
                <span className="text-muted">{formatDate(copieur.dateFinContrat)}</span>
              </div>
              <ProgressBar value={info.pct} tone={info.tone} />
            </div>
            <ContratBadge statut={copieur.statutContrat} />
          </FormSection>
        </div>

        <div className="col-12">
          <FormSection title="Informations techniques" icon={<Cpu size={13} />}>
            <div className="row g-2">
              <div className="col-sm-6">
                <DetailRow icon={<Network size={15} />} label="Adresse IP">
                  {copieur.adresseIP
                    ? <code className="bg-light px-1 rounded" style={{ fontSize: '0.82rem' }}>{copieur.adresseIP}</code>
                    : <span className="text-muted">—</span>}
                </DetailRow>
              </div>
              <div className="col-sm-6">
                <DetailRow icon={<MapPin size={15} />} label="Emplacement">
                  {copieur.localisation || <span className="text-muted">—</span>}
                </DetailRow>
              </div>
              {copieur.notesTechniques && (
                <div className="col-12">
                  <DetailRow icon={<StickyNote size={15} />} label="Notes techniques">
                    {copieur.notesTechniques}
                  </DetailRow>
                </div>
              )}
            </div>
          </FormSection>
        </div>

        <div className="col-12">
          <FormSection title="Historique des interventions" icon={<Wrench size={13} />}>
            {loadingHisto ? (
              <Skeleton style={{ height: 80 }} />
            ) : interventions.length === 0 ? (
              <p className="text-center text-muted py-3 mb-0" style={{ fontSize: '0.85rem' }}>
                Aucune intervention enregistrée pour ce copieur.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0" style={{ fontSize: '0.83rem' }}>
                  <thead>
                    <tr>
                      <th>N° / Date</th>
                      <th>Technicien</th>
                      <th>Nature</th>
                      <th>Problème</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interventions.map((i) => (
                      <tr key={i.id}>
                        <td>
                          <div className="font-mono fw-semibold text-brand" style={{ fontSize: '0.75rem' }}>{i.numeroIntervention}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{formatDate(i.dateIntervention)}</div>
                        </td>
                        <td style={{ color: '#495057' }}>{i.nomTechnicien}</td>
                        <td><NatureBadge nature={i.nature} /></td>
                        <td style={{ maxWidth: '20rem', color: '#495057' }} className="text-truncate">{i.descriptionProbleme}</td>
                        <td><InterventionBadge statut={i.statut} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </FormSection>
        </div>
      </div>
    </div>
  );
}
