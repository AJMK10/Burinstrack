import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  CalendarClock,
  FileCheck2,
  Printer,
  Repeat,
  Users,
  Wrench,
} from 'lucide-react';
import api from '../lib/api';
import type { Dashboard } from '../types';
import { useAuthStore } from '../store/authStore';
import {
  formatCompact,
  formatDate,
  formatNumber,
  greeting,
  NATURE,
  TONE,
  TONE_HEX,
  type Tone,
} from '../lib/format';
import { AreaChart, Donut, HBars, Legend, Sparkline, StackedBars } from '../components/charts';
import { Avatar, Badge, EmptyState, ErrorState, Skeleton } from '../components/ui';

function Kpi({
  title,
  value,
  hint,
  icon,
  tone,
  to,
  spark,
  delay,
}: {
  title: string;
  value: number;
  hint: ReactNode;
  icon: ReactNode;
  tone: Tone;
  to: string;
  spark?: number[];
  delay: number;
}) {
  return (
    <Link
      to={to}
      className="card card-hover group relative overflow-hidden animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${TONE[tone].soft}`}>{icon}</div>
        <ArrowUpRight size={18} className="text-ink-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-500" />
      </div>
      <p className="mt-4 text-sm font-medium text-ink-500">{title}</p>
      <p className="mt-1 font-display text-4xl font-extrabold tracking-tight text-ink-900 tabular-nums">{formatNumber(value)}</p>
      <div className="mt-3 text-xs font-medium text-ink-500">{hint}</div>
      {spark && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-80">
          <Sparkline values={spark} color={TONE_HEX[tone]} />
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
  className = '',
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <section className={`card animate-slide-up ${className}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-44 w-full !rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 !rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-80 !rounded-2xl xl:col-span-2" />
        <Skeleton className="h-80 !rounded-2xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useQuery<Dashboard>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
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
    { label: 'Ouvertes', value: data.interventionsOuvertes, color: TONE_HEX.sky },
    { label: 'En cours', value: data.interventionsEnCours, color: TONE_HEX.amber },
    { label: 'Résolues', value: data.interventionsResolues, color: TONE_HEX.emerald },
    { label: 'Fermées', value: data.interventionsFermees, color: TONE_HEX.slate },
  ];

  const maxNature = Math.max(1, ...data.interventionsParNature.map((n) => n.valeur));

  return (
    <div className="space-y-6">
      {/* ---------------- Bannière ---------------- */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-6 text-white shadow-lift animate-slide-up sm:p-8">
        <div className="bg-grid absolute inset-0 opacity-50 [mask-image:linear-gradient(to_left,black,transparent)]" />
        <div className="absolute -right-10 -top-20 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-brand-200">{greeting()}{prenomAffiche && `, ${prenomAffiche}`} 👋</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
              {aTraiter > 0 ? (
                <>
                  <span className="text-amber-300">{aTraiter}</span> intervention{aTraiter > 1 ? 's' : ''} à traiter aujourd'hui
                </>
              ) : (
                'Tout est à jour, bravo !'
              )}
            </h1>
            <p className="mt-2 text-sm text-brand-100/90">
              {data.contratsExpirant30 > 0
                ? `${data.contratsExpirant30} contrat(s) arrivent à échéance dans les 30 prochains jours.`
                : 'Aucun contrat n’arrive à échéance dans les 30 prochains jours.'}{' '}
              {data.totalTechniciens} technicien{data.totalTechniciens > 1 ? 's' : ''} actif{data.totalTechniciens > 1 ? 's' : ''}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/interventions" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-soft transition hover:bg-brand-50">
              <Wrench size={16} /> Voir les interventions
            </Link>
            <Link to="/carte" className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
              Ouvrir la carte
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- KPI ---------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          title="Clients actifs"
          value={data.totalClients}
          icon={<Users size={22} />}
          tone="brand"
          to="/clients"
          delay={60}
          hint={<>Sous contrat de maintenance</>}
        />
        <Kpi
          title="Copieurs sous contrat"
          value={data.totalCopieurs}
          icon={<Printer size={22} />}
          tone="violet"
          to="/copieurs"
          delay={120}
          hint={<>Répartis chez {data.totalClients} clients</>}
        />
        <Kpi
          title="Contrats actifs"
          value={data.contratsActifs}
          icon={<FileCheck2 size={22} />}
          tone="emerald"
          to="/copieurs"
          delay={180}
          hint={
            <span className="inline-flex items-center gap-2">
              <Badge tone="emerald">{tauxContrats}%</Badge> du parc couvert
            </span>
          }
        />
        <Kpi
          title="Interventions ouvertes"
          value={aTraiter}
          icon={<Wrench size={22} />}
          tone="amber"
          to="/interventions"
          delay={240}
          spark={data.interventionsParMois.map((m) => m.total)}
          hint={
            <span>
              {data.interventionsOuvertes} ouverte(s) · {data.interventionsEnCours} en cours
            </span>
          }
        />
      </div>

      {/* ---------------- Activité ---------------- */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Section
          title="Activité des interventions"
          subtitle="Six derniers mois — total et pannes"
          className="xl:col-span-2"
          delay={100}
          action={
            <div className="flex items-center gap-4 text-xs font-medium text-ink-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" />Interventions</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />Pannes</span>
            </div>
          }
        >
          <AreaChart
            data={data.interventionsParMois.map((m) => ({ label: m.libelle, a: m.total, b: m.pannes }))}
            labelA="Interventions"
            labelB="Pannes"
          />
        </Section>

        <Section title="Statut des interventions" subtitle={`${formatNumber(totalInterventions)} au total`} delay={160}>
          <Donut
            slices={statuts}
            center={
              <>
                <span className="font-display text-3xl font-extrabold text-ink-900">{aTraiter}</span>
                <span className="text-xs font-medium text-ink-500">à traiter</span>
              </>
            }
          />
          <div className="mt-6">
            <Legend items={statuts.map((s) => ({ label: s.label, value: s.value, color: s.color }))} />
          </div>
        </Section>
      </div>

      {/* ---------------- Techniciens / natures / pannes ---------------- */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Interventions par technicien" subtitle="Total et part résolue" delay={120}>
          {data.interventionsParTechnicien.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">Aucune donnée.</p>
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

        <Section title="Nature des demandes" subtitle="Répartition de toutes les interventions" delay={180}>
          <ul className="space-y-3.5">
            {data.interventionsParNature.map((n) => {
              const cfg = NATURE[n.cle];
              return (
                <li key={n.cle}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-700">{cfg.label}</span>
                    <span className="font-semibold tabular-nums text-ink-900">{n.valeur}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full origin-left rounded-full animate-grow-x"
                      style={{ width: `${(n.valeur / maxNature) * 100}%`, background: TONE_HEX[cfg.tone] }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section
          title="Pannes récurrentes"
          subtitle="Machines à surveiller en priorité"
          delay={240}
          action={<Repeat size={18} className="text-rose-400" />}
        >
          {data.pannesRecurrentes.length === 0 ? (
            <EmptyState icon={<Repeat size={22} />} title="Aucune panne récurrente" text="Aucune machine n'a connu 2 pannes ou plus." />
          ) : (
            <ul className="space-y-3">
              {data.pannesRecurrentes.map((p) => (
                <li key={p.copieurId} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 transition hover:border-rose-200 hover:bg-rose-50/40">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 font-display text-base font-extrabold text-rose-600">
                    {p.nombrePannes}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{p.designation}</p>
                    <p className="truncate text-xs text-ink-500">{p.nomClient} · {p.numeroSerie}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* ---------------- Contrats & volumes ---------------- */}
      <div className="grid gap-6 xl:grid-cols-5">
        <Section
          title="Contrats arrivant à échéance"
          subtitle={`${data.contratsExpirant30} sous 30 jours · ${data.contratsExpirant60} sous 60 jours`}
          className="overflow-hidden xl:col-span-3"
          delay={120}
          action={<CalendarClock size={18} className="text-amber-500" />}
        >
          {data.contratsExpirantBientot.length === 0 ? (
            <EmptyState icon={<FileCheck2 size={22} />} title="Aucune échéance proche" text="Tous les contrats sont à jour pour les 60 prochains jours." />
          ) : (
            <div className="-mx-6 -mb-6 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="px-6 py-3">Client</th>
                    <th className="px-3 py-3">Machine</th>
                    <th className="px-3 py-3">Échéance</th>
                    <th className="px-6 py-3 text-right">Délai</th>
                  </tr>
                </thead>
                <tbody>
                  {data.contratsExpirantBientot.map((c) => {
                    const tone: Tone = c.joursRestants < 0 ? 'rose' : c.joursRestants <= 15 ? 'rose' : c.joursRestants <= 30 ? 'amber' : 'sky';
                    return (
                      <tr key={c.copieurId} className="table-row">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={c.nomClient} size={34} />
                            <span className="max-w-44 truncate font-semibold text-ink-900">{c.nomClient}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <p className="max-w-48 truncate text-ink-800">{c.designation}</p>
                          <p className="font-mono text-xs text-ink-400">{c.numeroSerie}</p>
                        </td>
                        <td className="px-3 py-3 text-ink-600">{formatDate(c.dateFinContrat)}</td>
                        <td className="px-6 py-3 text-right">
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

        <Section
          title="Volumes imprimés"
          subtitle="Pages consommées par client (relevés)"
          className="xl:col-span-2"
          delay={180}
        >
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-ink-900 p-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-300">Noir &amp; blanc</p>
              <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">{formatCompact(data.volumesTotaux.totalNB)}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-brand-500 via-violet-500 to-rose-400 p-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">Couleur</p>
              <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">{formatCompact(data.volumesTotaux.totalCouleur)}</p>
            </div>
          </div>
          {data.volumesTotaux.parClient.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">Aucun relevé.</p>
          ) : (
            <StackedBars
              rows={data.volumesTotaux.parClient.map((v) => ({ label: v.nomClient, a: v.volumeNB, b: v.volumeCouleur }))}
              format={formatCompact}
            />
          )}
        </Section>
      </div>
    </div>
  );
}
