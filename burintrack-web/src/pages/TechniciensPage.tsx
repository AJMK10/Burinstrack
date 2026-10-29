import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, UserCog, Wrench } from 'lucide-react';
import api from '../lib/api';
import type { Technicien } from '../types';
import { useAuthStore } from '../store/authStore';
import {
  Avatar,
  Badge,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchInput,
  Skeleton,
} from '../components/ui';


export default function TechniciensPage() {
  const navigate = useNavigate();
  const hasRole = useAuthStore((s) => s.hasRole);
  const isAdmin   = hasRole('Administrateur');

  const [search, setSearch] = useState('');

  const { data: techniciens = [], isLoading, isError, refetch } = useQuery<Technicien[]>({
    queryKey: ['techniciens'],
    queryFn: () => api.get('/techniciens').then((r) => r.data),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return techniciens.filter(
      (t) => !q || t.nomComplet.toLowerCase().includes(q) || t.email.toLowerCase().includes(q),
    );
  }, [techniciens, search]);

  return (
    <div>
      <PageHeader
        title="Techniciens"
        subtitle={<><strong>{filtered.length}</strong> technicien{filtered.length > 1 ? 's' : ''}</>}
        actions={
          isAdmin && (
            <button onClick={() => navigate('/techniciens/nouveau')} className="btn btn-primary d-flex align-items-center gap-2">
              <Plus size={15} /> Nouveau technicien
            </button>
          )
        }
      />

      <div className="mb-3" style={{ maxWidth: '24rem' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher par nom ou e-mail…" />
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="row g-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="col-sm-6 col-xl-4">
              <Skeleton style={{ height: 160 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UserCog size={24} />}
          title="Aucun technicien trouvé"
          text="Modifiez votre recherche ou ajoutez un nouveau technicien."
          action={isAdmin && (
            <button onClick={() => navigate('/techniciens/nouveau')} className="btn btn-primary btn-sm d-flex align-items-center gap-2">
              <Plus size={14} /> Nouveau technicien
            </button>
          )}
        />
      ) : (
        <div className="row g-3">
          {filtered.map((t) => (
            <div key={t.id} className="col-sm-6 col-xl-4">
              <button
                onClick={() => navigate(`/techniciens/${t.id}`)}
                className="card w-100 text-start border-0 shadow-sm h-100 animate-slide-up"
                style={{ cursor: 'pointer', background: '#fff', borderRadius: '0.5rem', transition: 'box-shadow 0.15s, transform 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
              >
                <div className="card-body">
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <Avatar name={t.nomComplet} size={46} rounded="rounded-circle" />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="fw-bold text-truncate" style={{ fontSize: '0.9rem', color: '#343a40' }}>{t.nomComplet}</div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.78rem' }}>{t.email}</div>
                    </div>
                    <Badge tone={t.estActif ? 'emerald' : 'slate'} dot>{t.estActif ? 'Actif' : 'Inactif'}</Badge>
                  </div>
                  <div className="d-flex align-items-center gap-3 pt-3 border-top" style={{ fontSize: '0.82rem' }}>
                    <span className="d-flex align-items-center gap-1 text-muted">
                      <Wrench size={13} />
                      <strong style={{ color: '#343a40' }}>{t.totalInterventions}</strong> interventions
                    </span>
                    {t.interventionsEnCours > 0 && (
                      <Badge tone="amber" dot>{t.interventionsEnCours} en cours</Badge>
                    )}
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
