import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Pencil, Plus, PowerOff, Shield, ShieldCheck, Users } from 'lucide-react';
import api from '../lib/api';
import type { AppUser } from '../types';
import { useAuthStore } from '../store/authStore';
import { errorMessage } from '../lib/format';
import {
  Avatar, Badge, EmptyState, ErrorState, Field, Modal, PageHeader, SearchInput, Spinner,
} from '../components/ui';
import { toast } from '../store/toastStore';
import type { Tone } from '../lib/format';

const ROLE_CFG: Record<string, { label: string; tone: Tone }> = {
  Administrateur: { label: 'Administrateur',  tone: 'rose'    },
  ResponsableSAV: { label: 'Responsable SAV', tone: 'brand'   },
  Technicien:     { label: 'Technicien',       tone: 'emerald' },
  Consultation:   { label: 'Consultation',     tone: 'slate'   },
};

const resetSchema = z.object({
  nouveauMotDePasse: z.string().min(12, 'Minimum 12 caractères'),
});
type ResetForm = z.infer<typeof resetSchema>;

export default function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [resetTarget, setResetTarget] = useState<AppUser | null>(null);

  const { data: users = [], isLoading, isError, refetch } = useQuery<AppUser[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const filtered = users.filter((u) =>
    !search ||
    u.nomComplet.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()),
  );

  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });
  const openReset = (u: AppUser) => { setResetTarget(u); resetForm.reset(); };
  const resetMut = useMutation({
    mutationFn: (f: ResetForm) => api.put(`/users/${resetTarget!.id}/reset-password`, { nouveauMotDePasse: f.nouveauMotDePasse }),
    onSuccess: () => { toast.success('Mot de passe réinitialisé'); setResetTarget(null); },
    onError: (err) => toast.error('Erreur', errorMessage(err)),
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => api.put(`/users/${id}/toggle`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Statut mis à jour'); },
    onError: (err) => toast.error('Erreur', errorMessage(err)),
  });

  const errR = (k: keyof ResetForm) => resetForm.formState.errors[k]?.message;

  return (
    <div>
      <PageHeader
        title="Gestion des utilisateurs"
        subtitle={`${filtered.length} compte${filtered.length > 1 ? 's' : ''} · ${users.filter((u) => !u.isLocked).length} actif${users.filter((u) => !u.isLocked).length > 1 ? 's' : ''}`}
        actions={
          <button onClick={() => navigate('/utilisateurs/nouveau')} className="btn btn-primary d-flex align-items-center gap-2">
            <Plus size={15} /> Nouvel utilisateur
          </button>
        }
      />

      <div className="d-flex flex-wrap gap-2 mb-3">
        <div className="flex-grow-1" style={{ minWidth: '16rem' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Nom, email, rôle…" />
        </div>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={24} />} title="Aucun utilisateur" text="Créez le premier compte utilisateur." />
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const cfg = ROLE_CFG[u.role] ?? { label: u.role, tone: 'slate' as Tone };
                  const isMe = u.id === currentUser?.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={u.nomComplet || u.email} size={36} rounded="rounded-circle" />
                          <div className="fw-semibold" style={{ fontSize: '0.85rem', color: '#343a40' }}>
                            {u.nomComplet || '—'}
                            {isMe && <span className="ms-2 badge badge-brand" style={{ fontSize: '0.65rem' }}>Moi</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#6c757d' }}>{u.email}</td>
                      <td><Badge tone={cfg.tone}>{cfg.label}</Badge></td>
                      <td>
                        <Badge tone={u.isLocked ? 'rose' : 'emerald'} dot>
                          {u.isLocked ? 'Bloqué' : 'Actif'}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          <button className="btn-icon" title="Modifier" onClick={() => navigate(`/utilisateurs/${u.id}/modifier`)}>
                            <Pencil size={14} />
                          </button>
                          <button className="btn-icon" title="Réinitialiser le mot de passe" onClick={() => openReset(u)}>
                            <KeyRound size={14} />
                          </button>
                          {!isMe && (
                            <button
                              className="btn-icon"
                              title={u.isLocked ? 'Réactiver' : 'Désactiver'}
                              onClick={() => toggleMut.mutate(u.id)}
                              style={{ color: u.isLocked ? '#10b981' : '#ef4444' }}
                            >
                              {u.isLocked ? <ShieldCheck size={14} /> : <PowerOff size={14} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- Reset password modal ---- */}
      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="Réinitialiser le mot de passe"
        subtitle={resetTarget?.nomComplet || resetTarget?.email}
        size="md"
        footer={
          <>
            <button type="button" onClick={() => setResetTarget(null)} className="btn btn-secondary">Annuler</button>
            <button type="submit" form="reset-pwd-form" className="btn btn-danger d-flex align-items-center gap-2" disabled={resetMut.isPending}>
              {resetMut.isPending && <Spinner size={15} />} Réinitialiser
            </button>
          </>
        }
      >
        <form id="reset-pwd-form" onSubmit={resetForm.handleSubmit((f) => resetMut.mutate(f))} noValidate>
          <div className="rounded-3 p-3 mb-3" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
            <p className="mb-0" style={{ fontSize: '0.82rem', color: '#92400e' }}>
              <Shield size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Le mot de passe actuel sera remplacé immédiatement. Communiquez-le à l'utilisateur de manière sécurisée.
            </p>
          </div>
          <Field label="Nouveau mot de passe" required error={errR('nouveauMotDePasse')} hint="Minimum 12 caractères">
            <input type="password" className="form-control" {...resetForm.register('nouveauMotDePasse')} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
