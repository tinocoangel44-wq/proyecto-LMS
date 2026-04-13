import { supabase } from './supabase';

export const getUsuariosGrl = async () => {
    // Al ser admin, el RLS permite leer todo
    const { data, error } = await supabase
        .from('perfiles_usuarios')
        .select(`
            *,
            roles(nombre)
        `)
        .order('created_at', { ascending: false });
    
    if (error) console.error("Error obteniendo usuarios:", error);
    return { data, error };
};

export const crearUsuarioAdmin = async ({ email, password, nombreCompleto, rol }) => {
    const { data, error } = await supabase.rpc('crear_usuario_admin', {
        p_email: email,
        p_password: password,
        p_nombre_completo: nombreCompleto,
        p_rol_nombre: rol
    });
    return { data, error };
};

export const eliminarUsuarioAdmin = async (userId) => {
    const { data, error } = await supabase.rpc('eliminar_usuario_admin', {
        p_user_id: userId
    });
    return { data, error };
};
