import { supabase } from './supabase';

// ─── Roles ────────────────────────────────────────────────────────────────────

/** @deprecated Solo usar en contextos admin. El registro público siempre es "estudiante". */
export const getRoles = async () => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('id, nombre, descripcion')
      .in('nombre', ['estudiante', 'docente']);
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching roles:', error.message);
    return { data: null, error };
  }
};

/** Obtiene un rol por nombre. */
export const getRoleByName = async (roleName) => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('id')
      .eq('nombre', roleName)
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Error fetching role ${roleName}:`, error.message);
    return { data: null, error };
  }
};

/** Inserción manual de perfil (fallback / admin). */
export const createUserProfile = async (userId, userRoleId, userFullName) => {
  return await supabase.from('perfiles_usuarios').insert([
    { user_id: userId, rol_id: userRoleId, nombre_completo: userFullName, estado: 'activo' }
  ]);
};

// ─── Registro público (SIEMPRE como Estudiante) ───────────────────────────────

/**
 * Registra un nuevo usuario siempre con rol "estudiante".
 * El rol_nombre se incluye en los metadatos para que el trigger de Supabase
 * pueda leerlo al crear el perfil en perfiles_usuarios.
 * La base de datos también tiene un trigger que sobrescribe cualquier otro rol.
 */
export const registerStudent = async (email, password, nombreCompleto) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_completo: nombreCompleto,
          rol_nombre: 'estudiante', // Hint para el trigger de BD
        },
      },
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error en el registro de estudiante:', error.message);
    return { data: null, error };
  }
};

/**
 * @deprecated Usar registerStudent() en su lugar.
 * Mantenida para compatibilidad con código admin que pasa rol explícito.
 */
export const registerUser = async (email, password, nombreCompleto, rolId) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_completo: nombreCompleto,
          rol_id: rolId,
        },
      },
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error en el registro:', error.message);
    return { data: null, error };
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

/** Inicia sesión con email y contraseña. */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error en el inicio de sesión:', error.message);
    return { data: null, error };
  }
};

/** Inicia sesión con enlace mágico (OTP). */
export const signInWithMagicLink = async (email) => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error enviando enlace mágico:', error.message);
    return { data: null, error };
  }
};

// ─── Sesión ───────────────────────────────────────────────────────────────────

/** Cierra la sesión actual. */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error en el cierre de sesión:', error.message);
    return { error };
  }
};

/** Obtiene el usuario actual de Supabase Auth. */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    console.error('Error obteniendo el usuario actual:', error.message);
    return { user: null, error };
  }
};

/** Obtiene el perfil completo del usuario desde perfiles_usuarios. */
export const getPerfilUsuario = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('perfiles_usuarios')
      .select('*, roles(nombre)')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return { perfil: data, error: null };
  } catch (error) {
    console.error('Error obteniendo el perfil de usuario:', error.message);
    return { perfil: null, error };
  }
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────

/**
 * Inicia el flujo OAuth con Google.
 * Redirige al usuario a la pantalla de Google — Supabase maneja el callback.
 * Después del callback, onAuthStateChange en AuthContext recibirá SIGNED_IN.
 *
 * @param {string} [redirectTo] - URL de retorno después del login. Default: origin actual.
 */
export const signInWithGoogle = async (redirectTo) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || window.location.origin,
        queryParams: {
          // Solicitar access_type=offline para recibir refresh_token
          access_type: 'offline',
          // prompt=select_account fuerza selección de cuenta (mejor UX)
          prompt: 'select_account',
        },
      },
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error iniciando Google OAuth:', error.message);
    return { data: null, error };
  }
};

/**
 * Crea o actualiza el perfil de un usuario que autenticó vía Google OAuth.
 * Llama a la función PL/pgSQL `upsert_oauth_profile` que:
 *  - Asigna siempre el rol "estudiante"
 *  - Es idempotente (no duplica si ya existe)
 *  - Usa los metadatos de Google (full_name, avatar_url, email)
 *
 * @param {object} authUser - Objeto `user` de Supabase Auth
 */
export const upsertPerfilOAuth = async (authUser) => {
  if (!authUser) return { error: new Error('No hay usuario autenticado') };

  try {
    // Extraer datos del perfil de Google (vienen en user_metadata)
    const meta        = authUser.user_metadata || {};
    const nombre      = meta.full_name || meta.name || '';
    const avatarUrl   = meta.avatar_url || meta.picture || null;
    const email       = authUser.email || '';

    const { error } = await supabase.rpc('upsert_oauth_profile', {
      p_user_id:    authUser.id,
      p_email:      email,
      p_nombre:     nombre,
      p_avatar_url: avatarUrl,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error creando perfil OAuth:', error.message);
    return { error };
  }
};

