import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, UserCog } from 'lucide-react';
import api from '../lib/api';
import { errorMessage } from '../lib/format';
import { Field, FormSection, PageHeader, Spinner } from '../components/ui';
import { toast } from '../store/toastStore';

const techSchema = z.object({
  nom:       z.string().trim().min(1, 'Requis'),
  prenom:    z.string().trim().min(1, 'Requis'),
  telephone: z.string().trim().min(1, 'Requis'),
  email:     z.string().trim().min(1, 'Requis').email('E-mail invalide'),
});
type TechForm = z.infer<typeof techSchema>;

const EMPTY: TechForm = { nom: '', prenom: '', telephone: '', email: '' };

export default function TechnicienFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<TechForm>({
    resolver: zodResolver(techSchema),
    defaultValues: EMPTY,
  });

  const create = useMutation({
    mutationFn: (f: TechForm) => api.post('/techniciens', f),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['techniciens'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Technicien créé', 'Le technicien a été ajouté avec succès.');
      navigate('/techniciens');
    },
    onError: (err) => toast.error("Échec de l'enregistrement", errorMessage(err)),
  });

  const err = (k: keyof TechForm) => errors[k]?.message as string | undefined;

  return (
    <div>
      <PageHeader
        title="Nouveau technicien"
        subtitle="Renseignez les informations du technicien SAV."
        actions={
          <button onClick={() => navigate('/techniciens')} className="btn btn-secondary d-flex align-items-center gap-2">
            <ArrowLeft size={15} /> Retour
          </button>
        }
      />

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit((f) => create.mutate(f))} noValidate>
            <FormSection title="Informations" icon={<UserCog size={13} />}>
              <div className="row g-3">
                <div className="col-sm-6">
                  <Field label="Prénom" required error={err('prenom')}>
                    <input className="form-control" autoComplete="given-name" {...register('prenom')} />
                  </Field>
                </div>
                <div className="col-sm-6">
                  <Field label="Nom" required error={err('nom')}>
                    <input className="form-control" autoComplete="family-name" {...register('nom')} />
                  </Field>
                </div>
                <div className="col-sm-6">
                  <Field label="Téléphone" required error={err('telephone')}>
                    <input className="form-control" type="tel" {...register('telephone')} />
                  </Field>
                </div>
                <div className="col-sm-6">
                  <Field label="E-mail" required error={err('email')}>
                    <input className="form-control" type="email" {...register('email')} />
                  </Field>
                </div>
              </div>
            </FormSection>

            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
              <button type="button" onClick={() => navigate('/techniciens')} className="btn btn-secondary">
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
