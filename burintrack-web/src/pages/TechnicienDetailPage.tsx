import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Mail,
  Phone,
  UserCog,
  Wrench,
} from 'lucide-react';
import api from '../lib/api';
import type { Intervention, Technicien } from '../types';
import { formatDate } from '../lib/format';
import {
  Avatar,
  Badge,
  DetailRow,
  ErrorState,
  FormSection,
  InterventionBadge,
  NatureBadge,
  PageHeader,
  Skeleton,
} from '../components/ui';

export default function TechnicienDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: techniciens = [], isLoading, isError } = useQuery<Technicien[]>({
    queryKey: ['techniciens'],
    queryFn: () => api.get('/techniciens').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const technicien = techniciens.find((t) => t.id === id);

  const { data: interventions = [], isLoading: loadingHisto } = useQuery<Intervention[]>({
    queryKey: ['interventions', { technicienId: id }],
    queryFn: () => api.get('/interventions', { params: { technicienId: id, taille: 10 } }).then((r) => r.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  if (isError) return <ErrorState onRetry={() => window.location.reload()} />;

  if (isLoading || !technicien) {
    return (
      <div>
        <PageHeader title="Chargement…" actions={
          <button onClick={() => navigate('/techniciens')} className="btn btn-outline-secondary d-flex align-items-center gap-2">
            <ArrowLeft size={15} /> Retour
          </button>
        } />
        <div className="row g-3">
          {[0, 1].map((i) => <div key={i} className="col-12"><Skeleton style={{ height: 120 }} /></div>)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={technicien.nomComplet}
        subtitle={
          <Badge tone={technicien.estActif ? 'emerald' : 'slate'} dot>
            {technicien.estActif ? 'Actif' : 'Inactif'}
          </Badge>
        }
        actions={
          <button onClick={() => navigate('/techniciens')} className="btn btn-outline-secondary d-flex align-items-center gap-2">
            <ArrowLeft size={15} /> Retour
          </button>
        }
      />

      <div className="row g-3">
        <div className="col-lg-5">
          <FormSection title="Informations" icon={<UserCog size={13} />}>
            <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #dbeafe, #ede9fe)' }}>
              <Avatar name={technicien.nomComplet} size={52} rounded="rounded-circle" />
              <div>
                <div className="fw-bold" style={{ fontSize: '1rem', color: '#343a40' }}>{technicien.nomComplet}</div>
                <div className="d-flex flex-wrap gap-2 mt-1">
                  <Badge tone="brand">
                    <Wrench size={11} className="me-1" style={{ display: 'inline' }} />
                    {technicien.totalInterventions} interventions
                  </Badge>
                  {technicien.interventionsEnCours > 0 && (
                    <Badge tone="amber" dot>{technicien.interventionsEnCours} en cours</Badge>
                  )}
                </div>
              </div>
            </div>
            <DetailRow icon={<Phone size={15} />} label="Téléphone">
              <a className="text-primary" href={`tel:${technicien.telephone.replace(/\s/g, '')}`}>{technicien.telephone}</a>
            </DetailRow>
            <DetailRow icon={<Mail size={15} />} label="E-mail">
              <a className="text-primary" href={`mailto:${technicien.email}`}>{technicien.email}</a>
            </DetailRow>
            <DetailRow label="Membre depuis">{formatDate(technicien.createdAt)}</DetailRow>
          </FormSection>
        </div>

        <div className="col-lg-7">
          <FormSection title="Interventions récentes" icon={<Wrench size={13} />}>
            {loadingHisto ? (
              <Skeleton style={{ height: 120 }} />
            ) : interventions.length === 0 ? (
              <p className="text-center text-muted py-3 mb-0" style={{ fontSize: '0.85rem' }}>
                Aucune intervention enregistrée.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0" style={{ fontSize: '0.83rem' }}>
                  <thead>
                    <tr>
                      <th>N° / Date</th>
                      <th>Client / Copieur</th>
                      <th>Nature</th>
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
                        <td>
                          <div style={{ color: '#343a40' }}>{i.nomClient}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{i.designationCopieur}</div>
                        </td>
                        <td><NatureBadge nature={i.nature} /></td>
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
