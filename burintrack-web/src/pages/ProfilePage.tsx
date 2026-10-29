import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, User } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { errorMessage } from '../lib/format';
import { Avatar, Badge, ErrorState, Field, PageHeader, Spinner } from '../components/ui';
import { toast } from '../store/toastStore';
import type { Tone } from '../lib/format';

const ROLE_CFG: Record<string, { label: string; tone: Tone }> = {
  Administrateur: { label: 'Administrateur',  tone: 'rose'    },
  ResponsableSAV: { label: 'Responsable SAV', tone: 'brand'   },
  Technicien:     { label: 'Technicien',       tone: 'emerald' },
  Consultation:   { label: 'Consultation',     tone: 'slate'   },
};

const profileSchema = z.object({
  nomComplet: z.string().trim().min(1, 'Requis'),
  email: z.string().trim().email('Email invalide'),
});
type ProfileForm = z.infer<typeof profileSchema>;

const pwdSchema = z.object({
  ancienMotDePasse:  z.string().min(1, 'Requis'),
  nouveauMotDePasse: z.string().min(12, 'Minimum 12 caractères'),
  confirmation:      z.string(),
}).refine((d) => d.nouveauMotDePasse === d.confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmation'],
});
type PwdForm = z.infer<typeof pwdSchema>;

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const storeUser = useAuthStore((s) => s.user);

  const { data: profile, isError } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
  });

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const pwdForm = useForm<PwdForm>({ resolver: zodResolver(pwdSchema) });

  useEffect(() => {
    if (profile) {
      profileForm.reset({ nomComplet: profile.nomComplet, email: profile.email });
    }
  }, [profile]);

  const profileMut = useMutation({
    mutationFn: (f: ProfileForm) => api.put('/users/me', f),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      toast.success('Profil mis à jour');
    },
    onError: (err) => toast.error('Erreur', errorMessage(err)),
  });

  const pwdMut = useMutation({
    mutationFn: (f: PwdForm) =>
      api.put('/users/me/password', { ancienMotDePasse: f.ancienMotDePasse, nouveauMotDePasse: f.nouveauMotDePasse }),
    onSuccess: () => {
      toast.success('Mot de passe changé', 'Votre mot de passe a été mis à jour.');
      pwdForm.reset();
    },
    onError: (err) => toast.error('Échec', errorMessage(err)),
  });

  const errP = (k: keyof ProfileForm) => profileForm.formState.errors[k]?.message;
  const errW = (k: keyof PwdForm) => pwdForm.formState.errors[k]?.message;

  if (isError) return <ErrorState />;

  const displayName = profile?.nomComplet || storeUser?.nomComplet || storeUser?.email || '';
  const role = profile?.roles?.[0] ?? storeUser?.roles?.[0] ?? '';
  const roleCfg = ROLE_CFG[role] ?? { label: role, tone: 'slate' as Tone };

  return (
    <div>
      <PageHeader title="Mon profil" subtitle="Gérez vos informations personnelles et votre sécurité." />

      <div className="row g-4">
        {/* Left — identity card */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm text-center p-4">
            <div className="d-flex justify-content-center mb-3">
              <Avatar name={displayName} size={80} rounded="rounded-circle" />
            </div>
            <div className="fw-bold mb-1" style={{ fontSize: '1.05rem', color: '#343a40' }}>
              {displayName || '—'}
            </div>
            <div className="text-muted mb-3" style={{ fontSize: '0.82rem' }}>
              {profile?.email || storeUser?.email}
            </div>
            {role && (
              <div className="d-flex justify-content-center">
                <Badge tone={roleCfg.tone}>{roleCfg.label}</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Right — forms */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header d-flex align-items-center gap-2">
              <User size={16} className="text-brand" />
              Informations personnelles
            </div>
            <div className="card-body">
              <form onSubmit={profileForm.handleSubmit((f) => profileMut.mutate(f))} noValidate>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <Field label="Nom complet" required error={errP('nomComplet')}>
                      <input className="form-control" {...profileForm.register('nomComplet')} />
                    </Field>
                  </div>
                  <div className="col-sm-6">
                    <Field label="Email" required error={errP('email')}>
                      <input type="email" className="form-control" {...profileForm.register('email')} />
                    </Field>
                  </div>
                </div>
                <div className="d-flex justify-content-end mt-2">
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={profileMut.isPending}>
                    {profileMut.isPending && <Spinner size={14} />} Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header d-flex align-items-center gap-2">
              <KeyRound size={16} className="text-brand" />
              Changer le mot de passe
            </div>
            <div className="card-body">
              <form onSubmit={pwdForm.handleSubmit((f) => pwdMut.mutate(f))} noValidate>
                <div className="row g-3">
                  <div className="col-12">
                    <Field label="Mot de passe actuel" required error={errW('ancienMotDePasse')}>
                      <input type="password" className="form-control" {...pwdForm.register('ancienMotDePasse')} />
                    </Field>
                  </div>
                  <div className="col-sm-6">
                    <Field label="Nouveau mot de passe" required error={errW('nouveauMotDePasse')} hint="Minimum 12 caractères">
                      <input type="password" className="form-control" {...pwdForm.register('nouveauMotDePasse')} />
                    </Field>
                  </div>
                  <div className="col-sm-6">
                    <Field label="Confirmer" required error={errW('confirmation')}>
                      <input type="password" className="form-control" {...pwdForm.register('confirmation')} />
                    </Field>
                  </div>
                </div>
                <div className="d-flex justify-content-end mt-2">
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={pwdMut.isPending}>
                    {pwdMut.isPending && <Spinner size={14} />} Changer le mot de passe
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
