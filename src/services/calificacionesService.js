import { supabase } from './supabase';

// Inyectar calificación asegurando la asignación excluyente y enlazando perfiles
export const asentarCalificacion = async ({ estudianteId, docenteId, tipoOrigen, origenId, calificacion, retroalimentacion }) => {
  
  // Garantizar que postgres reciba el origin excluyente solicitado por su CHECK
  const insertPayload = {
    estudiante_id: estudianteId,
    docente_id: docenteId,
    tipo_origen: tipoOrigen, // 'tarea' o 'cuestionario'
    calificacion: parseFloat(calificacion),
    retroalimentacion: retroalimentacion || null,
  };

  if (tipoOrigen === 'tarea') {
    insertPayload.entrega_id = origenId;
    insertPayload.intento_id = null;
  } else if (tipoOrigen === 'cuestionario') {
    insertPayload.intento_id = origenId;
    insertPayload.entrega_id = null;
  }

  const { data, error } = await supabase
    .from('calificaciones')
    .insert([insertPayload])
    .select()
    .single();

  // Opcional: Actualizar el estado de la entrega a "calificada" para trackeo visual
  if (!error && tipoOrigen === 'tarea') {
     await supabase.from('entregas_tareas').update({ estado: 'calificada' }).eq('id', origenId);
  }

  return { data, error };
};

// Obtener todas las entregas para una Tarea específica
export const getEntregasDeTarea = async (tareaId) => {
  const { data, error } = await supabase
    .from('entregas_tareas')
    .select(`
      *,
      perfiles_usuarios (nombre_completo, avatar_url),
      calificaciones (*)
    `)
    .eq('tarea_id', tareaId);
    
  return { data, error };
};
