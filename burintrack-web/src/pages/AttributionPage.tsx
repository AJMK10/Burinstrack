import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeftRight, Pencil, Printer } from 'lucide-react';
import api from '../lib/api';
import type { Copieur } from '../types/index';
import { useAuthStore } from '../store/authStore';
import { formatDate, MARQUE_TONE, TONE } from '../lib/format';
import {
  ContratBadge,
  EmptyState,
  ErrorState,
  PageHeader,
  ProgressBar,
  SearchInput,
  SituationBadge,
  Skeleton,
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

function BrandChip({ marque }: { marque: string }) {
  const tone = MARQUE_TONE[marque] ?? 'slate';
  return (
    <div
      className={`d-flex align-items-center justify-content-center rounded-2 flex-shrink-0 ${TONE[tone].soft}`}
      style={{ width: 36, height: 36, fontWeight: 800, fontSize: '0.65rem' }}
    >
      {marque.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function AttributionPage() {
  const navigate = useNavigate();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canManage = hasRole('Administrateur') || hasRole('ResponsableSAV');

  const [search, setSearch] = useState('');
  const [marque, setMarque] = useState('');

  const { data: copieurs = [], isLoading, isError, refetch } = useQuery<Copieur[]>({
    queryKey: ['copieurs', 'all'],
    queryFn: () => api.get('/copieurs').then((r) => r.data),
  });

  const marquesPresentes = useMemo(() => [...new Set(copieurs.map((c) => c.marque))].sort(), [copieurs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return copieurs.filter((c) => {
      if (marque && c.marque !== marque) return false;
      if (!q) return true;
      return [c.designation, c.nomClient, c.numeroSerie, c.marque, c.modele].some((v) => v.toLowerCase().includes(q));
    });
  }, [copieurs, search, marque]);

  return (
    <div>
      <PageHeader
        title="Attributions"
        subtitle={<><strong>{copieurs.length}</strong> copieur{copieurs.length > 1 ? 's' : ''} sous contrat</>}
      />

      <div className="alert alert-info border-0 d-flex align-items-center gap-2 mb-3" style={{ fontSize: '0.85rem' }}>
        <ArrowLeftRight size={15} className="flex-shrink-0" />
        <span>Gérez ici l'attribution des copieurs aux clients et les dates de contrat.</span>
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div className="flex-grow-1" style={{ minWidth: '16rem' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Client, désignation, n° de série…" />
        </div>
        <select
          className="form-select"
          style={{ width: '12rem' }}
          value={marque}
          onChange={(e) => setMarque(e.target.value)}
          aria-label="Filtrer par marque"
        >
          <option value="">Toutes les marques</option>
          {marquesPresentes.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div>{[0,1,2,3,4].map((i) => <Skeleton key={i} className="mb-2" style={{ height: 60 }} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Printer size={24} />} title="Aucun copieur trouvé" text="Essayez d'élargir vos filtres." />
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Machine</th>
                  <th>Client attribué</th>
                  <th>N° de série</th>
                  <th>Situation</th>
                  <th style={{ width: '14rem' }}>Contrat</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const info = contractInfo(c);
                  return (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/copieurs/${c.id}`)}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <BrandChip marque={c.marque} />
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold text-truncate" style={{ fontSize: '0.85rem', color: '#343a40' }}>{c.designation}</div>
                            <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>{c.marque} · {c.modele}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-truncate" style={{ maxWidth: '12rem', fontSize: '0.85rem', color: '#495057' }}>
                        <span className="fw-medium">{c.nomClient}</span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.78rem', color: '#6c757d' }}>{c.numeroSerie}</td>
                      <td><SituationBadge situation={c.situation} /></td>
                      <td>
                        <div className="d-flex align-items-center justify-content-between mb-1" style={{ fontSize: '0.75rem' }}>
                          <span className={`d-flex align-items-center gap-1 fw-semibold ${TONE[info.tone].text}`}>
                            {info.tone === 'rose' && <AlertTriangle size={11} />} {info.label}
                          </span>
                          <span className="text-muted">{formatDate(c.dateFinContrat, 'dd/MM/yy')}</span>
                        </div>
                        <ProgressBar value={info.pct} tone={info.tone} />
                      </td>
                      <td className="text-end">
                        {canManage && (
                          <button
                            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                            style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                            aria-label="Attribuer"
                            onClick={(e) => { e.stopPropagation(); navigate(`/attributions/${c.id}`); }}
                          >
                            <ArrowLeftRight size={12} /> Attribuer
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 border-top bg-light text-muted" style={{ fontSize: '0.78rem' }}>
            {filtered.length} machine{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''} sur {copieurs.length}
          </div>
        </div>
      )}
    </div>
  );
}
