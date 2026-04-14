import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { getPerfilUsuario, upsertPerfilOAuth } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [role,    setRole]    = useState(null);
  const [perfil,  setPerfil]  = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Maneja la sesión de cualquier usuario autenticado (email o OAuth).
   * Si el usuario autenticó con Google y no tiene perfil, lo crea automáticamente
   * con rol "estudiante" via la función upsert_oauth_profile de Supabase.
   */
  const handleUserSession = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setRole(null);
      setPerfil(null);
      return;
    }

    setUser(authUser);

    // 1. Intentar obtener el perfil existente
    const { perfil: userProfile, error } = await getPerfilUsuario(authUser.id);

    if (!error && userProfile) {
      // Perfil encontrado → actualizar contexto
      setPerfil(userProfile);
      setRole(userProfile.roles?.nombre || null);
      return;
    }

    // 2. No encontró perfil — puede ser primer login con Google u OAuth
    const isOAuthUser = authUser.app_metadata?.provider !== 'email';

    if (isOAuthUser) {
      // Crear perfil automáticamente (roles siempre = estudiante)
      const { error: upsertErr } = await upsertPerfilOAuth(authUser);

      if (!upsertErr) {
        // Volver a leer el perfil recién creado
        const { perfil: newProfile } = await getPerfilUsuario(authUser.id);
        if (newProfile) {
          setPerfil(newProfile);
          setRole(newProfile.roles?.nombre || null);
        }
      } else {
        console.error('Error al crear perfil OAuth:', upsertErr.message);
      }
    }
    // Si es email sin perfil: el trigger de la BD debería haberlo creado
    // No hacemos nada extra — puede llegar en el próximo ciclo de auth
  }, []);

  useEffect(() => {
    // ── Verificar sesión inicial ──────────────────────────────────
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error('Supabase Session Error:', error.message);
        await handleUserSession(data?.session?.user || null);
      } catch (err) {
        console.error('Critical session check failure:', err);
      } finally {
        setLoading(false);
      }
    };
    checkSession();

    // ── Suscripción a cambios de autenticación ────────────────────
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          await handleUserSession(session?.user ?? null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setRole(null);
          setPerfil(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [handleUserSession]);

  return (
    <AuthContext.Provider value={{ user, setUser, role, setRole, perfil, setPerfil, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};
