import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlignLeft, ArrowLeft, BookOpen, ClipboardList, MessageSquare } from 'lucide-react';
import api from '../lib/api';
import type { Client, Copieur, NatureIntervention, Technicien } from '../types';
import { errorMessage, NATURE } from '../lib/format';
import { Field, FormSection, PageHeader, Spinner } from '../components/ui';
import { toast } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';

const interventionSchema = z.object({
  clientId:                 z.string().min(1, 'Sélectionnez un client'),
  copieurId:                z.string().min(1, 'Sélectionnez un copieur'),
  technicienId:             z.string().min(1, 'Sélectionnez un technicien'),
  dateIntervention:         z.string().min(1, 'Requis'),
  nature:                   z.enum(['MaintenancePreventive','MaintenanceCurative','Panne','Installation','FormationUtilisateur','DeplacementTechnique','Autre']),
  statut:                   z.enum(['Ouverte','EnCours','Resolue','Fermee']),
  compteurNBPrecedent:      z.coerce.number().min(0),
  compteurNBActuel:         z.coerce.number().min(0),
  compteurCouleurPrecedent: z.coerce.number().min(0),
  compteurCouleurActuel:    z.coerce.number().min(0),
  descriptionProbleme:      z.string().trim().min(1, 'Requis'),
  actionsRealisees:         z.string().trim().min(1, 'Requis'),
  piecesRemplacees:         z.string().trim().optional(),
  heureArrivee:             z.string().optional(),
  heureDepart:              z.string().optional(),
  observationTechnicien:    z.string().trim().optional(),
  observationClient:        z.string().trim().optional(),
});
type IForm = z.infer<typeof interventionSchema>;

const todayStr = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM: IForm = {
  clientId: '', copieurId: '', technicienId: '',
  dateIntervention: todayStr(), nature: 'MaintenancePreventive', statut: 'Ouverte',
  compteurNBPrecedent: 0, compteurNBActuel: 0, compteurCouleurPrecedent: 0, compteurCouleurActuel: 0,
  descriptionProbleme: '', actionsRealisees: '', piecesRemplacees: '',
  heureArrivee: '', heureDepart: '', observationTechnicien: '', observationClient: '',
};

