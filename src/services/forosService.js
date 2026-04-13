import { supabase } from './supabase';

// Extraer foros disponibles para un curso
export const getForosPorCurso = async (cursoId) => {
  const { data, error } = await supabase
    .from('foros')
    .select('*')
    .eq('curso_id', cursoId)
    .order('created_at', { ascending: false });
  return { data, error };
};

// Crear un espacio de Foro (Docentes/Admins normalmente)
export const createForo = async ({ cursoId, titulo, descripcion }) => {
  const { data, error } = await supabase
    .from('foros')
    .insert([{ curso_id: cursoId, titulo, descripcion, estado: 'activo' }])
    .select()
    .single();
  return { data, error };
};

// Obtener TODO el hilo de mensajería dentro de un foro
export const getMensajesPorForo = async (foroId) => {
  const { data, error } = await supabase
    .from('mensajes_foro')
    .select(`
      *,
      perfiles_usuarios(nombre_completo, avatar_url)
    `)
    .eq('foro_id', foroId)
    .order('created_at', { ascending: true }); // Orden cronológico para los hilos
  return { data, error };
};

// Publicar un mensaje (Raíz o Respuesta)
export const publicarMensaje = async ({ foroId, autorId, parentId, contenido }) => {
  const { data, error } = await supabase
    .from('mensajes_foro')
    .insert([{ 
       foro_id: foroId, 
       autor_id: autorId, 
       parent_id: parentId || null, 
       contenido 
    }])
    .select()
    .single();
  return { data, error };
};
