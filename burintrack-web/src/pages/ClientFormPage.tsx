import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, MapPin, Phone, Receipt, User } from 'lucide-react';
import api from '../lib/api';
import type { Client } from '../types';
import { useAuthStore } from '../store/authStore';
import { errorMessage } from '../lib/format';
import { Field, FormSection, PageHeader, Spinner } from '../components/ui';
import { toast } from '../store/toastStore';

const coord = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v.replace(',', '.'))), 'Nombre invalide');

const clientSchema = z.object({
  nomClient:          z.string().trim().min(1, 'Requis'),
  raisonSociale:      z.string().trim().optional(),
  numeroContrat:      z.string().trim().min(1, 'Requis'),
  secteurActivite:    z.string().trim().optional(),
  adresse:            z.string().trim().min(1, 'Requis'),
  ville:              z.string().trim().min(1, 'Requis'),
  commune:            z.string().trim().optional(),
  pays:               z.string().trim().min(1, 'Requis'),
  latitude:           coord,
  longitude:          coord,
  nomContact:         z.string().trim().min(1, 'Requis'),
  fonctionContact:    z.string().trim().optional(),
  telephone:          z.string().trim().min(1, 'Requis'),
  email:              z.string().trim().min(1, 'Requis').email('E-mail invalide'),
  estActif:           z.boolean(),
  typeFacturation:    z.enum(['Aucune', 'Forfait'] as const),
  forfaitMensuelHT:   z.number().min(0, 'Doit être ≥ 0'),
  forfaitCopieMono:   z.number().min(0, 'Doit être ≥ 0'),
  forfaitCopieCouleur:z.number().min(0, 'Doit être ≥ 0'),
  prixCopieSupMono:   z.number().min(0, 'Doit être ≥ 0'),
  prixCopieSupCouleur:z.number().min(0, 'Doit être ≥ 0'),
  tauxTVA:            z.number().min(0).max(100),
});
type ClientForm = z.infer<typeof clientSchema>;

const EMPTY: ClientForm = {
  nomClient: '', raisonSociale: '', numeroContrat: '', secteurActivite: '',
  adresse: '', ville: '', commune: '', pays: "Côte d'Ivoire",
  latitude: '', longitude: '', nomContact: '', fonctionContact: '',
  telephone: '', email: '', estActif: true,
  typeFacturation: 'Aucune' as const,
  forfaitMensuelHT: 0, forfaitCopieMono: 0, forfaitCopieCouleur: 0,
  prixCopieSupMono: 0, prixCopieSupCouleur: 0, tauxTVA: 18,
};

const toNum = (v?: string) => (v && v.trim() !== '' ? Number(v.replace(',', '.')) : null);

