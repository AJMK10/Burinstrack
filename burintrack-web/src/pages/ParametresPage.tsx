import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bell, Building2, Mail, Save, Upload, X } from 'lucide-react';
import api from '../lib/api';
import { errorMessage } from '../lib/format';
import { Field, FormSection, PageHeader, Spinner } from '../components/ui';
import { toast } from '../store/toastStore';

interface EntrepriseSettings { nomSociete: string; nomApplication: string; adresse: string; telephone: string; email: string; siteWeb: string; logoBase64: string; imageDashboard: string; }
interface SmtpSettings { hote: string; port: number; utilisateur: string; motDePasse: string; expediteur: string; ssl: boolean; }
interface AlertesSettings { seuilJours1: number; seuilJours2: number; envoyerAutoAuDemarrage: boolean; }

const entrepriseSchema = z.object({
  nomSociete:     z.string().trim().min(1, 'Requis'),
  nomApplication: z.string().trim(),
  adresse:        z.string().trim(),
  telephone:      z.string().trim(),
  email:          z.string().trim(),
  siteWeb:        z.string().trim(),
});

const smtpSchema = z.object({
  hote:        z.string().trim(),
  port:        z.coerce.number().int().min(1).max(65535),
  utilisateur: z.string().trim(),
  motDePasse:  z.string(),
  expediteur:  z.string().trim(),
  ssl:         z.boolean(),
});

const alertesSchema = z.object({
  seuilJours1:             z.coerce.number().int().min(1).max(365),
  seuilJours2:             z.coerce.number().int().min(1).max(365),
  envoyerAutoAuDemarrage:  z.boolean(),
});

type EntrepriseForm = z.infer<typeof entrepriseSchema>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SmtpForm       = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AlertesForm    = any;

function useSaveParametre(cle: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (valeur: string) => api.put(`/parametres/${cle}`, { valeur }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parametres'] });
      toast.success('Paramètres sauvegardés', 'La configuration a été mise à jour.');
    },
    onError: (err) => toast.error('Erreur', errorMessage(err)),
  });
}

function parseOrDefault<T>(json: string | undefined, def: T): T {
  if (!json) return def;
  try { return JSON.parse(json) as T; } catch { return def; }
}

const DEF_ENTREPRISE: EntrepriseSettings = { nomSociete: 'BURINFORT', nomApplication: 'BurinTrack', adresse: '', telephone: '', email: '', siteWeb: '', logoBase64: '', imageDashboard: '' };

