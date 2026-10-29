import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Menu,
  Printer,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import type { Dashboard } from '../types';
import { Avatar, LogoMark, Toaster } from './ui';

const NAV = [
  {
    group: 'Pilotage',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Tableau de bord', end: true },
      { to: '/carte', icon: MapIcon, label: 'Carte des clients' },
    ],
  },
  {
    group: 'Gestion',
    items: [
      { to: '/clients', icon: Users, label: 'Clients' },
      { to: '/copieurs', icon: Printer, label: 'Parc copieurs' },
      { to: '/interventions', icon: Wrench, label: 'Interventions' },
    ],
  },
];

const TITLES: Record<string, string> = {
  '/': 'Tableau de bord',
  '/carte': 'Carte des clients',
  '/clients': 'Clients',
  '/copieurs': 'Parc copieurs',
  '/interventions': 'Interventions',
};

const ROLE_LABELS: Record<string, string> = {
  Administrateur: 'Administrateur',
  ResponsableSAV: 'Responsable SAV',
  Technicien: 'Technicien',
  Consultation: 'Consultation',
};

function useOutsideClick<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onOutside]);
  return ref;
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const bellRef = useOutsideClick<HTMLDivElement>(() => setBellOpen(false));
  const menuRef = useOutsideClick<HTMLDivElement>(() => setMenuOpen(false));

  const { data: dash } = useQuery<Dashboard>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
  });

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {});
    logout();
    navigate('/login');
  };

  const alertCount = (dash?.contratsExpirant30 ?? 0) + (dash?.interventionsOuvertes ?? 0);
  const displayName = user?.nomComplet || user?.email || 'Utilisateur';
  const role = ROLE_LABELS[user?.roles?.[0] ?? ''] ?? user?.roles?.[0] ?? '';
  const title = TITLES[location.pathname] ?? 'BurinTrack';
  const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      {/* ---------------- Sidebar ---------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-[900] flex w-72 flex-col overflow-hidden bg-ink-950 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* halos décoratifs */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative flex h-20 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <LogoMark size={38} />
            <div className="leading-tight">
              <p className="font-display text-lg font-extrabold tracking-tight">BurinTrack</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand-300">Gestion SAV</p>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-ink-400 hover:bg-white/10 lg:hidden" aria-label="Fermer le menu">
            <X size={20} />
          </button>
        </div>

        <nav className="relative flex-1 space-y-7 overflow-y-auto px-4 py-4">
          {NAV.map((section) => (
            <div key={section.group}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">{section.group}</p>
              <div className="space-y-1">
                {section.items.map(({ to, icon: Icon, label, ...rest }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={'end' in rest ? rest.end : false}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-600/90 to-brand-500/60 text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.8)]'
                          : 'text-ink-300 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={18} className={isActive ? 'text-white' : 'text-ink-400 group-hover:text-brand-300'} />
                        {label}
                        {to === '/interventions' && (dash?.interventionsOuvertes ?? 0) > 0 && (
                          <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold">
                            {dash?.interventionsOuvertes}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative m-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <Avatar name={displayName} size={40} rounded="rounded-full" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-brand-300">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2 text-xs font-semibold text-ink-300 transition hover:bg-rose-500/15 hover:text-rose-300"
          >
            <LogOut size={14} /> Se déconnecter
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-[800] bg-ink-950/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ---------------- Contenu ---------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-[700] flex h-16 shrink-0 items-center gap-3 border-b border-ink-100 bg-white/80 px-4 backdrop-blur-xl lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="btn-icon lg:hidden" aria-label="Ouvrir le menu">
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">{title}</p>
            <p className="hidden text-xs capitalize text-ink-400 sm:block">{today}</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => {
                  setBellOpen((v) => !v);
                  setMenuOpen(false);
                }}
                className="btn-icon relative"
                aria-label="Notifications"
              >
                <Bell size={19} />
                {alertCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {alertCount}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 top-12 w-80 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-lift animate-pop-in">
                  <div className="border-b border-ink-100 px-4 py-3">
                    <p className="text-sm font-bold text-ink-900">Alertes</p>
                  </div>
                  <div className="divide-y divide-ink-100">
                    <Link to="/copieurs" onClick={() => setBellOpen(false)} className="flex items-start gap-3 px-4 py-3 hover:bg-ink-50">
                      <span className="mt-0.5 rounded-lg bg-amber-50 p-2 text-amber-600">
                        <CalendarClock size={16} />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-ink-900">
                          {dash?.contratsExpirant30 ?? 0} contrat(s) expirent sous 30 jours
                        </span>
                        <span className="text-xs text-ink-500">{dash?.contratsExpirant60 ?? 0} sous 60 jours</span>
                      </span>
                    </Link>
                    <Link to="/interventions" onClick={() => setBellOpen(false)} className="flex items-start gap-3 px-4 py-3 hover:bg-ink-50">
                      <span className="mt-0.5 rounded-lg bg-sky-50 p-2 text-sky-600">
                        <AlertTriangle size={16} />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-ink-900">
                          {dash?.interventionsOuvertes ?? 0} intervention(s) à prendre en charge
                        </span>
                        <span className="text-xs text-ink-500">{dash?.interventionsEnCours ?? 0} en cours</span>
                      </span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Menu utilisateur */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => {
                  setMenuOpen((v) => !v);
                  setBellOpen(false);
                }}
                className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-3 transition hover:bg-ink-100"
              >
                <Avatar name={displayName} size={34} rounded="rounded-full" />
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block max-w-36 truncate text-sm font-semibold text-ink-900">{displayName}</span>
                  <span className="block text-[11px] text-ink-500">{role}</span>
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-ink-100 bg-white p-1.5 shadow-lift animate-pop-in">
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-ink-900">{displayName}</p>
                    <p className="truncate text-xs text-ink-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut size={16} /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  );
}
