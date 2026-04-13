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