export default function ParametresPage() {
  const { data: parametres = [], isLoading } = useQuery<{ cle: string; valeur: string; updatedAt: string }[]>({
    queryKey: ['parametres'],
    queryFn: () => api.get('/parametres').then((r) => r.data),
  });

  const get = (cle: string) => parametres.find((p) => p.cle === cle)?.valeur;

  const saveEntreprise = useSaveParametre('entreprise');
  const saveSmtp       = useSaveParametre('smtp');
  const saveAlertes    = useSaveParametre('alertes');

  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgDashPreview, setImgDashPreview] = useState<string>('');
  const imgDashRef = useRef<HTMLInputElement>(null);

  const entrepriseForm = useForm<EntrepriseForm>({
    resolver: zodResolver(entrepriseSchema),
    defaultValues: { nomSociete: '', nomApplication: '', adresse: '', telephone: '', email: '', siteWeb: '' },
  });
  const smtpForm = useForm<SmtpForm>({
    resolver: zodResolver(smtpSchema),
    defaultValues: { hote: '', port: 587, utilisateur: '', motDePasse: '', expediteur: 'noreply@burinfort.com', ssl: true },
  });
  const alertesForm = useForm<AlertesForm>({
    resolver: zodResolver(alertesSchema),
    defaultValues: { seuilJours1: 30, seuilJours2: 60, envoyerAutoAuDemarrage: false },
  });

  useEffect(() => {
    if (!parametres.length) return;
    const e = parseOrDefault<EntrepriseSettings>(get('entreprise'), DEF_ENTREPRISE);
    entrepriseForm.reset({ nomSociete: e.nomSociete, nomApplication: e.nomApplication, adresse: e.adresse, telephone: e.telephone, email: e.email, siteWeb: e.siteWeb });
    setLogoPreview(e.logoBase64 ?? '');
    setImgDashPreview(e.imageDashboard ?? '');
    smtpForm.reset(parseOrDefault<SmtpSettings>(get('smtp'), { hote: '', port: 587, utilisateur: '', motDePasse: '', expediteur: 'noreply@burinfort.com', ssl: true }));
    alertesForm.reset(parseOrDefault<AlertesSettings>(get('alertes'), { seuilJours1: 30, seuilJours2: 60, envoyerAutoAuDemarrage: false }));
  }, [parametres]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { toast.error('Fichier trop grand', 'Le logo doit faire moins de 500 Ko.'); return; }
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImgDashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Fichier trop grand', "L'image doit faire moins de 2 Mo."); return; }
    const reader = new FileReader();
    reader.onload = () => setImgDashPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (isLoading) return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="spinner-border text-primary" />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Paramètres de l'application"
        subtitle="Configurez les options générales de BurinTrack."
      />

      <div className="row g-4">
        {/* ---- Entreprise ---- */}
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <form
                onSubmit={entrepriseForm.handleSubmit((f) =>
                  saveEntreprise.mutate(JSON.stringify({ ...f, logoBase64: logoPreview, imageDashboard: imgDashPreview }))
                )}
                noValidate
              >
                <FormSection title="Identité de l'application" icon={<Building2 size={13} />}>
                  <div className="row g-3">
                    {/* Logo */}
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Logo de l'entreprise</label>
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-2 border"
                          style={{ width: 80, height: 80, background: '#f8f9fa', overflow: 'hidden', flexShrink: 0 }}
                        >
                          {logoPreview
                            ? <img src={logoPreview} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            : <span style={{ fontSize: '0.72rem', color: '#adb5bd', textAlign: 'center', padding: '0 4px' }}>Aucun logo</span>
                          }
                        </div>
                        <div className="d-flex flex-column gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload size={13} /> Choisir un fichier
                          </button>
                          {logoPreview && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                              onClick={() => { setLogoPreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            >
                              <X size={13} /> Supprimer
                            </button>
                          )}
                          <span style={{ fontSize: '0.72rem', color: '#6c757d' }}>PNG, JPG ou SVG · max 500 Ko</span>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="d-none" onChange={handleLogoChange} />
                      </div>
                    </div>

                    {/* Image tableau de bord */}
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Image du tableau de bord</label>
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-2 border"
                          style={{ width: 140, height: 80, background: '#f8f9fa', overflow: 'hidden', flexShrink: 0 }}
                        >
                          {imgDashPreview
                            ? <img src={imgDashPreview} alt="Dashboard" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: '0.72rem', color: '#adb5bd', textAlign: 'center', padding: '0 8px' }}>Aucune image</span>
                          }
                        </div>
                        <div className="d-flex flex-column gap-2">
                          <button type="button" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={() => imgDashRef.current?.click()}>
                            <Upload size={13} /> Choisir une image
                          </button>
                          {imgDashPreview && (
                            <button type="button" className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                              onClick={() => { setImgDashPreview(''); if (imgDashRef.current) imgDashRef.current.value = ''; }}>
                              <X size={13} /> Supprimer
                            </button>
                          )}
                          <span style={{ fontSize: '0.72rem', color: '#6c757d' }}>PNG, JPG · max 2 Mo — affichée dans la bannière d'accueil</span>
                        </div>
                        <input ref={imgDashRef} type="file" accept="image/png,image/jpeg" className="d-none" onChange={handleImgDashChange} />
                      </div>
                    </div>

                    <div className="col-sm-6">
                      <Field label="Nom de la société" required error={entrepriseForm.formState.errors.nomSociete?.message}>
                        <input className="form-control" {...entrepriseForm.register('nomSociete')} />
                      </Field>
                    </div>
                    <div className="col-sm-6">
                      <Field label="Nom de l'application" hint="Affiché dans la barre latérale">
                        <input className="form-control" placeholder="BurinTrack" {...entrepriseForm.register('nomApplication')} />
                      </Field>
                    </div>
                    <div className="col-sm-6">
                      <Field label="Email de contact" error={entrepriseForm.formState.errors.email?.message}>
                        <input type="email" className="form-control" {...entrepriseForm.register('email')} />
                      </Field>
                    </div>
                    <div className="col-sm-6">
                      <Field label="Téléphone" error={entrepriseForm.formState.errors.telephone?.message}>
                        <input className="form-control" {...entrepriseForm.register('telephone')} />
                      </Field>
                    </div>
                    <div className="col-sm-6">
                      <Field label="Site web" error={entrepriseForm.formState.errors.siteWeb?.message}>
                        <input className="form-control" {...entrepriseForm.register('siteWeb')} />
                      </Field>
                    </div>
                    <div className="col-12">
                      <Field label="Adresse" error={entrepriseForm.formState.errors.adresse?.message}>
                        <textarea rows={2} className="form-control" style={{ resize: 'none' }} {...entrepriseForm.register('adresse')} />
                      </Field>
                    </div>
                  </div>
                </FormSection>
                <div className="d-flex justify-content-end pt-3 border-top">
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={saveEntreprise.isPending}>
                    {saveEntreprise.isPending ? <Spinner size={15} /> : <Save size={15} />} Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ---- SMTP ---- */}
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <form onSubmit={smtpForm.handleSubmit((f) => saveSmtp.mutate(JSON.stringify(f)))} noValidate>
                <FormSection title="Messagerie (SMTP)" icon={<Mail size={13} />}>
                  <div className="rounded-3 p-3 mb-3" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.82rem', color: '#1e40af' }}>
                    Ces paramètres sont utilisés pour l'envoi d'emails (alertes contrats, notifications). Laissez le champ hôte vide pour désactiver l'envoi.
                  </div>
                  <div className="row g-3">
                    <div className="col-sm-8">
                      <Field label="Serveur SMTP (hôte)" error={(smtpForm.formState.errors as any).hote?.message}>
                        <input className="form-control" placeholder="smtp.gmail.com" {...smtpForm.register('hote')} />
                      </Field>
                    </div>
                    <div className="col-sm-4">
                      <Field label="Port" error={(smtpForm.formState.errors as any).port?.message}>
                        <input type="number" className="form-control" {...smtpForm.register('port')} />
                      </Field>
                    </div>
                    <div className="col-sm-6">
                      <Field label="Utilisateur" error={(smtpForm.formState.errors as any).utilisateur?.message}>
                        <input className="form-control" {...smtpForm.register('utilisateur')} />
                      </Field>
                    </div>
                    <div className="col-sm-6">
                      <Field label="Mot de passe" error={(smtpForm.formState.errors as any).motDePasse?.message}>
                        <input type="password" className="form-control" {...smtpForm.register('motDePasse')} />
                      </Field>
                    </div>
                    <div className="col-sm-8">
                      <Field label="Expéditeur affiché" error={(smtpForm.formState.errors as any).expediteur?.message}>
                        <input className="form-control" placeholder="noreply@burinfort.com" {...smtpForm.register('expediteur')} />
                      </Field>
                    </div>
                    <div className="col-sm-4 d-flex align-items-end pb-2">
                      <div className="form-check">
                        <input type="checkbox" className="form-check-input" id="ssl" {...smtpForm.register('ssl')} />
                        <label className="form-check-label" htmlFor="ssl" style={{ fontSize: '0.875rem' }}>Utiliser SSL/TLS</label>
                      </div>
                    </div>
                  </div>
                </FormSection>
                <div className="d-flex justify-content-end pt-3 border-top">
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={saveSmtp.isPending}>
                    {saveSmtp.isPending ? <Spinner size={15} /> : <Save size={15} />} Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ---- Alertes ---- */}
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <form onSubmit={alertesForm.handleSubmit((f) => saveAlertes.mutate(JSON.stringify(f)))} noValidate>
                <FormSection title="Alertes et notifications" icon={<Bell size={13} />}>
                  <div className="row g-3">
                    <div className="col-sm-4">
                      <Field label="Alerte 1 — délai (jours)" hint="Ex : 30 jours avant échéance" error={(alertesForm.formState.errors as any).seuilJours1?.message}>
                        <input type="number" className="form-control" {...alertesForm.register('seuilJours1')} />
                      </Field>
                    </div>
                    <div className="col-sm-4">
                      <Field label="Alerte 2 — délai (jours)" hint="Ex : 60 jours avant échéance" error={(alertesForm.formState.errors as any).seuilJours2?.message}>
                        <input type="number" className="form-control" {...alertesForm.register('seuilJours2')} />
                      </Field>
                    </div>
                    <div className="col-sm-4 d-flex align-items-end pb-2">
                      <div className="form-check">
                        <input type="checkbox" className="form-check-input" id="autoAlert" {...alertesForm.register('envoyerAutoAuDemarrage')} />
                        <label className="form-check-label" htmlFor="autoAlert" style={{ fontSize: '0.875rem' }}>Envoyer alertes au démarrage</label>
                      </div>
                    </div>
                  </div>
                </FormSection>
                <div className="d-flex justify-content-end pt-3 border-top">
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={saveAlertes.isPending}>
                    {saveAlertes.isPending ? <Spinner size={15} /> : <Save size={15} />} Enregistrer
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
