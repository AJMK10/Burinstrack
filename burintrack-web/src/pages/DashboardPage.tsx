import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileCheck2,
  Printer,
  Repeat,
  Users,
  Wrench,
} from 'lucide-react';
import api from '../lib/api';
import type { Dashboard, Intervention, Technicien } from '../types';
import { useAuthStore } from '../store/authStore';
import {
  formatCompact,
  formatDate,
  formatNumber,
  greeting,
  NATURE,
  STATUT_INTERVENTION,
  TONE,
  TONE_HEX,
  type Tone,
} from '../lib/format';
import { AreaChart, Donut, HBars, Legend, Sparkline, StackedBars } from '../components/charts';
import { Avatar, Badge, EmptyState, ErrorState, Spinner } from '../components/ui';
import { toast } from '../store/toastStore';

function StatCard({
  title,
  value,
  hint,
  icon,
  tone,
  to,
  spark,
}: {
  title: string;
  value: number;
  hint: ReactNode;
  icon: ReactNode;
  tone: Tone;
  to: string;
  spark?: number[];
}) {
  const colors: Record<Tone, string> = {
    brand:   '#CC1416',
    emerald: '#10b981',
    amber:   '#f59e0b',
    rose:    '#ef4444',
    sky:     '#0ea5e9',
    violet:  '#8b5cf6',
    slate:   '#94a3b8',
  };
  return (
    <Link to={to} className="stat-card text-decoration-none animate-slide-up">
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div
          className={`stat-icon ${TONE[tone].soft}`}
          style={{ color: colors[tone] }}
        >
          {icon}
        </div>
        <ArrowUpRight size={16} className="text-muted" />
      </div>
      <div className="stat-label">{title}</div>
      <div className="stat-value">{formatNumber(value)}</div>
      <div className="stat-hint">{hint}</div>
      {spark && spark.length > 1 && (
        <div style={{ pointerEvents: 'none', marginTop: '0.5rem', opacity: 0.7 }}>
          <Sparkline values={spark} color={colors[tone]} />
        </div>
      )}
    </Link>
  );
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="card animate-slide-up">
      <div className="card-header d-flex align-items-start justify-content-between gap-2">
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#343a40' }}>{title}</div>
          {subtitle && <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="skeleton mb-4" style={{ height: 120, borderRadius: '0.75rem' }} />
      <div className="row g-3 mb-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="col-sm-6 col-xl-3">
            <div className="skeleton" style={{ height: 140, borderRadius: '0.5rem' }} />
          </div>
        ))}
      </div>
      <div className="row g-3">
        <div className="col-xl-8"><div className="skeleton" style={{ height: 320, borderRadius: '0.5rem' }} /></div>
        <div className="col-xl-4"><div className="skeleton" style={{ height: 320, borderRadius: '0.5rem' }} /></div>
      </div>
    </div>
  );
}

