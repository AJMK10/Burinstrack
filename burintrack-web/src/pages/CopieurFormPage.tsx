import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CalendarClock, ClipboardList, Cpu } from 'lucide-react';
import api from '../lib/api';
import type { Client, Copieur, StatutContrat, StatutCopieur } from '../types';
import { useAuthStore } from '../store/authStore';
import { errorMessage, SITUATION_COPIEUR, STATUT_CONTRAT } from '../lib/format';
import { Field, FormSection, PageHeader, Spinner } from '../components/ui';
import { toast } from '../store/toastStore';

const MARQUES = ['Xerox', 'Canon', 'HP', 'Ricoh', 'Konica Minolta', 'Sharp', 'Kyocera', 'Brother', 'Epson'];

const schema = z
  .object({
    clientId:         z.string().min(1, 'Sélectionnez un client'),
    marque:           z.string().trim().min(1, 'Requis'),
    modele:           z.string().trim().min(1, 'Requis'),
    designation:      z.string().trim().optional(),
    numeroSerie:      z.string().trim().min(1, 'Requis'),
    dateDebutContrat: z.string().min(1, 'Requis'),
    dateFinContrat:   z.string().min(1, 'Requis'),
    statutContrat:    z.enum(['Actif', 'Expire', 'Suspendu', 'Resilie']),
    situation:        z.enum(['Actif', 'EnMaintenance', 'Remplace', 'HorsService']),
    adresseIP:        z.string().trim().optional(),
    localisation:     z.string().trim().optional(),
    notesTechniques:  z.string().trim().optional(),
  })
  .refine((v) => !v.dateDebutContrat || !v.dateFinContrat || v.dateFinContrat >= v.dateDebutContrat, {
    path: ['dateFinContrat'],
    message: 'Doit être postérieure au début',
  });
type Form = z.infer<typeof schema>;

const today = () => new Date().toISOString().slice(0, 10);
const plusYears = (n: number) => { const d = new Date(); d.setFullYear(d.getFullYear() + n); return d.toISOString().slice(0, 10); };

const EMPTY: Form = {
  clientId: '', marque: '', modele: '', designation: '', numeroSerie: '',
  dateDebutContrat: today(), dateFinContrat: plusYears(3),
  statutContrat: 'Actif', situation: 'Actif',
  adresseIP: '', localisation: '', notesTechniques: '',
};

