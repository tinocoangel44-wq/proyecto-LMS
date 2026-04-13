import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { role } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/', roles: ['administrador', 'docente', 'estudiante'], icon: '📊' },
    { name: 'Cursos', path: '/cursos', roles: ['administrador', 'docente', 'estudiante'], icon: '📚' },
    { name: 'Mi Perfil', path: '/perfil', roles: ['administrador', 'docente', 'estudiante'], icon: '👤' },
    // Admin specific
    { name: 'Usuarios', path: '/admin/usuarios', roles: ['administrador'], icon: '👥' },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={`fixed top-0 left-0 z-30 h-screen w-64 bg-white dark:bg-dark-card border-r border-slate-200 dark:border-dark-border transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-dark-border">
          <div className="flex items-center gap-2 font-bold text-xl text-primary-600 dark:text-primary-400">
            <span>🎓</span>
            <span>LMS Portal</span>
          </div>
        </div>
        
        <div className="p-4">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
            Menu Principal
          </div>
          <nav className="space-y-1">
            {filteredNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-dark-bg/50 dark:hover:text-slate-200'
                  }`
                }
              >
                <span>{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
