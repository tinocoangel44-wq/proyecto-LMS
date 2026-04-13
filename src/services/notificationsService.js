import { supabase } from './supabase';

// ─── Tipos de notificación reconocidos ───────────────────────────────────────
export const NOTIF_TIPOS = {
  TAREA:        'tarea',
  CALIFICACION: 'calificacion',
  MATERIAL:     'material',
  FORO:         'foro',
  CURSO:        'curso',
  ENTREGA:      'entrega',
  SISTEMA:      'sistema',
};

// Íconos por tipo (emojis accesibles, sin dependencias externas)
export const NOTIF_ICONS = {
  tarea:        '📝',
  calificacion: '✅',
  material:     '📚',
  foro:         '💬',
  curso:        '🎓',
  entrega:      '📤',
  sistema:      '🔔',
};

// ─── Obtener perfil_id del usuario actual ────────────────────────────────────
// Las notificaciones usan perfiles_usuarios.id, NO auth.uid()
export const getPerfilId = async (authUserId) => {
  const { data, error } = await supabase
    .from('perfiles_usuarios')
    .select('id')
    .eq('user_id', authUserId)
    .single();
  if (error) return null;
  return data?.id ?? null;
};

// ─── Obtener notificaciones del usuario actual ───────────────────────────────
/**
 * @param {string} perfilId  — perfiles_usuarios.id del usuario actual
 * @param {number} limit     — cuántas traer (default 20)
 */
export const getNotificaciones = async (perfilId, limit = 20) => {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', perfilId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: data ?? [], error };
};

// ─── Contar no leídas ────────────────────────────────────────────────────────
export const countNoLeidas = async (perfilId) => {
  const { count, error } = await supabase
    .from('notificaciones')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', perfilId)
    .eq('leida', false);
  return { count: count ?? 0, error };
};

// ─── Insertar notificación ───────────────────────────────────────────────────
/**
 * Crea una notificación para un destinatario (por perfil_id).
 * Se llama desde los servicios cuando ocurre un evento relevante.
 *
 * @param {object} payload
 * @param {string} payload.usuario_id       — perfiles_usuarios.id del destinatario
 * @param {string} payload.titulo
 * @param {string} payload.mensaje
 * @param {string} payload.tipo_notificacion — ver NOTIF_TIPOS
 */
export const insertNotificacion = async ({ usuario_id, titulo, mensaje, tipo_notificacion }) => {
  const { data, error } = await supabase
    .from('notificaciones')
    .insert([{ usuario_id, titulo, mensaje, tipo_notificacion, leida: false }])
    .select()
    .single();
  if (error) console.error('Error insertando notificación:', error.message);
  return { data, error };
};

// ─── Marcar una notificación como leída ─────────────────────────────────────
export const marcarLeida = async (notifId) => {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true, fecha_leida: new Date().toISOString() })
    .eq('id', notifId);
  return { error };
};

// ─── Marcar TODAS como leídas ────────────────────────────────────────────────
export const marcarTodasLeidas = async (perfilId) => {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true, fecha_leida: new Date().toISOString() })
    .eq('usuario_id', perfilId)
    .eq('leida', false);
  return { error };
};

// ─── Eliminar una notificación ───────────────────────────────────────────────
export const eliminarNotificacion = async (notifId) => {
  const { error } = await supabase
    .from('notificaciones')
    .delete()
    .eq('id', notifId);
  return { error };
};

// ─── Suscripción Realtime ────────────────────────────────────────────────────
/**
 * Crea un canal Supabase Realtime que escucha INSERT en notificaciones
 * filtrado por el usuario_id del perfil actual.
 *
 * @param {string}   perfilId   — perfiles_usuarios.id
 * @param {Function} onNew      — callback({ new: notificacion })
 * @returns canal (llamar canal.unsubscribe() al desmontar)
 */
export const suscribirNotificaciones = (perfilId, onNew) => {
  const canal = supabase
    .channel(`notificaciones-${perfilId}`)
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'notificaciones',
        filter: `usuario_id=eq.${perfilId}`,
      },
      (payload) => onNew(payload.new)
    )
    .subscribe();

  return canal;
};