export default function InterventionFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients', ''],
    queryFn: () => api.get('/clients').then((r) => r.data),
  });

  const { data: techniciens = [] } = useQuery<Technicien[]>({
    queryKey: ['techniciens'],
    queryFn: () => api.get('/techniciens').then((r) => r.data),
  });

  const currentUser = useAuthStore((s) => s.user);
  const isTechnicien = currentUser?.roles?.includes('Technicien') ?? false;
  const canSelectTechnicien = !isTechnicien;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<IForm>({
    resolver: zodResolver(interventionSchema) as any,
    defaultValues: EMPTY_FORM,
  });

  const selectedClientId = watch('clientId');

  useEffect(() => {
    if (isTechnicien && techniciens.length > 0 && currentUser?.email) {
      const match = techniciens.find((t) => t.email.toLowerCase() === currentUser.email.toLowerCase());
      if (match) setValue('technicienId', match.id.toString(), { shouldValidate: true });
    }
  }, [isTechnicien, techniciens, currentUser?.email, setValue]);

  const { data: copieursClient = [] } = useQuery<Copieur[]>({
    queryKey: ['copieurs', { clientId: selectedClientId }],
    queryFn: () => api.get('/copieurs', { params: { clientId: selectedClientId } }).then((r) => r.data),
    enabled: !!selectedClientId,
  });

  const create = useMutation({
    mutationFn: (f: IForm) => api.post('/interventions', {
      ...f,
      dateIntervention: `${f.dateIntervention}T${f.heureArrivee || '08:00'}:00Z`,
      piecesRemplacees: f.piecesRemplacees || null,
      heureArrivee: f.heureArrivee ? `${f.dateIntervention}T${f.heureArrivee}:00Z` : null,
      heureDepart:  f.heureDepart  ? `${f.dateIntervention}T${f.heureDepart}:00Z`  : null,
      observationTechnicien: f.observationTechnicien || null,
      observationClient:     f.observationClient     || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Intervention créée', "L'intervention a été enregistrée avec succès.");
      navigate('/interventions');
    },
    onError: (err) => toast.error("Échec de l'enregistrement", errorMessage(err)),
  });

  const err = (k: keyof IForm) => errors[k]?.message as string | undefined;

  return (
    <div>
      <PageHeader
        title="Nouvelle intervention"
        subtitle="Enregistrez une intervention technique sur un copieur."
        actions={
          <button onClick={() => navigate('/interventions')} className="btn btn-secondary d-flex align-items-center gap-2">
            <ArrowLeft size={15} /> Retour
          </button>
        }
      />

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit((f) => create.mutate(f as IForm))} noValidate>
            <FormSection title="Identification" icon={<ClipboardList size={13} />}>
              <div className="row g-3">
                <div className="col-md-4">
                  <Field label="Client" required error={err('clientId')}>
                    <select className="form-select" {...register('clientId')}>
                      <option value="">Sélectionner un client…</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.nomClient}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="col-md-4">
                  <Field label="Copieur" required error={err('copieurId')}>
                    <select className="form-select" {...register('copieurId')} disabled={!selectedClientId}>
                      <option value="">Sélectionner un copieur…</option>
                      {copieursClient.map((c) => <option key={c.id} value={c.id}>{c.designation} — {c.numeroSerie}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="col-md-4">
                  <Field label="Technicien" required error={err('technicienId')}>
                    <select className="form-select" {...register('technicienId')} disabled={!canSelectTechnicien}>
                      <option value="">Sélectionner un technicien…</option>
                      {techniciens.filter((t) => t.estActif).map((t) => <option key={t.id} value={t.id}>{t.nomComplet}</option>)}
                    </select>
                    {!canSelectTechnicien && (
                      <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>Assigné automatiquement à votre compte.</div>
                    )}
                  </Field>
                </div>
                <div className="col-md-4">
                  <Field label="Date d'intervention" required error={err('dateIntervention')}>
                    <input type="date" className="form-control" {...register('dateIntervention')} />
                  </Field>
                </div>
                <div className="col-md-4">
                  <Field label="Heure d'arrivée">
                    <input type="time" className="form-control" {...register('heureArrivee')} />
                  </Field>
                </div>
                <div className="col-md-4">
                  <Field label="Heure de départ">
                    <input type="time" className="form-control" {...register('heureDepart')} />
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field label="Nature" required>
                    <select className="form-select" {...register('nature')}>
                      {(Object.keys(NATURE) as NatureIntervention[]).map((k) => (
                        <option key={k} value={k}>{NATURE[k].label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field label="Statut" required>
                    <select className="form-select" {...register('statut')}>
                      <option value="Ouverte">Ouverte</option>
                      <option value="EnCours">En cours</option>
                      <option value="Resolue">Résolue</option>
                      <option value="Fermee">Fermée</option>
                    </select>
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection title="Relevés compteurs" icon={<BookOpen size={13} />}>
              <div className="row g-3">
                <div className="col-sm-6 col-md-3">
                  <Field label="Compteur NB précédent" required error={err('compteurNBPrecedent')}>
                    <input type="number" min="0" className="form-control" {...register('compteurNBPrecedent')} />
                  </Field>
                </div>
                <div className="col-sm-6 col-md-3">
                  <Field label="Compteur NB actuel" required error={err('compteurNBActuel')}>
                    <input type="number" min="0" className="form-control" {...register('compteurNBActuel')} />
                  </Field>
                </div>
                <div className="col-sm-6 col-md-3">
                  <Field label="Compteur couleur précédent" required error={err('compteurCouleurPrecedent')}>
                    <input type="number" min="0" className="form-control" {...register('compteurCouleurPrecedent')} />
                  </Field>
                </div>
                <div className="col-sm-6 col-md-3">
                  <Field label="Compteur couleur actuel" required error={err('compteurCouleurActuel')}>
                    <input type="number" min="0" className="form-control" {...register('compteurCouleurActuel')} />
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection title="Description" icon={<AlignLeft size={13} />}>
              <div className="row g-3">
                <div className="col-12">
                  <Field label="Description du problème" required error={err('descriptionProbleme')}>
                    <textarea rows={3} className="form-control" style={{ resize: 'none' }} {...register('descriptionProbleme')} />
                  </Field>
                </div>
                <div className="col-12">
                  <Field label="Actions réalisées" required error={err('actionsRealisees')}>
                    <textarea rows={3} className="form-control" style={{ resize: 'none' }} {...register('actionsRealisees')} />
                  </Field>
                </div>
                <div className="col-12">
                  <Field label="Pièces remplacées">
                    <textarea rows={2} className="form-control" style={{ resize: 'none' }} {...register('piecesRemplacees')} />
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection title="Observations" icon={<MessageSquare size={13} />}>
              <div className="row g-3">
                <div className="col-md-6">
                  <Field label="Observation technicien">
                    <textarea rows={2} className="form-control" style={{ resize: 'none' }} {...register('observationTechnicien')} />
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field label="Observation client">
                    <textarea rows={2} className="form-control" style={{ resize: 'none' }} {...register('observationClient')} />
                  </Field>
                </div>
              </div>
            </FormSection>

            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
              <button type="button" onClick={() => navigate('/interventions')} className="btn btn-secondary">
                Annuler
              </button>
              <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={create.isPending}>
                {create.isPending && <Spinner size={15} />} Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
