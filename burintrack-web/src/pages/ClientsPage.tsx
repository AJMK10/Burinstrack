import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  LayoutGrid,
  List,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Printer,
  User,
} from 'lucide-react';
import api from '../lib/api';
import type { Client } from '../types';
import { useAuthStore } from '../store/authStore';
import {
  Avatar,
  Badge,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchInput,
  Segmented,
  Skeleton,
} from '../components/ui';


export default function ClientsPage() {
  const navigate = useNavigate();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canManage = hasRole('Administrateur') || hasRole('ResponsableSAV');

  const [search, setSearch] = useState('');
  const [ville, setVille] = useState('');
  const [view, setView] = useState<'cards' | 'table'>('cards');

  const { data: clients = [], isLoading, isError, refetch } = useQuery<Client[]>({
    queryKey: ['clients', search],
    queryFn: () => api.get('/clients', { params: { search: search || undefined } }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const villes = useMemo(() => [...new Set(clients.map((c) => c.ville))].sort(), [clients]);
  const filtered = useMemo(() => clients.filter((c) => !ville || c.ville === ville), [clients, ville]);
  const totalCopieurs = filtered.reduce((s, c) => s + c.nombreCopieurs, 0);

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={
          <>
            <strong>{filtered.length}</strong> client{filtered.length > 1 ? 's' : ''} ·{' '}
            <strong>{totalCopieurs}</strong> copieur{totalCopieurs > 1 ? 's' : ''} sous contrat
          </>
        }
        actions={
          canManage && (
            <button onClick={() => navigate('/clients/nouveau')} className="btn btn-primary d-flex align-items-center gap-2">
              <Plus size={15} /> Nouveau client
            </button>
          )
        }
      />

      {/* Toolbar */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div className="flex-grow-1" style={{ minWidth: '16rem' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un client, un contrat, un e-mail…" />
        </div>
        <select
          className="form-select"
          style={{ width: '12rem' }}
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          aria-label="Filtrer par ville"
        >
          <option value="">Toutes les villes</option>
          {villes.map((v) => <option key={v}>{v}</option>)}
        </select>
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
        <div className="row g-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="col-sm-6 col-xl-4">
              <Skeleton className="h-100" style={{ height: 200 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 size={24} />}
          title="Aucun client trouvé"
          text="Modifiez votre recherche ou ajoutez un nouveau client."
          action={canManage && (
            <button onClick={() => navigate('/clients/nouveau')} className="btn btn-primary btn-sm d-flex align-items-center gap-2">
              <Plus size={14} /> Nouveau client
            </button>
          )}
        />
      ) : view === 'cards' ? (
        <div className="row g-3">
          {filtered.map((c) => (
            <div key={c.id} className="col-sm-6 col-xl-4">
              <button
                onClick={() => navigate(`/clients/${c.id}`)}
                className="card w-100 text-start border-0 shadow-sm h-100 animate-slide-up"
                style={{ cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s', background: '#fff', borderRadius: '0.5rem' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
              >
                <div className="card-body">
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <Avatar name={c.nomClient} size={44} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="fw-bold text-truncate" style={{ fontSize: '0.9rem', color: '#343a40' }}>{c.nomClient}</div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>{c.secteurActivite || 'Secteur non renseigné'}</div>
                    </div>
                    {!c.estActif && <Badge tone="slate">Inactif</Badge>}
                  </div>
                  <div className="d-flex flex-column gap-1 mb-3" style={{ fontSize: '0.82rem', color: '#6c757d' }}>
                    <div className="d-flex align-items-center gap-2"><MapPin size={13} className="flex-shrink-0" /><span className="text-truncate">{c.commune ? `${c.commune}, ` : ''}{c.ville}</span></div>
                    <div className="d-flex align-items-center gap-2"><User size={13} className="flex-shrink-0" /><span className="text-truncate">{c.nomContact}</span></div>
                    <div className="d-flex align-items-center gap-2"><Phone size={13} className="flex-shrink-0" /><span className="text-truncate">{c.telephone}</span></div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between pt-3 border-top">
                    <span className="font-mono badge bg-light text-muted" style={{ fontSize: '0.72rem', fontWeight: 600 }}>{c.numeroContrat}</span>
                    <span className="d-flex align-items-center gap-1 text-primary fw-semibold" style={{ fontSize: '0.82rem' }}>
                      <Printer size={13} /> {c.nombreCopieurs}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contrat</th>
                  <th>Localisation</th>
                  <th>Contact</th>
                  <th className="text-center">Copieurs</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/clients/${c.id}`)}>

                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Avatar name={c.nomClient} size={36} />
                        <div style={{ minWidth: 0 }}>
                          <div className="fw-semibold text-truncate" style={{ fontSize: '0.85rem', color: '#343a40' }}>{c.nomClient}</div>
                          <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>{c.secteurActivite}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="font-mono badge bg-light text-muted" style={{ fontSize: '0.72rem', fontWeight: 600 }}>{c.numeroContrat}</span></td>
                    <td style={{ fontSize: '0.85rem', color: '#6c757d' }}>{c.commune ? `${c.commune}, ` : ''}{c.ville}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{c.nomContact}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{c.telephone}</div>
                    </td>
                    <td className="text-center"><Badge tone="brand">{c.nombreCopieurs}</Badge></td>
                    <td className="text-end">
                      {canManage && (
                        <button className="btn-icon" aria-label="Modifier" onClick={(e) => { e.stopPropagation(); navigate(`/clients/${c.id}/modifier`); }}>
                          <Pencil size={14} />
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

    </div>
  );
}
