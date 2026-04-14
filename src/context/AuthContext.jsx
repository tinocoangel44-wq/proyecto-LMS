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
   * Si el usuario autenticado (verificado o Google) no tiene perfil, lo crea automáticamente
   * con rol "estudiante" iterando sobre upsert_oauth_profile de Supabase de manera unificada.
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

    // 2. No encontró perfil — (Sea por Google Auth o Registro de email nuevo)
    // Crear perfil automáticamente (roles siempre = estudiante por defecto de la app pública)
    const { error: upsertErr } = await upsertPerfilOAuth(authUser);

    if (!upsertErr) {
      // Volver a leer el perfil recién creado
      const { perfil: newProfile } = await getPerfilUsuario(authUser.id);
      if (newProfile) {
        setPerfil(newProfile);
        setRole(newProfile.roles?.nombre || null);
      }
    } else {
      console.error('Error al crear/unificar perfil:', upsertErr.message);
    }
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
      (event, session) => {
        console.log("Supabase Auth Event:", event);
        console.log("Session:", session);

        // Se usa setTimeout para evitar el bug de deadlock en supbase-js 
        setTimeout(async () => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            await handleUserSession(session?.user ?? null);
            
            if (event === "SIGNED_IN" && session) {
              console.log("Usuario autenticado (Unificado)");
              // SOLO ejecutar una vez (prevent infinite loop redirects)
              if (!sessionStorage.getItem("redirected")) {
                sessionStorage.setItem("redirected", "true");
                window.location.href = "/dashboard";
              }
            }
          } else if (event === 'SIGNED_OUT') {
            sessionStorage.removeItem("redirected"); // reset flag
            setUser(null);
            setRole(null);
            setPerfil(null);
          }
          setLoading(false);
        }, 0);
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