function TechnicienDashboard({ userEmail, userName }: { userEmail: string; userName: string }) {
  const imgDash = useDashboardImage();
  const { data: techniciens = [], isLoading: loadingTech } = useQuery<Technicien[]>({
    queryKey: ['techniciens'],
    queryFn: () => api.get('/techniciens').then((r) => r.data),
  });

  const moi = techniciens.find((t) => t.email.toLowerCase() === userEmail.toLowerCase());

  const { data: interventions = [], isLoading: loadingIntv } = useQuery<Intervention[]>({
    queryKey: ['interventions', { technicienId: moi?.id }],
    queryFn: () => api.get('/interventions', { params: { technicienId: moi?.id, taille: 100 } }).then((r) => r.data),
    enabled: !!moi,
  });

  const ouvertes  = interventions.filter((i) => i.statut === 'Ouverte');
  const enCours   = interventions.filter((i) => i.statut === 'EnCours');
  const resolues  = interventions.filter((i) => i.statut === 'Resolue' || i.statut === 'Fermee');
  const actives   = [...ouvertes, ...enCours];
  const prenom = (userName || userEmail).split(/[@\s.]/)[0] ?? '';
  const prenomAffiche = prenom ? prenom.charAt(0).toUpperCase() + prenom.slice(1) : '';

  if (loadingTech || loadingIntv) return <DashboardSkeleton />;

  return (
    <div>
      {/* Banner */}
      <div
        className="rounded-3 mb-4 p-4 animate-slide-up"
        style={{ background: 'linear-gradient(135deg, #3d0506 0%, #7a0a0b 40%, #CC1416 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', top: '-4rem', right: '-4rem', width: '18rem', height: '18rem', borderRadius: '50%', background: 'rgba(255,200,100,0.15)', filter: 'blur(50px)' }} />
        {imgDash && (
          <img
            src={imgDash}
            alt=""
            aria-hidden
            style={{
              position: 'absolute', right: 0, bottom: 0, height: '100%', maxWidth: '40%',
              objectFit: 'contain', objectPosition: 'right bottom',
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.85) 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.85) 100%)',
              pointerEvents: 'none',
            }}
          />
        )}
        <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 position-relative">
          <div>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', marginBottom: '0.35rem' }}>
              {greeting()}{prenomAffiche && `, ${prenomAffiche}`} 👋
            </p>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
              {actives.length > 0 ? (
                <><span style={{ color: '#fbbf24' }}>{actives.length}</span> intervention{actives.length > 1 ? 's' : ''} à traiter</>
              ) : ('Tout est à jour, bravo !')}
            </h2>
            {moi && (
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                {moi.nomComplet} · {moi.telephone} · {moi.totalInterventions} intervention{moi.totalInterventions > 1 ? 's' : ''} au total
              </p>
            )}
          </div>
          <Link to="/interventions" className="btn btn-light btn-sm d-flex align-items-center gap-1">
            <Wrench size={14} /> Mes interventions
          </Link>
        </div>
      </div>

      {/* KPI */}
      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <div className="stat-card animate-slide-up">
            <div className={`stat-icon ${TONE['sky'].soft}`} style={{ color: TONE_HEX.sky }}><Clock size={20} /></div>
            <div className="stat-label">Ouvertes</div>
            <div className="stat-value">{ouvertes.length}</div>
            <div className="stat-hint">À prendre en charge</div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="stat-card animate-slide-up">
            <div className={`stat-icon ${TONE['amber'].soft}`} style={{ color: TONE_HEX.amber }}><Wrench size={20} /></div>
            <div className="stat-label">En cours</div>
            <div className="stat-value">{enCours.length}</div>
            <div className="stat-hint">Interventions actives</div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="stat-card animate-slide-up">
            <div className={`stat-icon ${TONE['emerald'].soft}`} style={{ color: TONE_HEX.emerald }}><CheckCircle2 size={20} /></div>
            <div className="stat-label">Résolues</div>
            <div className="stat-value">{resolues.length}</div>
            <div className="stat-hint">Fermées ou résolues</div>
          </div>
        </div>
      </div>

      {/* Liste des interventions actives */}
      <Section title="Mes interventions actives" subtitle={`${actives.length} à traiter`}>
        {actives.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={20} />} title="Aucune intervention active" text="Toutes vos interventions sont résolues ou fermées." />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr><th>N°</th><th>Client</th><th>Machine</th><th>Nature</th><th>Date</th><th>Statut</th></tr>
              </thead>
              <tbody>
                {actives.map((i) => {
                  const cfg = STATUT_INTERVENTION[i.statut];
                  const nat = NATURE[i.nature];
                  return (
                    <tr key={i.id} style={{ fontSize: '0.85rem' }}>
                      <td className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>{i.numeroIntervention}</td>
                      <td className="fw-semibold">{i.nomClient}</td>
                      <td>
                        <div>{i.designationCopieur}</div>
                        <div className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>{i.numeroSerie}</div>
                      </td>
                      <td><Badge tone={nat.tone}>{nat.label}</Badge></td>
                      <td>{formatDate(i.dateIntervention)}</td>
                      <td><Badge tone={cfg.tone}>{cfg.label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

function useDashboardImage() {
  const { data } = useQuery<string>({
    queryKey: ['parametres-img-dashboard'],
    queryFn: async () => {
      const r = await api.get('/parametres');
      const found = (r.data as { cle: string; valeur: string }[]).find((p) => p.cle === 'entreprise');
      if (!found) return '';
      try { return (JSON.parse(found.valeur) as { imageDashboard?: string }).imageDashboard ?? ''; }
      catch { return ''; }
    },
    staleTime: 1000 * 60 * 10,
  });
  return data ?? '';
}

function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const imgDash = useDashboardImage();
  const { data, isLoading, isError, refetch } = useQuery<Dashboard>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
  });
  const canAlert = user?.roles?.some((r) => ['Administrateur', 'ResponsableSAV'].includes(r)) ?? false;
  const alertMut = useMutation({
    mutationFn: () => api.post('/dashboard/alertes-contrats').then((r) => r.data),
    onSuccess: (d) => toast.success('Alertes envoyées', d.message),
    onError: () => toast.error('Erreur', "L'envoi des alertes a échoué. Vérifiez la configuration SMTP."),
  });

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const aTraiter = data.interventionsOuvertes + data.interventionsEnCours;
  const totalInterventions =
    data.interventionsOuvertes + data.interventionsEnCours + data.interventionsResolues + data.interventionsFermees;
  const tauxContrats = data.totalCopieurs ? Math.round((data.contratsActifs / data.totalCopieurs) * 100) : 0;
  const prenom = (user?.nomComplet || user?.email || '').split(/[@\s.]/)[0] ?? '';
  const prenomAffiche = prenom ? prenom.charAt(0).toUpperCase() + prenom.slice(1) : '';

  const statuts = [
    { label: 'Ouvertes',  value: data.interventionsOuvertes,  color: TONE_HEX.sky     },
    { label: 'En cours',  value: data.interventionsEnCours,   color: TONE_HEX.amber   },
    { label: 'Résolues',  value: data.interventionsResolues,  color: TONE_HEX.emerald },
    { label: 'Fermées',   value: data.interventionsFermees,   color: TONE_HEX.slate   },
  ];

  const maxNature = Math.max(1, ...data.interventionsParNature.map((n) => n.valeur));

  return (
    <div>
      {/* ---- Banner ---- */}
      <div
        className="rounded-3 mb-4 p-4 animate-slide-up"
        style={{ background: 'linear-gradient(135deg, #3d0506 0%, #7a0a0b 40%, #CC1416 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', top: '-4rem', right: '-4rem', width: '18rem', height: '18rem', borderRadius: '50%', background: 'rgba(255,200,100,0.15)', filter: 'blur(50px)' }} />
        {imgDash && (
          <img
            src={imgDash}
            alt=""
            aria-hidden
            style={{
              position: 'absolute', right: 0, bottom: 0, height: '100%', maxWidth: '40%',
              objectFit: 'contain', objectPosition: 'right bottom',
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.85) 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.85) 100%)',
              pointerEvents: 'none',
            }}
          />
        )}
        <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 position-relative">
          <div>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', marginBottom: '0.35rem' }}>
              {greeting()}{prenomAffiche && `, ${prenomAffiche}`} 👋
            </p>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
              {aTraiter > 0 ? (
                <>
                  <span style={{ color: '#fbbf24' }}>{aTraiter}</span>{' '}
                  intervention{aTraiter > 1 ? 's' : ''} à traiter aujourd'hui
                </>
              ) : (
                'Tout est à jour, bravo !'
              )}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              {data.contratsExpirant30 > 0
                ? `${data.contratsExpirant30} contrat(s) arrivent à échéance dans 30 jours.`
                : 'Aucun contrat en échéance dans 30 jours.'}{' '}
              {data.totalTechniciens} technicien{data.totalTechniciens > 1 ? 's' : ''} actif{data.totalTechniciens > 1 ? 's' : ''}.
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Link to="/interventions" className="btn btn-light btn-sm d-flex align-items-center gap-1">
              <Wrench size={14} /> Interventions
            </Link>
            <Link to="/carte" className="btn btn-sm d-flex align-items-center gap-1" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
              Ouvrir la carte
            </Link>
            {canAlert && (
              <button
                className="btn btn-sm d-flex align-items-center gap-1"
                style={{ background: data.contratsExpirant60 > 0 ? '#fbbf24' : 'rgba(255,255,255,0.1)', color: data.contratsExpirant60 > 0 ? '#1c1917' : '#fff', border: 'none', fontWeight: 600 }}
                onClick={() => alertMut.mutate()}
                disabled={alertMut.isPending}
                title={`Envoyer les alertes d'expiration à tous les utilisateurs`}
              >
                {alertMut.isPending ? <Spinner size={14} /> : <Bell size={14} />}
                {data.contratsExpirant60 > 0 ? `Alerter (${data.contratsExpirant60})` : 'Alertes contrats'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---- KPI cards ---- */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Clients actifs"
            value={data.totalClients}
            icon={<Users size={20} />}
            tone="brand"
            to="/clients"
            hint="Sous contrat de maintenance"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Copieurs sous contrat"
            value={data.totalCopieurs}
            icon={<Printer size={20} />}
            tone="violet"
            to="/copieurs"
            hint={`Répartis chez ${data.totalClients} clients`}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Contrats actifs"
            value={data.contratsActifs}
            icon={<FileCheck2 size={20} />}
            tone="emerald"
            to="/copieurs"
            hint={<span><Badge tone="emerald">{tauxContrats}%</Badge> du parc couvert</span>}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Interventions ouvertes"
            value={aTraiter}
            icon={<Wrench size={20} />}
            tone="amber"
            to="/interventions"
            spark={data.interventionsParMois.map((m) => m.total)}
            hint={`${data.interventionsOuvertes} ouverte(s) · ${data.interventionsEnCours} en cours`}
          />
        </div>
      </div>

      {/* ---- Activité ---- */}
      <div className="row g-3 mb-4">
        <div className="col-xl-8">
          <Section
            title="Activité des interventions"
            subtitle="Six derniers mois — total et pannes"
            action={
              <div className="d-flex gap-3" style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                <span className="d-flex align-items-center gap-1">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#CC1416', display: 'inline-block' }} />
                  Interventions
                </span>
                <span className="d-flex align-items-center gap-1">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} />
                  Pannes
                </span>
              </div>
            }
          >
            <AreaChart
              data={data.interventionsParMois.map((m) => ({ label: m.libelle, a: m.total, b: m.pannes }))}
              labelA="Interventions"
              labelB="Pannes"
            />
          </Section>
        </div>
        <div className="col-xl-4">
          <Section
            title="Statut des interventions"
            subtitle={`${formatNumber(totalInterventions)} au total`}
          >
            <Donut
              slices={statuts}
              center={
                <>
                  <span style={{ fontWeight: 800, fontSize: '1.75rem', color: '#343a40', lineHeight: 1 }}>{aTraiter}</span>
                  <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>à traiter</span>
                </>
              }
            />
            <div className="mt-4">
              <Legend items={statuts.map((s) => ({ label: s.label, value: s.value, color: s.color }))} />
            </div>
          </Section>
        </div>
      </div>

      {/* ---- Techniciens / natures / pannes ---- */}
      <div className="row g-3 mb-4">
        <div className="col-lg-4">
          <Section title="Interventions par technicien" subtitle="Total et part résolue">
            {data.interventionsParTechnicien.length === 0 ? (
              <p className="text-center text-muted py-4" style={{ fontSize: '0.85rem' }}>Aucune donnée.</p>
            ) : (
              <HBars
                rows={data.interventionsParTechnicien.map((t) => ({
                  label: t.nomTechnicien,
                  total: t.nombreInterventions,
                  done: t.interventionsResolues,
                }))}
              />
            )}
          </Section>
        </div>

        <div className="col-lg-4">
          <Section title="Nature des demandes" subtitle="Répartition de toutes les interventions">
            <ul className="list-unstyled mb-0">
              {data.interventionsParNature.map((n) => {
                const cfg = NATURE[n.cle];
                const pct = Math.round((n.valeur / maxNature) * 100);
                return (
                  <li key={n.cle} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.85rem' }}>
                      <span className="fw-medium" style={{ color: '#343a40' }}>{cfg.label}</span>
                      <span className="fw-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>{n.valeur}</span>
                    </div>
                    <div className="progress" style={{ height: 6, borderRadius: '50rem' }}>
                      <div
                        className="progress-bar animate-grow-x"
                        style={{ width: `${pct}%`, background: TONE_HEX[cfg.tone], borderRadius: '50rem' }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>
        </div>

        <div className="col-lg-4">
          <Section
            title="Pannes récurrentes"
            subtitle="Machines à surveiller en priorité"
            action={<Repeat size={16} className="text-danger" />}
          >
            {data.pannesRecurrentes.length === 0 ? (
              <EmptyState icon={<Repeat size={20} />} title="Aucune panne récurrente" text="Aucune machine n'a connu 2 pannes ou plus." />
            ) : (
              <ul className="list-unstyled mb-0">
                {data.pannesRecurrentes.map((p) => (
                  <li key={p.copieurId} className="d-flex align-items-center gap-3 p-2 mb-2 border rounded-2">
                    <div
                      className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-2"
                      style={{ width: 40, height: 40, background: '#fee2e2', color: '#991b1b', fontWeight: 800, fontSize: '1rem' }}
                    >
                      {p.nombrePannes}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="text-truncate fw-semibold" style={{ fontSize: '0.85rem', color: '#343a40' }}>{p.designation}</div>
                      <div className="text-truncate text-muted" style={{ fontSize: '0.75rem' }}>{p.nomClient} · {p.numeroSerie}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>

      {/* ---- Contrats & volumes ---- */}
      <div className="row g-3">
        <div className="col-xl-7">
          <Section
            title="Contrats arrivant à échéance"
            subtitle={`${data.contratsExpirant30} sous 30 jours · ${data.contratsExpirant60} sous 60 jours`}
            action={<CalendarClock size={16} className="text-warning" />}
          >
            {data.contratsExpirantBientot.length === 0 ? (
              <EmptyState icon={<FileCheck2 size={20} />} title="Aucune échéance proche" text="Tous les contrats sont à jour pour les 60 prochains jours." />
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Machine</th>
                      <th>Échéance</th>
                      <th className="text-end">Délai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.contratsExpirantBientot.map((c) => {
                      const tone: Tone = c.joursRestants < 0 ? 'rose' : c.joursRestants <= 30 ? 'rose' : c.joursRestants <= 60 ? 'amber' : 'sky';
                      return (
                        <tr key={c.copieurId}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <Avatar name={c.nomClient} size={32} />
                              <span className="fw-semibold text-truncate" style={{ maxWidth: '10rem', fontSize: '0.85rem' }}>{c.nomClient}</span>
                            </div>
                          </td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: '10rem', fontSize: '0.85rem' }}>{c.designation}</div>
                            <div className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>{c.numeroSerie}</div>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: '#6c757d' }}>{formatDate(c.dateFinContrat)}</td>
                          <td className="text-end">
                            <Badge tone={tone} dot>
                              {c.joursRestants < 0 ? `Expiré (${Math.abs(c.joursRestants)} j)` : `${c.joursRestants} j`}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        <div className="col-xl-5">
          <Section title="Volumes imprimés" subtitle="Pages consommées par client (relevés)">
            <div className="row g-2 mb-4">
              <div className="col-6">
                <div className="rounded-3 p-3 text-white" style={{ background: '#343a40' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
                    Noir &amp; blanc
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                    {formatCompact(data.volumesTotaux.totalNB)}
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="rounded-3 p-3 text-white" style={{ background: 'linear-gradient(135deg, #f59e0b, #8b5cf6, #f43f5e)' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>
                    Couleur
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                    {formatCompact(data.volumesTotaux.totalCouleur)}
                  </div>
                </div>
              </div>
            </div>
            {data.volumesTotaux.parClient.length === 0 ? (
              <p className="text-center text-muted py-4" style={{ fontSize: '0.85rem' }}>Aucun relevé.</p>
            ) : (
              <StackedBars
                rows={data.volumesTotaux.parClient.map((v) => ({ label: v.nomClient, a: v.volumeNB, b: v.volumeCouleur }))}
                format={formatCompact}
              />
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isTechnicien = user?.roles?.includes('Technicien') ?? false;
  if (isTechnicien) return <TechnicienDashboard userEmail={user?.email ?? ''} userName={user?.nomComplet ?? ''} />;
  return <AdminDashboard />;
}
