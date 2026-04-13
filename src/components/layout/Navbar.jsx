import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, perfil, setUser, setRole, setPerfil } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error al cerrar sesión:", error.message);
        return;
      }
      // Limpia el usuario del contexto global para garantizar un desmonte inmediato
      setUser(null);
      setRole(null);
      setPerfil(null);
      
      // Redirige automáticamente al usuario sin esperar el broadcast onAuthStateChange
      navigate('/login');
    } catch (err) {
      console.error("Excepción inesperada durante cierre de sesión:", err);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border h-16">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 -ml-2 rounded-md lg:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-bg transition-colors"
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-dark-bg transition-colors"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          
          <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-dark-border"></div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {perfil?.nombre_completo || user?.email}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {perfil?.roles?.nombre || 'Usuario'}
              </span>
            </div>
            
            <div className="relative group">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold border-2 border-primary-200 dark:border-primary-800 cursor-pointer">
                {(perfil?.nombre_completo || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              
              {/* Dropdown temporal simple con hover grupal */}
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right">
                <div className="p-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
