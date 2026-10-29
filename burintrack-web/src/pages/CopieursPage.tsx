import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Pencil,
  Plus,
  Printer,
} from 'lucide-react';
import api from '../lib/api';
import type { Copieur, StatutCopieur } from '../types';
import { useAuthStore } from '../store/authStore';
import { formatDate, MARQUE_TONE, TONE } from '../lib/format';
import {
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
      style={{ width: 40, height: 40, fontWeight: 800, fontSize: '0.7rem' }}
    >
      {marque.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function CopieursPage() {
  const navigate = useNavigate();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canManage = hasRole('Administrateur') || hasRole('ResponsableSAV');

  const [search, setSearch]     = useState('');
  const [situation, setSituation] = useState<StatutCopieur | ''>('');
  const [marque, setMarque]     = useState('');
  const [echeance, setEcheance] = useState<'' | 'bientot' | 'expire'>('');

  const { data: copieurs = [], isLoading, isError, refetch } = useQuery<Copieur[]>({
    queryKey: ['copieurs', 'all'],
    queryFn: () => api.get('/copieurs').then((r) => r.data),
  });

  const marquesPresentes = useMemo(() => [...new Set(copieurs.map((c) => c.marque))].sort(), [copieurs]);

  const stats = useMemo(() => ({
    total:       copieurs.length,
    actifs:      copieurs.filter((c) => c.situation === 'Actif').length,
    maintenance: copieurs.filter((c) => c.situation === 'EnMaintenance').length,
    horsService: copieurs.filter((c) => c.situation === 'HorsService').length,
    bientot:     copieurs.filter((c) => c.statutContrat === 'Actif' && c.joursAvantExpiration >= 0 && c.joursAvantExpiration <= 30).length,
    expires:     copieurs.filter((c) => c.joursAvantExpiration < 0).length,
  }), [copieurs]);

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

  const chips = [
    { key: 'all',          label: 'Tous',            value: stats.total,       active: !situation && !echeance,          onClick: () => { setSituation(''); setEcheance(''); } },
    { key: 'Actif',        label: 'Actifs',           value: stats.actifs,      active: situation === 'Actif',            onClick: () => { setSituation(situation === 'Actif' ? '' : 'Actif'); setEcheance(''); } },
    { key: 'EnMaint',      label: 'En maintenance',   value: stats.maintenance, active: situation === 'EnMaintenance',    onClick: () => { setSituation(situation === 'EnMaintenance' ? '' : 'EnMaintenance'); setEcheance(''); } },
    { key: 'HorsService',  label: 'Hors service',     value: stats.horsService, active: situation === 'HorsService',      onClick: () => { setSituation(situation === 'HorsService' ? '' : 'HorsService'); setEcheance(''); } },
    { key: 'bientot',      label: 'Échéance < 60 j',  value: stats.bientot,     active: echeance === 'bientot',           onClick: () => { setEcheance(echeance === 'bientot' ? '' : 'bientot'); setSituation(''); } },
    { key: 'expire',       label: 'Contrats expirés', value: stats.expires,     active: echeance === 'expire',            onClick: () => { setEcheance(echeance === 'expire' ? '' : 'expire'); setSituation(''); } },
  ];

  return (
    <div>
      <PageHeader
        title="Parc copieurs"
        subtitle={<><strong>{stats.total}</strong> machine{stats.total > 1 ? 's' : ''} sous contrat</>}
        actions={
          canManage && (
            <button onClick={() => navigate('/copieurs/nouveau')} className="btn btn-primary d-flex align-items-center gap-2">
              <Plus size={15} /> Nouveau copieur
            </button>
          )
        }
      />

      {/* Filter chips */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={c.onClick}
            className={`btn btn-sm d-flex align-items-center gap-1 rounded-pill ${c.active ? 'btn-primary' : 'btn-outline-secondary'}`}
          >
            {c.label}
            <span
              className="badge rounded-pill ms-1"
              style={{ background: c.active ? 'rgba(255,255,255,0.25)' : '#e9ecef', color: c.active ? '#fff' : '#495057', fontSize: '0.65rem' }}
            >{c.value}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div className="flex-grow-1" style={{ minWidth: '16rem' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Client, marque, modèle, n° de série…" />
        </div>
        <select className="form-select" style={{ width: '12rem' }} value={marque} onChange={(e) => setMarque(e.target.value)} aria-label="Filtrer par marque">
          <option value="">Toutes les marques</option>
          {marquesPresentes.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div>{[0,1,2,3,4].map((i) => <Skeleton key={i} className="mb-2" style={{ height: 60 }} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Printer size={24} />} title="Aucun copieur trouvé" text="Essayez d'élargir vos filtres ou ajoutez une machine au parc." />
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Machine</th>
                  <th>Client</th>
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
                      <td className="text-truncate" style={{ maxWidth: '12rem', fontSize: '0.85rem', color: '#495057' }}>{c.nomClient}</td>
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
                          <button className="btn-icon" aria-label="Modifier" onClick={(e) => { e.stopPropagation(); navigate(`/copieurs/${c.id}/modifier`); }}>
                            <Pencil size={14} />
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
