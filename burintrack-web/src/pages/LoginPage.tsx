import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Gauge, Lock, Mail, MapPin, Sparkles, Wrench } from 'lucide-react';
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

  const { data: vitrine } = useQuery<{ imageDashboard: string; logoBase64: string; nomApplication: string; nomSociete: string }>({
    queryKey: ['vitrine'],
    queryFn: () => api.get('/parametres/vitrine').then((r) => r.data),
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
  // image réelle uploadée (base64) → fond plein ; sinon → SVG illustratif sur dégradé bleu
  const customImg = vitrine?.imageDashboard ?? '';
  const hasPhoto  = customImg.startsWith('data:image');

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
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* ---- Brand panel (desktop only) ---- */}
      <div
        className="d-none d-lg-flex flex-column justify-content-between"
        style={{
          flex: '1.1',
          color: '#fff',
          padding: '3rem',
          position: 'relative',
          overflow: 'hidden',
          background: hasPhoto
            ? 'transparent'
            : 'linear-gradient(135deg, #1e3a5f 0%, #0f2640 50%, #0a1a2e 100%)',
        }}
      >
        {/* Cas 1 : vraie photo uploadée → fond plein pleine largeur */}
        {hasPhoto && (
          <>
            <img
              src={customImg}
              alt=""
              aria-hidden
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center',
                pointerEvents: 'none', userSelect: 'none',
              }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, rgba(10,18,40,0.82) 0%, rgba(15,30,60,0.75) 50%, rgba(8,16,35,0.7) 100%)',
              pointerEvents: 'none',
            }} />
          </>
        )}

        {/* Cas 2 : dégradé bleu + illustration SVG copieur */}
        {!hasPhoto && (
          <>
            <div style={{ position: 'absolute', top: '-6rem', left: '-6rem', width: '24rem', height: '24rem', borderRadius: '50%', background: 'rgba(59,125,221,0.25)', filter: 'blur(60px)' }} />
            <div style={{ position: 'absolute', bottom: '-8rem', right: '-4rem', width: '28rem', height: '28rem', borderRadius: '50%', background: 'rgba(139,92,246,0.18)', filter: 'blur(80px)' }} />
            <img
              src="/copier-hero.svg"
              alt=""
              aria-hidden
              style={{
                position: 'absolute', bottom: 0, right: '-2rem',
                width: '80%', maxHeight: '70%',
                objectFit: 'contain', objectPosition: 'right bottom',
                opacity: 0.45,
                maskImage: 'linear-gradient(to top left, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.3) 65%, transparent 90%)',
                WebkitMaskImage: 'linear-gradient(to top left, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.3) 65%, transparent 90%)',
                pointerEvents: 'none', userSelect: 'none',
              }}
            />
          </>
        )}

        <div className="d-flex align-items-center gap-3 position-relative">
          <LogoMark size={44} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>BurinTrack</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.5)' }}>
              par BURINFORT
            </div>
          </div>
        </div>

        <div className="position-relative" style={{ maxWidth: '32rem' }}>
          <span
            className="d-inline-flex align-items-center gap-2 mb-4"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50rem', padding: '0.35rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}
          >
            <Sparkles size={13} /> Plateforme SAV nouvelle génération
          </span>
          <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            Pilotez votre parc de copieurs,{' '}
            <span style={{ background: 'linear-gradient(90deg, #93c5fd, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              sans friction.
            </span>
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: '2rem' }}>
            Une seule plateforme pour vos contrats, vos interventions techniques et le suivi des compteurs de plus de 200 machines.
          </p>
          <div className="d-flex flex-column gap-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="d-flex align-items-start gap-3"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '1rem' }}
              >
                <div style={{ background: 'linear-gradient(135deg, #CC1416, #8b0000)', borderRadius: '0.5rem', padding: '0.5rem', flexShrink: 0 }}>
                  <Icon size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.15rem' }}>{title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>{text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="position-relative" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
          © {new Date().getFullYear()} BURINFORT · Service Technique / SAV
        </p>
      </div>

      {/* ---- Login form ---- */}
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ flex: 1, background: '#fff', padding: '2rem 1.5rem', minHeight: '100vh' }}
      >
        <div style={{ width: '100%', maxWidth: '22rem' }}>
          {/* Mobile logo */}
          <div className="d-flex d-lg-none align-items-center gap-3 mb-4">
            <LogoMark size={38} />
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#343a40' }}>BurinTrack</div>
          </div>

          <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#343a40', marginBottom: '0.35rem' }}>
            Bon retour 👋
          </h2>
          <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
            Connectez-vous pour accéder à votre espace de gestion SAV.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="mb-3">
              <label className="form-label" htmlFor="email">Adresse e-mail</label>
              <div className="input-group">
                <span className="input-group-text bg-white" style={{ borderColor: '#dee2e6' }}>
                  <Mail size={15} className="text-muted" />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  className={`form-control border-start-0 ps-0 ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="nom@burinfort.com"
                  {...register('email')}
                />
                {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
              </div>
            </div>

            {/* Mot de passe */}
            <div className="mb-3">
              <label className="form-label" htmlFor="motDePasse">Mot de passe</label>
              <div className="input-group">
                <span className="input-group-text bg-white" style={{ borderColor: '#dee2e6' }}>
                  <Lock size={15} className="text-muted" />
                </span>
                <input
                  id="motDePasse"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`form-control border-start-0 border-end-0 ps-0 ${errors.motDePasse ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  {...register('motDePasse')}
                />
                <button
                  type="button"
                  className="input-group-text bg-white"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? 'Masquer' : 'Afficher'}
                  style={{ cursor: 'pointer', border: '1px solid #ced4da', borderLeft: 'none' }}
                >
                  {showPwd ? <EyeOff size={15} className="text-muted" /> : <Eye size={15} className="text-muted" />}
                </button>
                {errors.motDePasse && <div className="invalid-feedback">{errors.motDePasse.message}</div>}
              </div>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-start gap-2 py-2 px-3 mb-3 animate-fade-in" style={{ fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Spinner size={17} /> Connexion…
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={() => {
                setValue('email', 'admin@burinfort.com', { shouldValidate: true });
                setValue('motDePasse', 'BurinTrack@2026!', { shouldValidate: true });
              }}
              className="btn btn-sm btn-outline-primary w-100 mt-3 d-flex align-items-center justify-content-center gap-2"
            >
              <Sparkles size={13} /> Compte de démonstration
            </button>
          )}

          <p className="text-center text-muted mt-4" style={{ fontSize: '0.75rem' }}>
            Application interne BURINFORT · Connexion sécurisée
          </p>
        </div>
      </div>
    </div>
  );
}
