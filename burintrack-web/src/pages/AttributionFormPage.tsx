import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowLeftRight, Save } from 'lucide-react';
import api from '../lib/api';
import type { Client, Copieur } from '../types/index';
import { toast } from '../store/toastStore';
import { MARQUE_TONE, TONE } from '../lib/format';
import { ContratBadge, Skeleton } from '../components/ui';

const schema = z.object({
  clientId: z.string().min(1, 'Veuillez sélectionner un client'),
  dateDebutContrat: z.string().min(1, 'Date requise'),
  dateFinContrat: z.string().min(1, 'Date requise'),
  statutContrat: z.enum(['Actif', 'Expire', 'Suspendu', 'Resilie'] as const),
});

type FormData = z.infer<typeof schema>;

function BrandChip({ marque }: { marque: string }) {
  const tone = MARQUE_TONE[marque] ?? 'slate';
  return (
    <div
      className={`d-flex align-items-center justify-content-center rounded-2 flex-shrink-0 ${TONE[tone].soft}`}
      style={{ width: 48, height: 48, fontWeight: 800, fontSize: '0.75rem' }}
    >
      {marque.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function AttributionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: copieurs = [], isLoading: loadingCopieurs } = useQuery<Copieur[]>({
    queryKey: ['copieurs', 'all'],
    queryFn: () => api.get('/copieurs').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery<Client[]>({
    queryKey: ['clients', ''],
    queryFn: () => api.get('/clients').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const copieur = copieurs.find((c) => c.id === id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: '',
      dateDebutContrat: '',
      dateFinContrat: '',
      statutContrat: 'Actif',
    },
  });

  useEffect(() => {
    if (copieur) {
      reset({
        clientId: copieur.clientId,
        dateDebutContrat: copieur.dateDebutContrat.slice(0, 10),
        dateFinContrat: copieur.dateFinContrat.slice(0, 10),
        statutContrat: copieur.statutContrat,
      });
    }
  }, [copieur, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.put(`/copieurs/${id}/attribuer`, {
        clientId: data.clientId,
        dateDebutContrat: data.dateDebutContrat,
        dateFinContrat: data.dateFinContrat,
        statutContrat: data.statutContrat,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['copieurs'] });
      toast.success('Attribution mise à jour.');
      navigate('/attributions');
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement.");
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  const isLoading = loadingCopieurs || loadingClients;

  const clientActuel = clients.find((c) => c.id === copieur?.clientId);

  return (
    <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={() => navigate('/attributions')}>
          <ArrowLeft size={14} /> Retour
        </button>
        <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
          <ArrowLeftRight size={18} className="text-primary" /> Attribuer le copieur
        </h5>
      </div>

      {isLoading ? (
        <div>
          <Skeleton className="mb-3" style={{ height: 80 }} />
          <Skeleton className="mb-3" style={{ height: 200 }} />
        </div>
      ) : !copieur ? (
        <div className="alert alert-warning">Copieur introuvable.</div>
      ) : (
        <>
          {/* Copieur info card */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body d-flex align-items-center gap-3">
              <BrandChip marque={copieur.marque} />
              <div style={{ minWidth: 0 }}>
                <div className="fw-bold" style={{ fontSize: '0.95rem', color: '#343a40' }}>{copieur.designation}</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>{copieur.marque} {copieur.modele} · {copieur.numeroSerie}</div>
                {clientActuel && (
                  <div className="mt-1 d-flex align-items-center gap-2" style={{ fontSize: '0.78rem' }}>
                    <span className="text-muted">Client actuel :</span>
                    <span className="fw-medium">{clientActuel.nomClient}</span>
                    <span className="font-mono badge bg-light text-muted" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {clientActuel.numeroContrat}
                    </span>
                  </div>
                )}
              </div>
              <div className="ms-auto">
                <ContratBadge statut={copieur.statutContrat} />
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-bottom fw-semibold" style={{ fontSize: '0.85rem' }}>
                Nouvelle attribution
              </div>
              <div className="card-body d-flex flex-column gap-3">

                <div>
                  <label className="form-label fw-medium" style={{ fontSize: '0.85rem' }}>Client *</label>
                  <select className={`form-select ${errors.clientId ? 'is-invalid' : ''}`} {...register('clientId')}>
                    <option value="">— Sélectionner un client —</option>
                    {[...clients].sort((a, b) => a.nomClient.localeCompare(b.nomClient)).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nomClient} — {c.numeroContrat}
                      </option>
                    ))}
                  </select>
                  {errors.clientId && <div className="invalid-feedback">{errors.clientId.message}</div>}
                </div>

                <div className="row g-3">
                  <div className="col-sm-6">
                    <label className="form-label fw-medium" style={{ fontSize: '0.85rem' }}>Début de contrat *</label>
                    <input
                      type="date"
                      className={`form-control ${errors.dateDebutContrat ? 'is-invalid' : ''}`}
                      {...register('dateDebutContrat')}
                    />
                    {errors.dateDebutContrat && <div className="invalid-feedback">{errors.dateDebutContrat.message}</div>}
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label fw-medium" style={{ fontSize: '0.85rem' }}>Fin de contrat *</label>
                    <input
                      type="date"
                      className={`form-control ${errors.dateFinContrat ? 'is-invalid' : ''}`}
                      {...register('dateFinContrat')}
                    />
                    {errors.dateFinContrat && <div className="invalid-feedback">{errors.dateFinContrat.message}</div>}
                  </div>
                </div>

                <div>
                  <label className="form-label fw-medium" style={{ fontSize: '0.85rem' }}>Statut du contrat *</label>
                  <select className="form-select" {...register('statutContrat')}>
                    <option value="Actif">Actif</option>
                    <option value="Suspendu">Suspendu</option>
                    <option value="Expire">Expiré</option>
                    <option value="Resilie">Résilié</option>
                  </select>
                </div>

              </div>
              <div className="card-footer bg-transparent d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/attributions')}>
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                  disabled={isSubmitting || mutation.isPending}
                >
                  <Save size={14} />
                  {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
