import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, Gauge, Lock, Mail, MapPin, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { errorMessage } from '../lib/format';
import { LogoMark, Spinner } from '../components/ui';

const schema = z.object({
  email: z.string().min(1, "L'adresse e-mail est requise").email('Adresse e-mail invalide'),
  motDePasse: z.string().min(1, 'Le mot de passe est requis'),
});
type FormData = z.infer<typeof schema>;

const FEATURES = [
  { icon: Wrench, title: 'Interventions tracées', text: 'Du signalement à la clôture, chaque action est historisée.' },
  { icon: Gauge, title: 'Compteurs & facturation', text: 'Volumes noir & blanc et couleur calculés automatiquement.' },
  { icon: MapPin, title: 'Parc géolocalisé', text: 'Visualisez vos clients et optimisez les déplacements.' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', data);
      const { accessToken, refreshToken, user } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setAuth(user, accessToken, refreshToken);
      navigate('/');
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(
        status === undefined
          ? "Impossible de joindre le serveur. Vérifiez que l'API est démarrée."
          : errorMessage(err, 'Identifiants invalides.'),
      );
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* ------------ Panneau de marque ------------ */}
      <div className="relative hidden overflow-hidden bg-ink-950 text-white lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-950 to-ink-950" />
        <div className="bg-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="absolute -left-20 top-10 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl animate-float" />
        <div className="absolute -bottom-24 right-0 h-[28rem] w-[28rem] rounded-full bg-violet-600/30 blur-3xl animate-float [animation-delay:-6s]" />
        <div className="absolute right-24 top-1/3 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl animate-float [animation-delay:-3s]" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <LogoMark size={44} />
            <div className="leading-tight">
              <p className="font-display text-xl font-extrabold tracking-tight">BurinTrack</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-300">par BURINFORT</p>
            </div>
          </div>

          <div className="max-w-xl animate-slide-up">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-brand-200 backdrop-blur">
              <Sparkles size={14} /> Plateforme SAV nouvelle génération
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl">
              Pilotez votre parc de copieurs,
              <span className="bg-gradient-to-r from-brand-300 via-violet-300 to-sky-300 bg-clip-text text-transparent"> sans friction.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-300">
              Une seule plateforme pour vos contrats, vos interventions techniques et le suivi des compteurs de plus de 200 machines.
            </p>

            <ul className="mt-10 space-y-4">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10">
                  <span className="rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 p-2.5 shadow-glow">
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-sm text-ink-400">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-ink-500">© {new Date().getFullYear()} BURINFORT · Service Technique / SAV</p>
        </div>
      </div>

      {/* ------------ Formulaire ------------ */}
      <div className="relative flex items-center justify-center bg-white px-6 py-12 sm:px-12">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-violet-500 to-sky-500 lg:hidden" />
        <div className="w-full max-w-sm animate-slide-up">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark size={40} />
            <p className="font-display text-xl font-extrabold tracking-tight text-ink-900">BurinTrack</p>
          </div>

          <h2 className="text-3xl font-extrabold text-ink-900">Bon retour 👋</h2>
          <p className="mt-2 text-sm text-ink-500">Connectez-vous pour accéder à votre espace de gestion SAV.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="label">Adresse e-mail</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                  placeholder="nom@burinfort.com"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="motDePasse" className="label">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="motDePasse"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input pl-10 pr-11 ${errors.motDePasse ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  {...register('motDePasse')}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                  aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.motDePasse && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.motDePasse.message}</p>}
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 animate-fade-in">
                <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-base">
              {isSubmitting ? (
                <>
                  <Spinner size={18} /> Connexion…
                </>
              ) : (
                <>
                  Se connecter <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={() => {
                setValue('email', 'admin@burinfort.com', { shouldValidate: true });
                setValue('motDePasse', 'Admin@2026!', { shouldValidate: true });
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/60 py-2.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              <Sparkles size={14} /> Remplir avec le compte de démonstration
            </button>
          )}

          <p className="mt-10 text-center text-xs text-ink-400">
            Application interne BURINFORT · Connexion sécurisée
          </p>
        </div>
      </div>
    </div>
  );
}
