import { supabase } from './supabase';

// Función para obtener roles desde la base de datos
export const getRoles = async () => {
  try {
    const { data, error } = await supabase.from('roles').select('id, nombre, descripcion').in('nombre', ['estudiante', 'docente']);
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching roles:', error.message);
    return { data: null, error };
  }
};

// Obtener un rol por nombre
export const getRoleByName = async (roleName) => {
  try {
    const { data, error } = await supabase.from('roles').select('id').eq('nombre', roleName).single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Error fetching role ${roleName}:`, error.message);
    return { data: null, error };
  }
};

// Extensión para perfil por si se requiere un fallback del trigger (placeholder)
export const createUserProfile = async (userId, userRoleId, userFullName) => {
  return await supabase.from('perfiles_usuarios').insert([
    { user_id: userId, rol_id: userRoleId, nombre_completo: userFullName, estado: 'activo' }
  ]);
};

// Registro de usuario dinámico (Reemplazo avanzado)
export const registerUser = async (email, password, nombreCompleto, rolId) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_completo: nombreCompleto,
          rol_id: rolId
        }
      }
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error en el registro:', error.message);
    return { data: null, error };
  }
};

// Inicio de sesión automático / normal con contraseña
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

// Inicio de sesión con Enlace Mágico (OTP)
export const signInWithMagicLink = async (email) => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      }
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error enviando enlace mágico:', error.message);
    return { data: null, error };
  }
};

// Cierre de sesión
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

// Obtener usuario actual
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

// Obtener PERFIL de usuario basado en su ID de autenticación
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
