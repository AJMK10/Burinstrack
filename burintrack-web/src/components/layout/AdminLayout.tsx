import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlignLeft,
  ArrowLeftRight,
  BarChart2,
  Bell,
  CalendarClock,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Printer,
  User,
  Users,
  UsersRound,
  Wrench,
  BookOpen,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import type { Dashboard } from '../../types';
import { Toaster, LogoMark, Avatar } from '../ui';

type NavItem = { to: string; icon: React.ElementType; label: string; end?: boolean; roles?: string[] };
type NavSection = { group: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    group: 'Pilotage',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Tableau de bord', end: true },
      { to: '/carte', icon: MapIcon, label: 'Carte des clients' },
      { to: '/rapports', icon: BarChart2, label: 'Rapports', roles: ['Administrateur', 'ResponsableSAV', 'Technicien'] },
    ],
  },
  {
    group: 'Gestion',
    items: [
      { to: '/clients', icon: Users, label: 'Clients', roles: ['Administrateur', 'ResponsableSAV', 'Consultation'] },
      { to: '/copieurs', icon: Printer, label: 'Parc copieurs', roles: ['Administrateur', 'ResponsableSAV', 'Technicien', 'Consultation'] },
      { to: '/attributions', icon: ArrowLeftRight, label: 'Attributions', roles: ['Administrateur', 'ResponsableSAV'] },
      { to: '/interventions', icon: Wrench, label: 'Interventions', roles: ['Administrateur', 'ResponsableSAV', 'Technicien'] },
      { to: '/compteurs', icon: BookOpen, label: 'Compteurs', roles: ['Administrateur', 'ResponsableSAV'] },
    ],
  },
  {
    group: 'Administration',
    items: [
      { to: '/utilisateurs', icon: UsersRound, label: 'Utilisateurs', roles: ['Administrateur'] },
      { to: '/parametres', icon: Settings, label: "Paramètres", roles: ['Administrateur'] },
    ],
  },
];

const TITLES: Record<string, string> = {
  '/': 'Tableau de bord',
  '/carte': 'Carte des clients',
  '/rapports': 'Rapports',
  '/clients': 'Clients',
  '/clients/nouveau': 'Nouveau client',
  '/copieurs': 'Parc copieurs',
  '/copieurs/nouveau': 'Nouveau copieur',
  '/attributions': 'Attributions',
  '/interventions': 'Interventions',
  '/interventions/nouvelle': 'Nouvelle intervention',
  '/compteurs': 'Compteurs',
  '/utilisateurs': 'Utilisateurs',
  '/utilisateurs/nouveau': 'Nouvel utilisateur',
  '/profil': 'Mon profil',
  '/parametres': "Paramètres de l'application",
};

function getTitle(path: string): string {
  if (TITLES[path]) return TITLES[path];
  if (path.startsWith('/clients/') && path.endsWith('/modifier')) return 'Modifier le client';
  if (path.startsWith('/clients/')) return 'Fiche client';
  if (path.startsWith('/copieurs/') && path.endsWith('/modifier')) return 'Modifier le copieur';
  if (path.startsWith('/copieurs/')) return 'Fiche copieur';
  if (path.startsWith('/attributions/')) return 'Attribuer le copieur';
  if (path.startsWith('/utilisateurs/') && path.endsWith('/modifier')) return "Modifier l'utilisateur";
  return 'BurinTrack';
}

