import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';

// ── SVG Icons ──────────────────────────────────────────────────────────────
const Icon = {
  Dashboard: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Courses: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <path d="M8 7h8M8 11h6" strokeLinecap="round" />
    </svg>
  ),
  Catalog: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    </svg>
  ),
  Profile: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ── Navegación por rol ─────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { name: 'Dashboard',     path: '/',          roles: ['administrador', 'docente', 'estudiante'], icon: Icon.Dashboard },
      { name: 'Mis Cursos',    path: '/cursos',     roles: ['administrador', 'docente'],             icon: Icon.Courses },
      { name: 'Catálogo',      path: '/catalogo',   roles: ['estudiante'],                           icon: Icon.Catalog },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      { name: 'Mi Perfil', path: '/perfil', roles: ['administrador', 'docente', 'estudiante'], icon: Icon.Profile },
      { name: 'Usuarios',  path: '/dashboard-admin', roles: ['administrador'],                  icon: Icon.Users },
    ],
  },
];

const ROLE_META = {
  administrador: { label: 'Administrador', color: 'bg-rose-500',    dot: 'bg-rose-400'   },
  docente:       { label: 'Docente',        color: 'bg-indigo-500',  dot: 'bg-indigo-400' },
  estudiante:    { label: 'Estudiante',     color: 'bg-emerald-500', dot: 'bg-emerald-400'},
};

// ── Avatar ─────────────────────────────────────────────────────────────────
const SidebarAvatar = ({ nombre, email, role, onLogout }) => {
  const meta = ROLE_META[role] || { label: role, color: 'bg-slate-500', dot: 'bg-slate-400' };
  const initial = (nombre || email || 'U').charAt(0).toUpperCase();

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-sidebar-hover transition-colors group cursor-default">
        <div className={`relative w-9 h-9 rounded-xl ${meta.color} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
          {initial}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${meta.dot} rounded-full border-2 border-sidebar-bg`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{nombre || email}</p>
          <p className="text-[10px] text-sidebar-text truncate">{meta.label}</p>
        </div>
        <button
          onClick={onLogout}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-red-400 hover:bg-red-900/20 transition-all"
          title="Cerrar sesión"
        >
          <Icon.Logout />
        </button>
      </div>
    </div>
  );
};

// ── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {
  const { role, perfil, setUser, setRole, setPerfil } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setRole(null); setPerfil(null);
    navigate('/login');
  };

  // Cierra el mobile sidebar en cambio de ruta
  useEffect(() => { setIsOpen(false); }, [location.pathname, setIsOpen]);

  const renderNav = () =>
    NAV_SECTIONS.map(section => {
      const items = section.items.filter(i => i.roles.includes(role));
      if (items.length === 0) return null;
      return (
        <div key={section.label} className="px-3 mb-2">
          {!isCollapsed && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-sidebar-text/50 px-2 mb-1.5">
              {section.label}
            </p>
          )}
          <nav className="space-y-0.5">
            {items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `nav-link group ${isActive ? 'nav-link-active' : 'nav-link-inactive'} ${isCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-sidebar-text group-hover:text-white'} transition-colors`}>
                      <item.icon />
                    </span>
                    {!isCollapsed && (
                      <span className="flex-1">{item.name}</span>
                    )}
                    {!isCollapsed && isActive && (
                      <span className="ml-auto">
                        <Icon.ChevronRight />
                      </span>
                    )}
                    {/* Tooltip en modo colapsado */}
                    {isCollapsed && (
                      <div className="absolute left-14 z-50 px-2 py-1 text-xs font-medium bg-slate-800 text-white rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity shadow-lg">
                        {item.name}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      );
    });

  const sidebarContent = (
    <aside
      className={`
        fixed top-0 left-0 z-30 h-screen
        flex flex-col
        bg-sidebar-bg border-r border-sidebar-border shadow-sidebar
        transition-[width] duration-300 ease-in-out
        ${isCollapsed ? 'w-[4.5rem]' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-sidebar-border flex-shrink-0 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
          </svg>
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <span className="text-white font-bold text-sm">Sapienta LMS</span>
            <p className="text-[10px] text-sidebar-text">Learning Platform</p>
          </div>
        )}
        {/* Colapsar en desktop */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="ml-auto p-1.5 rounded-lg text-sidebar-text hover:text-white hover:bg-sidebar-hover transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="absolute left-[68px] top-5 w-5 h-5 rounded-full bg-slate-700 border border-sidebar-border text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto sidebar-scroll py-3 space-y-1">
        {renderNav()}
      </div>

      {/* User Footer */}
      {!isCollapsed ? (
        <div className="border-t border-sidebar-border flex-shrink-0 pb-2">
          <SidebarAvatar
            nombre={perfil?.nombre_completo}
            email=""
            role={role}
            onLogout={handleLogout}
          />
        </div>
      ) : (
        <div className="border-t border-sidebar-border flex-shrink-0 py-3 flex justify-center">
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-red-400 hover:bg-red-900/20 transition-colors"
            title="Cerrar sesión"
          >
            <Icon.Logout />
          </button>
        </div>
      )}
    </aside>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">{sidebarContent}</div>

      {/* Mobile sidebar (full 256px siempre) */}
      <div className={`lg:hidden fixed top-0 left-0 z-30 h-screen w-64 bg-sidebar-bg border-r border-sidebar-border shadow-sidebar transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo mobile */}
        <div className="flex items-center h-16 px-4 gap-3 border-b border-sidebar-border flex-shrink-0">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </div>
          <div>
            <span className="text-white font-bold text-sm">Sapienta LMS</span>
            <p className="text-[10px] text-sidebar-text">Learning Platform</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="ml-auto p-1.5 rounded-lg text-sidebar-text hover:text-white hover:bg-sidebar-hover transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto sidebar-scroll py-3 space-y-1">
          {renderNav()}
        </div>
        <div className="border-t border-sidebar-border flex-shrink-0 pb-2">
          <SidebarAvatar nombre={perfil?.nombre_completo} email="" role={role} onLogout={handleLogout} />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