export default function CopieurFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useAuthStore((s) => s.hasRole);
  const isEdit = !!id;

  const { data: copieurs = [] } = useQuery<Copieur[]>({
    queryKey: ['copieurs', 'all'],
    queryFn: () => api.get('/copieurs').then((r) => r.data),
    enabled: isEdit,
    staleTime: 5 * 60 * 1000,
  });
  const copieur = isEdit ? copieurs.find((c) => c.id === id) : undefined;

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients', ''],
    queryFn: () => api.get('/clients').then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { ...EMPTY, dateDebutContrat: today(), dateFinContrat: plusYears(3) },
  });

  useEffect(() => {
    if (copieur) {
      reset({
        clientId: copieur.clientId, marque: copieur.marque, modele: copieur.modele,
        designation: copieur.designation, numeroSerie: copieur.numeroSerie,
        dateDebutContrat: copieur.dateDebutContrat.slice(0, 10),
        dateFinContrat: copieur.dateFinContrat.slice(0, 10),
        statutContrat: copieur.statutContrat, situation: copieur.situation,
        adresseIP: copieur.adresseIP ?? '', localisation: copieur.localisation ?? '',
        notesTechniques: copieur.notesTechniques ?? '',
      });
    }
  }, [copieur, reset]);

  const save = useMutation<unknown, Error, Form>({
    mutationFn: (f) => {
      const dates = { dateDebutContrat: `${f.dateDebutContrat}T00:00:00Z`, dateFinContrat: `${f.dateFinContrat}T00:00:00Z` };
      const designation = f.designation || `${f.marque} ${f.modele}`;
      const common = { marque: f.marque, modele: f.modele, designation, ...dates, adresseIP: f.adresseIP || null, localisation: f.localisation || null, notesTechniques: f.notesTechniques || null };
      return isEdit
        ? api.put(`/copieurs/${id}`, { ...common, statutContrat: f.statutContrat, situation: f.situation })
        : api.post('/copieurs', { ...common, clientId: f.clientId, numeroSerie: f.numeroSerie });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['copieurs'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(isEdit ? 'Copieur mis à jour' : 'Copieur ajouté au parc');
      navigate('/copieurs');
    },
    onError: (err) => toast.error("Échec de l'enregistrement", errorMessage(err)),
  });

  const err = (k: keyof Form) => errors[k]?.message as string | undefined;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Modifier le copieur' : 'Nouveau copieur'}
        subtitle={isEdit ? (copieur?.numeroSerie ?? '…') : 'Ajoutez une machine au parc sous contrat.'}
        actions={
          <button onClick={() => navigate('/copieurs')} className="btn btn-secondary d-flex align-items-center gap-2">
            <ArrowLeft size={15} /> Retour
          </button>
        }
      />

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit((f) => save.mutate(f))} noValidate>
            <FormSection title="Identification" icon={<ClipboardList size={13} />}>
              <Field label="Client" required error={err('clientId')} className="mb-3">
                <select className="form-select" disabled={isEdit} {...register('clientId')}>
                  <option value="">Sélectionner un client…</option>
                  {(isEdit && !clients.length && copieur
                    ? [{ id: copieur.clientId, nomClient: copieur.nomClient } as Client]
                    : clients
                  ).map((c) => (
                    <option key={c.id} value={c.id}>{c.nomClient}</option>
                  ))}
                </select>
              </Field>
              <div className="row g-3">
                <div className="col-sm-6">
                  <Field label="Marque" required error={err('marque')}>
                    <input className="form-control" list="marques-list" {...register('marque')} />
                    <datalist id="marques-list">{MARQUES.map((m) => <option key={m} value={m} />)}</datalist>
                  </Field>
                </div>
                <div className="col-sm-6">
                  <Field label="Modèle" required error={err('modele')}>
                    <input className="form-control" {...register('modele')} />
                  </Field>
                </div>
                <div className="col-sm-6">
                  <Field label="Désignation" hint="Laissez vide pour « Marque Modèle »">
                    <input className="form-control" {...register('designation')} />
                  </Field>
                </div>
                <div className="col-sm-6">
                  <Field label="N° de série" required error={err('numeroSerie')} hint={isEdit ? 'Non modifiable' : undefined}>
                    <input className="form-control font-mono" disabled={isEdit} {...register('numeroSerie')} />
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection title="Contrat" icon={<CalendarClock size={13} />}>
              <div className="row g-3">
                <div className="col-sm-6">
                  <Field label="Début du contrat" required error={err('dateDebutContrat')}>
                    <input type="date" className="form-control" {...register('dateDebutContrat')} />
                  </Field>
                </div>
                <div className="col-sm-6">
                  <Field label="Fin du contrat" required error={err('dateFinContrat')}>
                    <input type="date" className="form-control" {...register('dateFinContrat')} />
                  </Field>
                </div>
                {isEdit && (
                  <>
                    <div className="col-sm-6">
                      <Field label="Statut du contrat">
                        <select className="form-select" {...register('statutContrat')}>
                          {(Object.keys(STATUT_CONTRAT) as StatutContrat[]).map((k) => (
                            <option key={k} value={k}>{STATUT_CONTRAT[k].label.replace('Contrat ', '')}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <div className="col-sm-6">
                      <Field label="Situation de la machine">
                        <select className="form-select" {...register('situation')}>
                          {(Object.keys(SITUATION_COPIEUR) as StatutCopieur[]).map((k) => (
                            <option key={k} value={k}>{SITUATION_COPIEUR[k].label}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </>
                )}
              </div>
            </FormSection>

            <FormSection title="Informations techniques" icon={<Cpu size={13} />}>
              <div className="row g-3">
                <div className="col-sm-6">
                  <Field label="Adresse IP">
                    <input className="form-control font-mono" placeholder="192.168.1.20" {...register('adresseIP')} />
                  </Field>
                </div>
                <div className="col-sm-6">
                  <Field label="Emplacement">
                    <input className="form-control" placeholder="Open space, 2e étage…" {...register('localisation')} />
                  </Field>
                </div>
                <div className="col-12">
                  <Field label="Notes techniques">
                    <textarea rows={3} className="form-control" style={{ resize: 'none' }} {...register('notesTechniques')} />
                  </Field>
                </div>
              </div>
            </FormSection>

            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
              <button type="button" onClick={() => navigate('/copieurs')} className="btn btn-secondary">
                Annuler
              </button>
              <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={save.isPending}>
                {save.isPending && <Spinner size={15} />} Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