const ROLE_LABELS: Record<string, string> = {
  Administrateur: 'Administrateur',
  ResponsableSAV: 'Responsable SAV',
  Technicien: 'Technicien',
  Consultation: 'Consultation',
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === '1');
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: dash } = useQuery<Dashboard>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
  });

  const { data: entreprise } = useQuery<{ nomSociete: string; nomApplication: string; logoBase64: string }>({
    queryKey: ['parametres-entreprise'],
    queryFn: async () => {
      const r = await api.get('/parametres');
      const found = (r.data as { cle: string; valeur: string }[]).find((p) => p.cle === 'entreprise');
      if (!found) return { nomSociete: 'BURINFORT', nomApplication: 'BurinTrack', logoBase64: '' };
      try { return JSON.parse(found.valeur); } catch { return { nomSociete: 'BURINFORT', nomApplication: 'BurinTrack', logoBase64: '' }; }
    },
    staleTime: 1000 * 60 * 10,
  });

  const appName = entreprise?.nomApplication?.trim() || 'BurinTrack';
  const appSub  = entreprise?.nomSociete?.trim()    || 'BURINFORT';
  const appLogo = entreprise?.logoBase64            || '';

  useEffect(() => {
    setSidebarOpen(false);
    setBellOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', next ? '1' : '0');
  };

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {});
    logout();
    navigate('/login');
  };

  const alertCount = (dash?.contratsExpirant30 ?? 0) + (dash?.interventionsOuvertes ?? 0);
  const displayName = user?.nomComplet || user?.email || 'Utilisateur';
  const userRole = user?.roles?.[0] ?? '';
  const role = ROLE_LABELS[userRole] ?? userRole;
  const visibleNav = NAV.map((s) => ({
    ...s,
    items: s.items.filter((item) => !item.roles || item.roles.includes(userRole)),
  })).filter((s) => s.items.length > 0);
  const title = getTitle(location.pathname);
  const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  return (
    <div className="d-flex">
      {/* ---- Overlay mobile ---- */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ============ SIDEBAR ============ */}
      <nav className={`sidebar ${sidebarOpen ? 'show' : ''} ${collapsed ? 'collapsed' : ''}`}>
        {/* Brand */}
        <Link to="/" className="sidebar-brand">
          {appLogo
            ? <img src={appLogo} alt="logo" style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 8, flexShrink: 0 }} />
            : <LogoMark size={34} />
          }
          {!collapsed && (
            <div className="sidebar-brand-text">
              <div className="brand-name">{appName}</div>
              <div className="brand-sub">par {appSub}</div>
            </div>
          )}
        </Link>

        {/* Navigation */}
        <ul className="sidebar-nav">
          {visibleNav.map((section) => (
            <li key={section.group}>
              {!collapsed && <div className="sidebar-header">{section.group}</div>}
              {collapsed && <div className="sidebar-header-divider" />}
              {section.items.map(({ to, icon: Icon, label, end }) => (
                <div key={to} className="sidebar-item">
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                    title={collapsed ? label : undefined}
                  >
                    <Icon size={18} />
                    {!collapsed && <span>{label}</span>}
                    {!collapsed && to === '/interventions' && (dash?.interventionsOuvertes ?? 0) > 0 && (
                      <span className="sidebar-badge">{dash?.interventionsOuvertes}</span>
                    )}
                    {collapsed && to === '/interventions' && (dash?.interventionsOuvertes ?? 0) > 0 && (
                      <span className="sidebar-badge-dot" />
                    )}
                  </NavLink>
                </div>
              ))}
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-user">
              <Avatar name={displayName} size={32} rounded="rounded-circle" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="user-name text-truncate">{displayName}</div>
                <div className="user-role">{role}</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="d-flex justify-content-center mb-2">
              <Avatar name={displayName} size={32} rounded="rounded-circle" />
            </div>
          )}
          <button
            onClick={handleLogout}
            className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#adb5bd', border: 'none', borderRadius: '0.35rem' }}
            title={collapsed ? 'Se déconnecter' : undefined}
          >
            <LogOut size={14} />
            {!collapsed && <span>Se déconnecter</span>}
          </button>
        </div>
      </nav>

      {/* ============ MAIN CONTENT ============ */}
      <div className={`main-content flex-grow-1 ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* ---- Topbar ---- */}
        <header className="navbar-top">
          <div className="topbar-left">
            <button
              className="btn-icon"
              onClick={() => {
                if (window.innerWidth >= 992) toggleCollapse();
                else setSidebarOpen(true);
              }}
              aria-label="Menu"
            >
              <AlignLeft size={20} />
            </button>
            <div className="topbar-breadcrumb">
              <p className="topbar-title">{title}</p>
              <p className="topbar-date">{today}</p>
            </div>
          </div>

          <div className="topbar-right">
            {/* Bell */}
            <div className="topbar-action-wrap position-relative">
              <button
                className="topbar-action-btn"
                onClick={() => { setBellOpen((v) => !v); setMenuOpen(false); }}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {alertCount > 0 && <span className="topbar-badge">{alertCount > 9 ? '9+' : alertCount}</span>}
              </button>

              {bellOpen && (
                <div className="topbar-dropdown topbar-dropdown-alerts animate-pop-in">
                  <div className="topbar-dropdown-header">
                    <span>Alertes</span>
                    {alertCount > 0 && <span className="badge badge-brand">{alertCount}</span>}
                  </div>
                  <Link to="/copieurs" onClick={() => setBellOpen(false)} className="topbar-dropdown-item">
                    <span className="topbar-dropdown-icon" style={{ background: '#fef3c7', color: '#92400e' }}>
                      <CalendarClock size={14} />
                    </span>
                    <span>
                      <div className="topbar-dropdown-item-title">
                        {dash?.contratsExpirant30 ?? 0} contrat(s) expirent dans 30 j
                      </div>
                      <div className="topbar-dropdown-item-sub">{dash?.contratsExpirant60 ?? 0} sous 60 jours</div>
                    </span>
                  </Link>
                  <Link to="/interventions" onClick={() => setBellOpen(false)} className="topbar-dropdown-item">
                    <span className="topbar-dropdown-icon" style={{ background: '#fee2e2', color: '#991b1b' }}>
                      <AlertTriangle size={14} />
                    </span>
                    <span>
                      <div className="topbar-dropdown-item-title">
                        {dash?.interventionsOuvertes ?? 0} intervention(s) à traiter
                      </div>
                      <div className="topbar-dropdown-item-sub">{dash?.interventionsEnCours ?? 0} en cours</div>
                    </span>
                  </Link>
                  <div className="topbar-dropdown-footer">
                    <Link to="/interventions" onClick={() => setBellOpen(false)} className="text-brand text-decoration-none fw-semibold" style={{ fontSize: '0.78rem' }}>
                      Voir toutes les alertes →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="topbar-divider" />

            {/* User menu */}
            <div className="topbar-action-wrap position-relative">
              <button
                className="topbar-user-btn"
                onClick={() => { setMenuOpen((v) => !v); setBellOpen(false); }}
              >
                <Avatar name={displayName} size={30} rounded="rounded-circle" />
                <span className="d-none d-sm-flex flex-column text-start" style={{ lineHeight: 1.2 }}>
                  <span className="fw-semibold text-truncate" style={{ maxWidth: '9rem', fontSize: '0.82rem', color: '#343a40' }}>
                    {displayName}
                  </span>
                  <span className="text-muted" style={{ fontSize: '0.7rem' }}>{role}</span>
                </span>
                <ChevronRight size={13} className="text-muted d-none d-sm-block" style={{ transform: menuOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </button>

              {menuOpen && (
                <div className="topbar-dropdown topbar-dropdown-user animate-pop-in">
                  <div className="topbar-dropdown-user">
                    <Avatar name={displayName} size={38} rounded="rounded-circle" />
                    <div style={{ minWidth: 0 }}>
                      <div className="fw-semibold text-truncate" style={{ fontSize: '0.85rem', color: '#343a40' }}>{displayName}</div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>{user?.email}</div>
                    </div>
                  </div>
                  <div className="topbar-dropdown-divider" />
                  <Link to="/profil" onClick={() => setMenuOpen(false)} className="topbar-dropdown-item">
                    <span className="topbar-dropdown-icon" style={{ background: '#f1f5f9', color: '#475569' }}>
                      <User size={13} />
                    </span>
                    <span className="topbar-dropdown-item-title">Mon profil</span>
                  </Link>
                  <div className="topbar-dropdown-divider" />
                  <button onClick={handleLogout} className="topbar-dropdown-item topbar-dropdown-danger w-100">
                    <span className="topbar-dropdown-icon" style={{ background: '#fee2e2', color: '#991b1b' }}>
                      <LogOut size={13} />
                    </span>
                    <span className="topbar-dropdown-item-title">Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ---- Page content ---- */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <Toaster />
    </div>
  );
}
