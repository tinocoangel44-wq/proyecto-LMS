import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../NotificationBell';

// ── Breadcrumb mapping ─────────────────────────────────────────────────────
const BREADCRUMB_MAP = {
  '/': 'Dashboard',
  '/cursos': 'Mis Cursos',
  '/catalogo': 'Catálogo',
  '/perfil': 'Mi Perfil',
  '/dashboard-admin': 'Administración',
  '/panel-docente': 'Panel Docente',
  '/panel-estudiante': 'Panel Estudiante',
};

const getBreadcrumb = (pathname) => {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return [{ label: 'Dashboard', path: '/' }];
  const result = [{ label: 'Inicio', path: '/' }];
  let currentPath = '';
  parts.forEach(part => {
    currentPath += '/' + part;
    const label = BREADCRUMB_MAP[currentPath] || (part.charAt(0).toUpperCase() + part.slice(1));
    result.push({ label, path: currentPath });
  });
  return result;
};

// NotifBell real importado desde NotificationBell.jsx (conectado a Supabase Realtime)

// ── User menu ──────────────────────────────────────────────────────────────
const UserMenu = ({ perfil, role, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const ROLE_COLOR = {
    administrador: 'from-rose-500 to-pink-600',
    docente: 'from-indigo-500 to-violet-600',
    estudiante: 'from-emerald-500 to-teal-600',
  };

  const initial = (perfil?.nombre_completo || 'U').charAt(0).toUpperCase();
  const gradient = ROLE_COLOR[role] || 'from-primary-500 to-indigo-600';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-hover transition-all"
      >
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
          {initial}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">
            {perfil?.nombre_completo?.split(' ')[0] || 'Usuario'}
          </p>
          <p className="text-[10px] text-slate-400 capitalize">{role}</p>
        </div>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''} hidden sm:block`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-56 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-dropdown animate-slide-down z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/50">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{perfil?.nombre_completo}</p>
            <p className="text-xs text-slate-400 capitalize mt-0.5">{role}</p>
          </div>
          <div className="p-1.5">
            <Link
              to="/perfil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              Mi perfil
            </Link>
          </div>
          <div className="p-1.5 border-t border-slate-100 dark:border-dark-border">
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Navbar principal ────────────────────────────────────────────────────────
const Navbar = ({ toggleSidebar, isCollapsed }) => {
  const { perfil, role, setUser, setRole, setPerfil } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { pathname } = useLocation();
  const navigate = require('react-router-dom').useNavigate();

  const breadcrumbs = getBreadcrumb(pathname);

  const handleLogout = async () => {
    const { supabase } = await import('../../services/supabase');
    await supabase.auth.signOut();
    setUser(null); setRole(null); setPerfil(null);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-slate-200/80 dark:border-dark-border shadow-navbar">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">

        {/* Izquierda: hamburger + breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 -ml-1 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>

          {/* Breadcrumb */}
          <nav className="hidden sm:flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.path}>
                {i > 0 && (
                  <svg className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" />
                  </svg>
                )}
                {i < breadcrumbs.length - 1 ? (
                  <Link to={crumb.path} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Derecha: acciones */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover transition-all"
            title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {/* Notificaciones — Realtime desde Supabase */}
          <NotificationBell />

          <div className="w-px h-6 bg-slate-200 dark:bg-dark-border mx-0.5 hidden sm:block" />

          {/* User Avatar + Menu */}
          <UserMenu perfil={perfil} role={role} onLogout={handleLogout} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
