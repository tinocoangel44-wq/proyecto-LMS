import { supabase } from './supabase';

// ── Obtener foros de un curso con conteo de mensajes ───────────────────────
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

// ── Crear foro (docente/admin) ─────────────────────────────────────────────
export const createForo = async ({ cursoId, creadorId, titulo, descripcion }) => {
  const { data, error } = await supabase
    .from('foros')
    .insert([{
      curso_id: cursoId,
      creado_por: creadorId,   // perfil_id (FK → perfiles_usuarios.id)
      titulo: titulo?.trim(),
      descripcion: descripcion?.trim() || null,
      estado: 'activo',
    }])
    .select()
    .single();
  return { data, error };
};

// ── Eliminar foro (soft delete) ────────────────────────────────────────────
export const deleteForo = async (foroId) => {
  return await supabase.from('foros').update({ estado: 'eliminado' }).eq('id', foroId);
};

// ── Mensajes de un foro (plano, se organiza en árbol en el cliente) ────────
export const getMensajesPorForo = async (foroId) => {
  const { data, error } = await supabase
    .from('mensajes_foro')
    .select(`
      id, contenido, mensaje, parent_id, created_at, editado, estado,
      perfiles_usuarios:usuario_id (id, nombre_completo, avatar_url)
    `)
    .eq('foro_id', foroId)
    .neq('estado', 'eliminado')
    .order('created_at', { ascending: true });

  // Normalizar: usar 'contenido' si existe, fallback a 'mensaje'
  const normalizado = (data || []).map(m => ({
    ...m,
    contenido: m.contenido || m.mensaje || '',
    perfiles_usuarios: m['perfiles_usuarios'] || null,
  }));

  return { data: normalizado, error };
};

// ── Publicar mensaje ───────────────────────────────────────────────────────
// usuario_id y autor_id apuntan a perfiles_usuarios.id (FK verificado)
// El trigger trg_sync_mensajes_foro sincroniza ambas columnas
export const publicarMensaje = async ({ foroId, autorId, parentId, contenido }) => {
  const { data, error } = await supabase
    .from('mensajes_foro')
    .insert([{
      foro_id: foroId,
      usuario_id: autorId,       // FK → perfiles_usuarios.id
      autor_id: autorId,         // alias, sincronizado por trigger
      parent_id: parentId || null,
      mensaje: contenido?.trim(),
      contenido: contenido?.trim(),
      estado: 'activo',
    }])
    .select(`
      id, contenido, mensaje, parent_id, created_at,
      perfiles_usuarios:usuario_id (id, nombre_completo, avatar_url)
    `)
    .single();

  if (data) {
    data.contenido = data.contenido || data.mensaje || '';
  }

  return { data, error };
};

// ── Eliminar mensaje (soft delete) ────────────────────────────────────────
export const deleteMensaje = async (mensajeId) => {
  return await supabase
    .from('mensajes_foro')
    .update({
      estado: 'eliminado',
      contenido: '[Mensaje eliminado]',
      mensaje: '[Mensaje eliminado]',
    })
    .eq('id', mensajeId);
};

// ── Suscripción Realtime para un foro ─────────────────────────────────────
// Retorna un canal de Supabase — llama .unsubscribe() al desmontar
export const subscribeToForo = (foroId, onNewMessage) => {
  const channel = supabase
    .channel(`foro-${foroId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes_foro',
        filter: `foro_id=eq.${foroId}`,
      },
      (payload) => {
        const msg = payload.new;
        // Normalizar el nuevo mensaje antes de pasarlo al handler
        onNewMessage({
          ...msg,
          contenido: msg.contenido || msg.mensaje || '',
        });
      }
    )
    .subscribe();

  return channel;
};

// ── Construir árbol de mensajes desde array plano ─────────────────────────
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
