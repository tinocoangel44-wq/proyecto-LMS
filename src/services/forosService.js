import { supabase } from './supabase';

// Obtener foros de un curso con conteo de mensajes
export const getForosPorCurso = async (cursoId) => {
  const { data, error } = await supabase
    .from('foros')
    .select(`
      *,
      mensajes_foro (id)
    `)
    .eq('curso_id', cursoId)
    .neq('estado', 'eliminado')
    .order('created_at', { ascending: true });
  return { data, error };
};

// Crear foro (docente/admin)
export const createForo = async ({ cursoId, creadorId, titulo, descripcion }) => {
  const { data, error } = await supabase
    .from('foros')
    .insert([{
      curso_id: cursoId,
      creado_por: creadorId,
      titulo: titulo?.trim(),
      descripcion: descripcion?.trim() || null,
      estado: 'activo',
    }])
    .select()
    .single();
  return { data, error };
};

// Eliminar foro (soft delete)
export const deleteForo = async (foroId) => {
  return await supabase.from('foros').update({ estado: 'eliminado' }).eq('id', foroId);
};

// Mensajes de un foro (flat, se organiza en árbol en el cliente)
export const getMensajesPorForo = async (foroId) => {
  const { data, error } = await supabase
    .from('mensajes_foro')
    .select(`
      id, contenido, parent_id, created_at, editado, estado,
      perfiles_usuarios (id, nombre_completo, avatar_url)
    `)
    .eq('foro_id', foroId)
    .neq('estado', 'eliminado')
    .order('created_at', { ascending: true });
  return { data, error };
};

// Publicar mensaje
export const publicarMensaje = async ({ foroId, autorId, parentId, contenido }) => {
  const { data, error } = await supabase
    .from('mensajes_foro')
    .insert([{
      foro_id: foroId,
      autor_id: autorId,
      parent_id: parentId || null,
      contenido: contenido?.trim(),
      estado: 'activo',
    }])
    .select(`
      id, contenido, parent_id, created_at,
      perfiles_usuarios (id, nombre_completo, avatar_url)
    `)
    .single();
  return { data, error };
};

// Eliminar mensaje (soft delete)
export const deleteMensaje = async (mensajeId) => {
  return await supabase
    .from('mensajes_foro')
    .update({ estado: 'eliminado', contenido: '[Mensaje eliminado]' })
    .eq('id', mensajeId);
};

// Construir árbol de mensajes desde array plano
export const buildMessageTree = (messages) => {
  const map = new Map();
  const roots = [];

  messages.forEach(msg => map.set(msg.id, { ...msg, replies: [] }));
  messages.forEach(msg => {
    if (msg.parent_id && map.has(msg.parent_id)) {
      map.get(msg.parent_id).replies.push(map.get(msg.id));
    } else {
      roots.push(map.get(msg.id));
    }
  });

  return roots;
};