export default function ClientFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useAuthStore((s) => s.hasRole);
  const isEdit = !!id;

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients', ''],
    queryFn: () => api.get('/clients').then((r) => r.data),
    enabled: isEdit,
    staleTime: 5 * 60 * 1000,
  });
  const client = isEdit ? clients.find((c) => c.id === id) : undefined;

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (client) {
      reset({
        nomClient: client.nomClient, raisonSociale: client.raisonSociale,
        numeroContrat: client.numeroContrat, secteurActivite: client.secteurActivite,
        adresse: client.adresse, ville: client.ville, commune: client.commune, pays: client.pays,
        latitude: client.latitude?.toString() ?? '', longitude: client.longitude?.toString() ?? '',
        nomContact: client.nomContact, fonctionContact: client.fonctionContact,
        telephone: client.telephone, email: client.email, estActif: client.estActif,
        typeFacturation: client.typeFacturation,
        forfaitMensuelHT: client.forfaitMensuelHT, forfaitCopieMono: client.forfaitCopieMono,
        forfaitCopieCouleur: client.forfaitCopieCouleur, prixCopieSupMono: client.prixCopieSupMono,
        prixCopieSupCouleur: client.prixCopieSupCouleur, tauxTVA: client.tauxTVA,
      });
    }
  }, [client, reset]);

  const save = useMutation<unknown, Error, ClientForm>({
    mutationFn: (f) => {
      const base = {
        nomClient: f.nomClient, raisonSociale: f.raisonSociale || f.nomClient,
        secteurActivite: f.secteurActivite ?? '', adresse: f.adresse,
        ville: f.ville, commune: f.commune ?? '', pays: f.pays,
        latitude: toNum(f.latitude), longitude: toNum(f.longitude),
        nomContact: f.nomContact, fonctionContact: f.fonctionContact ?? '',
        telephone: f.telephone, email: f.email,
        typeFacturation: f.typeFacturation,
        forfaitMensuelHT: f.forfaitMensuelHT, forfaitCopieMono: f.forfaitCopieMono,
        forfaitCopieCouleur: f.forfaitCopieCouleur, prixCopieSupMono: f.prixCopieSupMono,
        prixCopieSupCouleur: f.prixCopieSupCouleur, tauxTVA: f.tauxTVA,
      };
      return isEdit
        ? api.put(`/clients/${id}`, { ...base, estActif: f.estActif })
        : api.post('/clients', { ...base, numeroContrat: f.numeroContrat });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(isEdit ? 'Client mis à jour' : 'Client créé', 'Les modifications ont été enregistrées.');
      navigate('/clients');
    },
    onError: (err) => toast.error("Échec de l'enregistrement", errorMessage(err)),
  });

  const err = (k: keyof ClientForm) => errors[k]?.message as string | undefined;
  const typeFacturation = watch('typeFacturation');

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Modifier le client' : 'Nouveau client'}
        subtitle={isEdit ? (client?.numeroContrat ?? '…') : 'Renseignez les informations du client et de son contrat.'}
        actions={
          <button onClick={() => navigate('/clients')} className="btn btn-secondary d-flex align-items-center gap-2">
            <ArrowLeft size={15} /> Retour
          </button>
        }
      />

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit((f) => save.mutate(f))} noValidate>
            <FormSection title="Identité" icon={<User size={13} />}>
              <div className="row g-3">
                <div className="col-sm-6">
                  <Field label="Nom du client" required error={err('nomClient')}>
                    <input className="form-control" {...register('nomClient')} />
                  </Field>
                </div>
                <div className="col-sm-6">
                  <Field label="Raison sociale" error={err('raisonSociale')}>
                    <input className="form-control" {...register('raisonSociale')} />
                  </Field>
                </div>
                <div className="col-sm-6">
                  <Field label="N° de contrat" required error={err('numeroContrat')} hint={isEdit ? 'Non modifiable' : undefined}>
                    <input className="form-control font-mono" disabled={isEdit} placeholder="CTR-2026-001" {...register('numeroContrat')} />
                  </Field>
                </div>
                <div className="col-sm-6">
                  <Field label="Secteur d'activité">
                    <input className="form-control" {...register('secteurActivite')} />
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection title="Localisation" icon={<MapPin size={13} />}>
              <div className="mb-3">
                <Field label="Adresse" required error={err('adresse')}>
                  <input className="form-control" {...register('adresse')} />
                </Field>
              </div>
              <div className="row g-3">
                <div className="col-sm-4">
                  <Field label="Ville" required error={err('ville')}>
                    <input className="form-control" {...register('ville')} />
                  </Field>
                </div>
                <div className="col-sm-4">
                  <Field label="Commune">
                    <input className="form-control" {...register('commune')} />
                  </Field>
                </div>
                <div className="col-sm-4">
                  <Field label="Pays" required error={err('pays')}>
                    <input className="form-control" {...register('pays')} />
                  </Field>
                </div>
                <div className="col-sm-6">
                  <Field label="Latitude" error={err('latitude')}>
                    <input className="form-control" inputMode="decimal" placeholder="5.3200" {...register('latitude')} />
                  </Field>
                </div>
                <div className="col-sm-6">
                  <Field label="Longitude" error={err('longitude')}>
                    <input className="form-control" inputMode="decimal" placeholder="-4.0200" {...register('longitude')} />
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection title="Contact principal" icon={<Phone size={13} />}>
              <div className="row g-3">
                <div className="col-sm-6">
                  <Field label="Nom du contact" required error={err('nomContact')}>
                    <input className="form-control" {...register('nomContact')} />
                  </Field>
                </div>
                <div className="col-sm-6">
                  <Field label="Fonction">
                    <input className="form-control" {...register('fonctionContact')} />
                  </Field>
                </div>
                <div className="col-sm-6">
                  <Field label="Téléphone" required error={err('telephone')}>
                    <input className="form-control" {...register('telephone')} />
                  </Field>
                </div>
                <div className="col-sm-6">
                  <Field label="E-mail" required error={err('email')}>
                    <input type="email" className="form-control" {...register('email')} />
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection title="Contrat & Tarification" icon={<Receipt size={13} />}>
              <div className="row g-3">
                <div className="col-sm-6">
                  <Field label="Système de facturation" required>
                    <select className="form-select" {...register('typeFacturation')}>
                      <option value="Aucune">Aucune — pas de facturation</option>
                      <option value="Forfait">Forfait — copies incluses + tarif supplémentaire</option>
                    </select>
                  </Field>
                </div>
              </div>

              {typeFacturation === 'Forfait' && (
                <div className="row g-3 mt-1 pt-3 border-top">
                  <div className="col-12">
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6c757d', letterSpacing: '0.04em' }}>PARAMÈTRES DU FORFAIT</div>
                  </div>
                  <div className="col-sm-4">
                    <Field label="Forfait mensuel HT (FCFA)" required error={errors.forfaitMensuelHT?.message}>
                      <input type="number" min={0} className="form-control" {...register('forfaitMensuelHT', { valueAsNumber: true })} />
                    </Field>
                  </div>
                  <div className="col-sm-4">
                    <Field label="Copies mono incluses" required error={errors.forfaitCopieMono?.message}>
                      <input type="number" min={0} className="form-control" {...register('forfaitCopieMono', { valueAsNumber: true })} />
                    </Field>
                  </div>
                  <div className="col-sm-4">
                    <Field label="Copies couleur incluses" required error={errors.forfaitCopieCouleur?.message}>
                      <input type="number" min={0} className="form-control" {...register('forfaitCopieCouleur', { valueAsNumber: true })} />
                    </Field>
                  </div>
                  <div className="col-sm-4">
                    <Field label="Prix copie sup. mono (FCFA)" required error={errors.prixCopieSupMono?.message}>
                      <input type="number" min={0} step="0.1" className="form-control" {...register('prixCopieSupMono', { valueAsNumber: true })} />
                    </Field>
                  </div>
                  <div className="col-sm-4">
                    <Field label="Prix copie sup. couleur (FCFA)" required error={errors.prixCopieSupCouleur?.message}>
                      <input type="number" min={0} step="0.1" className="form-control" {...register('prixCopieSupCouleur', { valueAsNumber: true })} />
                    </Field>
                  </div>
                  <div className="col-sm-4">
                    <Field label="Taux TVA (%)" required error={errors.tauxTVA?.message}>
                      <input type="number" min={0} max={100} step="0.5" className="form-control" {...register('tauxTVA', { valueAsNumber: true })} />
                    </Field>
                  </div>
                </div>
              )}
            </FormSection>

            {isEdit && (
              <div className="d-flex align-items-start gap-3 p-3 rounded mb-4" style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                <div className="form-check form-switch mb-0 mt-1">
                  <input className="form-check-input" type="checkbox" role="switch" id="estActif" {...register('estActif')} />
                </div>
                <label htmlFor="estActif" style={{ cursor: 'pointer', flex: 1 }}>
                  <div className="fw-semibold" style={{ fontSize: '0.875rem', color: '#343a40' }}>Client actif</div>
                  <div className="text-muted" style={{ fontSize: '0.78rem' }}>Décochez pour archiver le client sans supprimer son historique.</div>
                </label>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
              <button type="button" onClick={() => navigate('/clients')} className="btn btn-secondary">
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
