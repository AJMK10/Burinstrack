import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  XCircle,
} from 'lucide-react';
import api from '../lib/api';
import type { Intervention, StatutIntervention } from '../types';
import { useAuthStore } from '../store/authStore';
import { STATUT_INTERVENTION } from '../lib/format';
import {
  EmptyState,
  ErrorState,
  InterventionBadge,
  NatureBadge,
  PageHeader,
  Pagination,
  SearchInput,
} from '../components/ui';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUT_ICONS: Record<StatutIntervention, React.ElementType> = {
  Ouverte: AlertCircle,
  EnCours: Clock,
  Resolue: CheckCircle,
  Fermee:  XCircle,
};

export default function InterventionsPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuthStore();
  const canCreate = hasRole('Administrateur') || hasRole('ResponsableSAV') || hasRole('Technicien');

  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<StatutIntervention | ''>('');
  const [page, setPage] = useState(1);

  const { data: interventions = [], isLoading, isError, refetch } = useQuery<Intervention[]>({
    queryKey: ['interventions', statutFilter, page],
    queryFn: () => api.get('/interventions', { params: { statut: statutFilter || undefined, page, taille: 20 } }).then((r) => r.data),
  });

  const filtered = interventions.filter((i) =>
    !search ||
    i.nomClient.toLowerCase().includes(search.toLowerCase()) ||
    i.numeroIntervention.toLowerCase().includes(search.toLowerCase()) ||
    i.nomTechnicien.toLowerCase().includes(search.toLowerCase()) ||
    i.designationCopieur.toLowerCase().includes(search.toLowerCase()),
  );

  const statusCounts = (Object.keys(STATUT_INTERVENTION) as StatutIntervention[]).map((s) => ({
    s,
    count: interventions.filter((i) => i.statut === s).length,
    cfg: STATUT_INTERVENTION[s],
    Icon: STATUT_ICONS[s],
  }));

  return (
    <div>
      <PageHeader
        title="Interventions"
        actions={
          canCreate && (
            <button onClick={() => navigate('/interventions/nouvelle')} className="btn btn-primary d-flex align-items-center gap-2">
              <Plus size={15} /> Nouvelle intervention
            </button>
          )
        }
      />

      {/* Status chips */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {statusCounts.map(({ s, count, cfg, Icon }) => {
          const active = statutFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatutFilter(active ? '' : s)}
              className={`btn btn-sm d-flex align-items-center gap-1 rounded-pill ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
            >
              <Icon size={12} /> {cfg.label}
              {count > 0 && (
                <span
                  className="badge rounded-pill ms-1"
                  style={{ background: active ? 'rgba(255,255,255,0.25)' : '#e9ecef', color: active ? '#fff' : '#495057', fontSize: '0.65rem' }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <div className="flex-grow-1" style={{ minWidth: '14rem' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Client, N° intervention, technicien, copieur…" />
        </div>
        <select
          className="form-select"
          style={{ width: '12rem' }}
          value={statutFilter}
          onChange={(e) => { setStatutFilter(e.target.value as StatutIntervention | ''); setPage(1); }}
        >
          <option value="">Tous les statuts</option>
          <option value="Ouverte">Ouvertes</option>
          <option value="EnCours">En cours</option>
          <option value="Resolue">Résolues</option>
          <option value="Fermee">Fermées</option>
        </select>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<AlertCircle size={24} />} title="Aucune intervention trouvée" text="Essayez de modifier vos filtres ou créez une nouvelle intervention." />
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>N° / Date</th>
                  <th>Client / Copieur</th>
                  <th>Technicien</th>
                  <th>Nature</th>
                  <th>Compteurs NB</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <div className="font-mono fw-semibold text-brand" style={{ fontSize: '0.78rem' }}>{i.numeroIntervention}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {format(new Date(i.dateIntervention), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </td>
                    <td>
                      <div className="fw-medium" style={{ fontSize: '0.85rem', color: '#343a40' }}>{i.nomClient}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{i.designationCopieur}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#495057' }}>{i.nomTechnicien}</td>
                    <td><NatureBadge nature={i.nature} /></td>
                    <td>
                      <div style={{ fontSize: '0.78rem', color: '#495057' }}>
                        <span className="text-muted">Préc.</span> {i.compteurNBPrecedent.toLocaleString('fr-FR')}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#495057' }}>
                        <span className="text-muted">Act.</span> {i.compteurNBActuel.toLocaleString('fr-FR')}
                        {i.volumeNBConsomme > 0 && (
                          <span className="ms-1 text-primary fw-medium">(+{i.volumeNBConsomme.toLocaleString('fr-FR')})</span>
                        )}
                      </div>
                    </td>
                    <td><InterventionBadge statut={i.statut} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} onPage={setPage} hasNext={interventions.length >= 20} count={filtered.length} />
        </div>
      )}

    </div>
  );
}
