import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { getPerfilUsuario } from '../services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión inicial al cargar la página
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await handleUserSession(session?.user);
      setLoading(false);
    };
    checkSession();

    // Suscribirse a cambios de sesión de Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        await handleUserSession(session?.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
        setPerfil(null);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleUserSession = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setRole(null);
      setPerfil(null);
      return;
    }
    
    setUser(authUser);
    // Recuperar el rol conector desde la tabla de perfiles_usuarios
    const { perfil: userProfile, error } = await getPerfilUsuario(authUser.id);
    if (!error && userProfile) {
      setPerfil(userProfile);
      setRole(userProfile.roles?.nombre || null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, role, setRole, perfil, setPerfil, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
