import { supabase } from './supabase';

// ── Obtener mensajes de un curso (últimos 60) ───────────────────────────────
export const getMensajesCurso = async (cursoId) => {
  const { data, error } = await supabase
    .from('mensajes')
    .select(`
      id,
      contenido,
      created_at,
      remitente_id,
      perfiles_usuarios!mensajes_remitente_id_fkey (
        id, nombre_completo, avatar_url,
        roles ( nombre )
      )
    `)
    .eq('curso_id', cursoId)
    .order('created_at', { ascending: true })
    .limit(60);
  return { data: data ?? [], error };
};

// ── Enviar mensaje ──────────────────────────────────────────────────────────
export const enviarMensaje = async ({ cursoId, remitenteId, contenido }) => {
  const { data, error } = await supabase
    .from('mensajes')
    .insert([{ curso_id: cursoId, remitente_id: remitenteId, contenido: contenido.trim() }])
    .select(`
      id,
      contenido,
      created_at,
      remitente_id,
      perfiles_usuarios!mensajes_remitente_id_fkey (
        id, nombre_completo, avatar_url,
        roles ( nombre )
      )
    `)
    .single();
  return { data, error };
};

// ── Suscripción Realtime al chat de un curso ────────────────────────────────
export const suscribirChat = (cursoId, onNuevoMensaje) => {
  const canal = supabase
    .channel(`chat-curso-${cursoId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
        filter: `curso_id=eq.${cursoId}`,
      },
      async (payload) => {
        // Enriquecer con perfil del remitente (incluyendo rol real)
        const { data: perfil } = await supabase
          .from('perfiles_usuarios')
          .select('id, nombre_completo, avatar_url, roles(nombre)')
          .eq('id', payload.new.remitente_id)
          .single();

        onNuevoMensaje({
          ...payload.new,
          perfiles_usuarios: perfil ?? null,
        });
      }
    )
    .subscribe();

  return canal;
};
