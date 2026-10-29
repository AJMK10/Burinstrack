import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Printer,
  User,
} from 'lucide-react';
import api from '../lib/api';
import type { Client, Copieur } from '../types';
import { useAuthStore } from '../store/authStore';
import { formatDate, MARQUE_TONE, TONE } from '../lib/format';
import {
  Avatar,
  Badge,
  DetailRow,
  ErrorState,
  FormSection,
  PageHeader,
  Skeleton,
  SituationBadge,
} from '../components/ui';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canManage = hasRole('Administrateur') || hasRole('ResponsableSAV');

  const { data: clients = [], isLoading, isError } = useQuery<Client[]>({
    queryKey: ['clients', ''],
    queryFn: () => api.get('/clients').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const client = clients.find((c) => c.id === id);

  const { data: copieurs = [], isLoading: loadingCopieurs } = useQuery<Copieur[]>({
    queryKey: ['copieurs', { clientId: id }],
    queryFn: () => api.get('/copieurs', { params: { clientId: id } }).then((r) => r.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  if (isError) return <ErrorState onRetry={() => window.location.reload()} />;

  if (isLoading || !client) {
    return (
      <div>
        <PageHeader title="Chargement…" actions={
          <button onClick={() => navigate('/clients')} className="btn btn-outline-secondary d-flex align-items-center gap-2">
            <ArrowLeft size={15} /> Retour
          </button>
        } />
        <div className="row g-3">
          {[0, 1, 2].map((i) => <div key={i} className="col-12"><Skeleton style={{ height: 120 }} /></div>)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={client.nomClient}
        subtitle={
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="font-mono badge bg-light text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{client.numeroContrat}</span>
            <Badge tone={client.estActif ? 'emerald' : 'slate'} dot>{client.estActif ? 'Actif' : 'Inactif'}</Badge>
            {client.secteurActivite && <Badge tone="brand">{client.secteurActivite}</Badge>}
          </div>
        }
        actions={
          <div className="d-flex gap-2">
            <button onClick={() => navigate('/clients')} className="btn btn-outline-secondary d-flex align-items-center gap-2">
              <ArrowLeft size={15} /> Retour
            </button>
            {canManage && (
              <button onClick={() => navigate(`/clients/${id}/modifier`)} className="btn btn-primary d-flex align-items-center gap-2">
                <Pencil size={15} /> Modifier
              </button>
            )}
          </div>
        }
      />

      <div className="row g-3">
        <div className="col-lg-6">
          <FormSection title="Identité" icon={<Building2 size={13} />}>
            <DetailRow icon={<Building2 size={15} />} label="Raison sociale">
              {client.raisonSociale || client.nomClient}
            </DetailRow>
            <DetailRow icon={<Briefcase size={15} />} label="Client depuis">
              {formatDate(client.createdAt)}
            </DetailRow>
          </FormSection>
        </div>

        <div className="col-lg-6">
          <FormSection title="Localisation" icon={<MapPin size={13} />}>
            <DetailRow icon={<MapPin size={15} />} label="Adresse">
              {client.adresse}<br />
              {client.commune ? `${client.commune} · ` : ''}{client.ville}, {client.pays}
              {client.latitude != null && client.longitude != null && (
                <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                  GPS {client.latitude.toFixed(4)}, {client.longitude.toFixed(4)}
                </div>
              )}
            </DetailRow>
          </FormSection>
        </div>

        <div className="col-12">
          <FormSection title="Contact principal" icon={<Phone size={13} />}>
            <div className="row g-2">
              <div className="col-sm-6">
                <DetailRow icon={<User size={15} />} label="Nom contact">
                  {client.nomContact}
                  {client.fonctionContact && (
                    <span className="text-muted"> · {client.fonctionContact}</span>
                  )}
                </DetailRow>
              </div>
              <div className="col-sm-6">
                <DetailRow icon={<Phone size={15} />} label="Téléphone">
                  <a className="text-primary" href={`tel:${client.telephone.replace(/\s/g, '')}`}>
                    {client.telephone}
                  </a>
                </DetailRow>
              </div>
              <div className="col-sm-6">
                <DetailRow icon={<Mail size={15} />} label="E-mail">
                  <a className="text-primary" href={`mailto:${client.email}`}>{client.email}</a>
                </DetailRow>
              </div>
            </div>
          </FormSection>
        </div>

        <div className="col-12">
          <FormSection
            title={`Parc copieurs (${copieurs.length})`}
            icon={<Printer size={13} />}
          >
            {loadingCopieurs ? (
              <div className="row g-2">
                {[0, 1, 2].map((i) => <div key={i} className="col-sm-6 col-xl-4"><Skeleton style={{ height: 72 }} /></div>)}
              </div>
            ) : copieurs.length === 0 ? (
              <p className="text-center text-muted py-3 mb-0" style={{ fontSize: '0.85rem' }}>
                Aucun copieur rattaché à ce client.
              </p>
            ) : (
              <div className="row g-2">
                {copieurs.map((co) => (
                  <div key={co.id} className="col-sm-6 col-xl-4">
                    <button
                      className="w-100 text-start border rounded-2 p-2 d-flex align-items-center gap-3"
                      style={{ background: '#fff', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                      onClick={() => navigate(`/copieurs/${co.id}`)}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
                    >
                      <div
                        className={`d-flex align-items-center justify-content-center rounded-2 flex-shrink-0 ${TONE[MARQUE_TONE[co.marque] ?? 'slate'].soft}`}
                        style={{ width: 38, height: 38, fontWeight: 800, fontSize: '0.7rem' }}
                      >
                        {co.marque.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="fw-semibold text-truncate" style={{ fontSize: '0.85rem', color: '#343a40' }}>{co.designation}</div>
                        <div className="font-mono text-muted text-truncate" style={{ fontSize: '0.72rem' }}>{co.numeroSerie}</div>
                      </div>
                      <SituationBadge situation={co.situation} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormSection>
        </div>
      </div>
    </div>
  );
}
