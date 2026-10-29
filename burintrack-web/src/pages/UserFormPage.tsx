import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Shield, UsersRound } from 'lucide-react';
import api from '../lib/api';
import type { AppUser } from '../types';
import { errorMessage } from '../lib/format';
import { Field, FormSection, PageHeader, Spinner } from '../components/ui';
import { toast } from '../store/toastStore';
import type { Tone } from '../lib/format';

const ROLE_CFG: Record<string, { label: string; tone: Tone }> = {
  Administrateur: { label: 'Administrateur',  tone: 'rose'    },
  ResponsableSAV: { label: 'Responsable SAV', tone: 'brand'   },
  Technicien:     { label: 'Technicien',       tone: 'emerald' },
  Consultation:   { label: 'Consultation',     tone: 'slate'   },
};

const ROLES = ['Administrateur', 'ResponsableSAV', 'Technicien', 'Consultation'] as const;

const createSchema = z.object({
  nom:        z.string().trim().min(1, 'Requis'),
  prenom:     z.string().trim().min(1, 'Requis'),
  email:      z.string().trim().email('Email invalide'),
  telephone:  z.string().trim().min(1, 'Requis'),
  motDePasse: z.string().min(12, 'Minimum 12 caractères'),
  role:       z.enum(['Administrateur', 'ResponsableSAV', 'Technicien', 'Consultation']),
});
type CreateForm = z.infer<typeof createSchema>;

const editSchema = z.object({
  nomComplet: z.string().trim().min(1, 'Requis'),
  email:      z.string().trim().email('Email invalide'),
  role:       z.enum(['Administrateur', 'ResponsableSAV', 'Technicien', 'Consultation']),
});
type EditForm = z.infer<typeof editSchema>;

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: users = [] } = useQuery<AppUser[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: isEdit,
    staleTime: 5 * 60 * 1000,
  });
  const user = isEdit ? users.find((u) => u.id === id) : undefined;

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { nom: '', prenom: '', email: '', telephone: '', motDePasse: '', role: 'Technicien' },
  });

  const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (user) {
      editForm.reset({ nomComplet: user.nomComplet, email: user.email, role: user.role as EditForm['role'] });
    }
  }, [user, editForm]);

  const createMut = useMutation({
    mutationFn: (f: CreateForm) =>
      api.post('/auth/users', { nom: f.nom, prenom: f.prenom, email: f.email, telephone: f.telephone, motDePasse: f.motDePasse, role: f.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur créé', 'Le compte a été créé avec succès.');
      navigate('/utilisateurs');
    },
    onError: (err) => toast.error('Erreur', errorMessage(err)),
  });

  const editMut = useMutation({
    mutationFn: (f: EditForm) => api.put(`/users/${id}`, f),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur mis à jour');
      navigate('/utilisateurs');
    },
    onError: (err) => toast.error('Erreur', errorMessage(err)),
  });

  const errC = (k: keyof CreateForm) => createForm.formState.errors[k]?.message;
  const errE = (k: keyof EditForm) => editForm.formState.errors[k]?.message;

  return (
    <div>
      <PageHeader
        title={isEdit ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
        subtitle={isEdit ? (user?.email ?? '…') : 'Créez un compte pour un technicien, responsable ou administrateur.'}
        actions={
          <button onClick={() => navigate('/utilisateurs')} className="btn btn-secondary d-flex align-items-center gap-2">
            <ArrowLeft size={15} /> Retour
          </button>
        }
      />

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {isEdit ? (
            <form onSubmit={editForm.handleSubmit((f) => editMut.mutate(f))} noValidate>
              <FormSection title="Compte" icon={<UsersRound size={13} />}>
                <div className="row g-3">
                  <div className="col-12">
                    <Field label="Nom complet" required error={errE('nomComplet')}>
                      <input className="form-control" {...editForm.register('nomComplet')} />
                    </Field>
                  </div>
                  <div className="col-sm-6">
                    <Field label="Email" required error={errE('email')}>
                      <input type="email" className="form-control" {...editForm.register('email')} />
                    </Field>
                  </div>
                  <div className="col-sm-6">
                    <Field label="Rôle" required error={errE('role')}>
                      <select className="form-select" {...editForm.register('role')}>
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_CFG[r]?.label ?? r}</option>)}
                      </select>
                    </Field>
                  </div>
                </div>
              </FormSection>

              <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                <button type="button" onClick={() => navigate('/utilisateurs')} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={editMut.isPending}>
                  {editMut.isPending && <Spinner size={15} />} Enregistrer
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={createForm.handleSubmit((f) => createMut.mutate(f))} noValidate>
              <FormSection title="Identité" icon={<UsersRound size={13} />}>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <Field label="Prénom" required error={errC('prenom')}>
                      <input className="form-control" {...createForm.register('prenom')} />
                    </Field>
                  </div>
                  <div className="col-sm-6">
                    <Field label="Nom" required error={errC('nom')}>
                      <input className="form-control" {...createForm.register('nom')} />
                    </Field>
                  </div>
                  <div className="col-sm-6">
                    <Field label="Email" required error={errC('email')}>
                      <input type="email" className="form-control" {...createForm.register('email')} />
                    </Field>
                  </div>
                  <div className="col-sm-6">
                    <Field label="Téléphone" required error={errC('telephone')}>
                      <input className="form-control" {...createForm.register('telephone')} />
                    </Field>
                  </div>
                  <div className="col-sm-6">
                    <Field label="Rôle" required>
                      <select className="form-select" {...createForm.register('role')}>
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_CFG[r]?.label ?? r}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="col-sm-6">
                    <Field label="Mot de passe" required error={errC('motDePasse')} hint="Minimum 12 caractères">
                      <input type="password" className="form-control" {...createForm.register('motDePasse')} />
                    </Field>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Sécurité" icon={<Shield size={13} />}>
                <div className="rounded-3 p-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <p className="mb-0" style={{ fontSize: '0.82rem', color: '#166534' }}>
                    Le mot de passe doit contenir <strong>au moins 12 caractères</strong>, une majuscule, une minuscule, un chiffre et un caractère spécial (ex: <code>Technicien@2026!</code>). Communiquez-le de manière sécurisée.
                  </p>
                </div>
              </FormSection>

              <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                <button type="button" onClick={() => navigate('/utilisateurs')} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={createMut.isPending}>
                  {createMut.isPending && <Spinner size={15} />} Créer le compte
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
